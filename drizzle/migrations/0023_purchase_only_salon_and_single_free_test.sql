ALTER TABLE public.subscription_requests ADD COLUMN is_test_purchase boolean NOT NULL DEFAULT false;
CREATE TABLE public.platform_test_purchase(id boolean PRIMARY KEY DEFAULT true CHECK(id),request_id uuid NOT NULL UNIQUE REFERENCES public.subscription_requests(id),salon_id uuid NOT NULL UNIQUE REFERENCES public.salons(id),redeemed_by uuid NOT NULL,redeemed_at timestamptz NOT NULL DEFAULT now());
REVOKE ALL ON public.platform_test_purchase FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.platform_test_purchase TO authenticated;
GRANT ALL ON public.platform_test_purchase TO service_role;
ALTER TABLE public.platform_test_purchase ENABLE ROW LEVEL SECURITY;
CREATE POLICY test_purchase_master_read ON public.platform_test_purchase FOR SELECT TO authenticated USING(public.has_role(auth.uid(),'super_admin'));
CREATE FUNCTION public.protect_test_purchase_flag() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF new.is_test_purchase AND auth.role()<>'service_role' AND NOT public.has_role(auth.uid(),'super_admin') THEN RAISE EXCEPTION 'Compra de teste exclusiva da desenvolvedora'; END IF; RETURN new; END $$;
CREATE TRIGGER test_purchase_flag BEFORE INSERT OR UPDATE OF is_test_purchase ON public.subscription_requests FOR EACH ROW EXECUTE FUNCTION public.protect_test_purchase_flag();
CREATE OR REPLACE FUNCTION public.confirm_subscription_sale() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE _s public.salons; _r public.resellers; _id uuid; _owner uuid; _ref uuid;
BEGIN
IF new.status='confirmado' AND old.status<>'confirmado' THEN
 _owner:=new.user_id;
 IF _owner IS NULL THEN SELECT id INTO _owner FROM public.profiles WHERE lower(email)=lower(new.email) LIMIT 1; END IF;
 IF _owner IS NOT NULL THEN
  SELECT * INTO _s FROM public.salons WHERE owner_id=_owner LIMIT 1;
  IF _s.id IS NULL THEN
   SELECT r.user_id INTO _ref FROM public.resellers r JOIN auth.users u ON u.id=_owner WHERE lower(r.code)=lower(u.raw_user_meta_data->>'ref') AND r.user_id<>_owner;
   INSERT INTO public.salons(owner_id,name,slug,plan_id,status,reseller_id) VALUES(_owner,new.name,'salao-'||replace(_owner::text,'-',''),new.plan_id,'ativo',_ref) RETURNING * INTO _s;
  END IF;
  INSERT INTO public.user_roles(user_id,role) VALUES(_owner,'dono_salao') ON CONFLICT DO NOTHING;
  UPDATE public.salons SET status='ativo',plan_id=new.plan_id WHERE id=_s.id;
  IF NOT new.is_test_purchase THEN
   SELECT * INTO _r FROM public.resellers WHERE user_id=_s.reseller_id AND user_id<>_s.owner_id;
   IF _r.user_id IS NOT NULL THEN
    INSERT INTO public.referral_sales(salon_id,reseller_id,request_id,buyer_name,amount,applied_pct,commission) VALUES(_s.id,_r.user_id,new.id,new.name,new.amount,_r.commission_pct,round(new.amount*_r.commission_pct/100,2)) ON CONFLICT(request_id) DO NOTHING RETURNING id INTO _id;
    IF _id IS NOT NULL THEN INSERT INTO public.referral_notifications(salon_id,sale_id,message) VALUES(_s.id,_id,'Nova venda por indicação de '||coalesce((SELECT full_name FROM public.profiles WHERE id=_r.user_id),'')||'. Cliente: '||new.name||'. Comissão: R$ '||round(new.amount*_r.commission_pct/100,2)); END IF;
   END IF;
  END IF;
 END IF;
END IF;
RETURN new;
END $$;
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE _role text:=coalesce(new.raw_user_meta_data->>'role','cliente'); _purchase public.subscription_requests; _ref uuid;
BEGIN
 INSERT INTO public.profiles(id,full_name,email) VALUES(new.id,coalesce(new.raw_user_meta_data->>'full_name',''),new.email);
 IF _role NOT IN ('revendedor','dono_salao','cliente') THEN _role:='cliente'; END IF;
 INSERT INTO public.user_roles(user_id,role) VALUES(new.id,_role::public.app_role) ON CONFLICT DO NOTHING;
 IF _role='revendedor' THEN INSERT INTO public.resellers(user_id,code) VALUES(new.id,upper(substr(replace(new.id::text,'-',''),1,8))); END IF;
 SELECT * INTO _purchase FROM public.subscription_requests WHERE status='confirmado' AND lower(email)=lower(new.email) AND (user_id IS NULL OR user_id=new.id) ORDER BY created_at DESC LIMIT 1;
 IF FOUND THEN
  SELECT user_id INTO _ref FROM public.resellers WHERE lower(code)=lower(new.raw_user_meta_data->>'ref') AND user_id<>new.id;
  INSERT INTO public.salons(owner_id,name,slug,city,plan_id,reseller_id) VALUES(new.id,coalesce(new.raw_user_meta_data->>'salon_name',''),'salao-'||replace(new.id::text,'-',''),new.raw_user_meta_data->>'city',_purchase.plan_id,_ref);
  INSERT INTO public.user_roles(user_id,role) VALUES(new.id,'dono_salao') ON CONFLICT DO NOTHING;
  UPDATE public.subscription_requests SET user_id=new.id WHERE id=_purchase.id;
 END IF;
 RETURN new;
END $$;
CREATE FUNCTION public.redeem_single_test_purchase(_name text,_city text DEFAULT '') RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE _request uuid; _salon uuid; _plan uuid; _email text;
BEGIN
 IF NOT public.has_role(auth.uid(),'super_admin') THEN RAISE EXCEPTION 'Somente a desenvolvedora pode liberar a compra gratuita'; END IF;
 IF char_length(_name)>100 OR char_length(_city)>100 THEN RAISE EXCEPTION 'Dados inválidos'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended('iaxis:single-test-purchase',0));
 IF EXISTS(SELECT 1 FROM public.platform_test_purchase) THEN RAISE EXCEPTION 'A única compra gratuita já foi utilizada'; END IF;
 IF EXISTS(SELECT 1 FROM public.salons WHERE owner_id=auth.uid()) THEN RAISE EXCEPTION 'Sua conta já possui um salão'; END IF;
 SELECT id INTO _plan FROM public.plans ORDER BY sort DESC LIMIT 1;
 IF _plan IS NULL THEN RAISE EXCEPTION 'Cadastre os planos primeiro'; END IF;
 SELECT email INTO _email FROM public.profiles WHERE id=auth.uid();
 INSERT INTO public.subscription_requests(user_id,name,email,plan_id,billing,amount,status,is_test_purchase) VALUES(auth.uid(),btrim(_name),coalesce(_email,''),_plan,'mensal',0,'aguardando',true) RETURNING id INTO _request;
 UPDATE public.subscription_requests SET status='confirmado' WHERE id=_request;
 SELECT id INTO _salon FROM public.salons WHERE owner_id=auth.uid() LIMIT 1;
 UPDATE public.salons SET name=btrim(_name),city=btrim(_city) WHERE id=_salon;
 INSERT INTO public.platform_test_purchase(id,request_id,salon_id,redeemed_by) VALUES(true,_request,_salon,auth.uid());
 INSERT INTO public.platform_automation_audit(performed_by,action) VALUES(auth.uid(),'Única compra gratuita de teste liberada; sem faturamento ou comissão');
 RETURN _salon;
END $$;
REVOKE ALL ON FUNCTION public.redeem_single_test_purchase(text,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.redeem_single_test_purchase(text,text) TO authenticated;