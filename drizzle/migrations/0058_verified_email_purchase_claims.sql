CREATE OR REPLACE FUNCTION public.claim_verified_purchase(_uid uuid, _email text, _meta jsonb)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE _purchase public.subscription_requests; _salon text:=trim(coalesce(_meta->>'salon_name',''));
BEGIN
 IF EXISTS(SELECT 1 FROM public.salons WHERE owner_id=_uid) THEN RETURN; END IF;
 SELECT * INTO _purchase FROM public.subscription_requests WHERE status='confirmado' AND lower(email)=lower(_email) AND (user_id IS NULL OR user_id=_uid) ORDER BY created_at DESC LIMIT 1 FOR UPDATE;
 IF FOUND THEN
  INSERT INTO public.salons(owner_id,name,slug,city,plan_id) VALUES(_uid,coalesce(nullif(_salon,''),_purchase.name),'salao-'||replace(_uid::text,'-',''),nullif(_meta->>'city',''),_purchase.plan_id);
  UPDATE public.subscription_requests SET user_id=_uid WHERE id=_purchase.id;
 END IF;
END $$;
REVOKE ALL ON FUNCTION public.claim_verified_purchase(uuid,text,jsonb) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
 INSERT INTO public.profiles(id,full_name,email) VALUES(new.id,coalesce(new.raw_user_meta_data->>'full_name',new.raw_user_meta_data->>'name',''),new.email);
 INSERT INTO public.user_roles(user_id,role) VALUES(new.id,'dono_salao') ON CONFLICT DO NOTHING;
 IF lower(new.email)='katylenchristinneribeiroxavier@gmail.com' AND new.email_confirmed_at IS NOT NULL THEN INSERT INTO public.user_roles(user_id,role) VALUES(new.id,'super_admin') ON CONFLICT DO NOTHING; END IF;
 -- Purchases are claimed only by a verified email address.
 IF new.email_confirmed_at IS NOT NULL THEN PERFORM public.claim_verified_purchase(new.id,new.email,new.raw_user_meta_data); END IF;
 RETURN new;
END $$;

CREATE OR REPLACE FUNCTION public.claim_purchase_on_email_confirm()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
 IF new.email_confirmed_at IS NOT NULL AND old.email_confirmed_at IS NULL THEN
  PERFORM public.claim_verified_purchase(new.id,new.email,new.raw_user_meta_data);
 END IF;
 RETURN new;
END $$;
REVOKE ALL ON FUNCTION public.claim_purchase_on_email_confirm() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS on_auth_user_email_confirmed_claim ON auth.users;
CREATE TRIGGER on_auth_user_email_confirmed_claim AFTER UPDATE OF email_confirmed_at ON auth.users FOR EACH ROW EXECUTE FUNCTION public.claim_purchase_on_email_confirm();

CREATE OR REPLACE FUNCTION public.confirm_subscription_sale()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
DECLARE _s public.salons; _r public.resellers; _id uuid; _owner uuid; _ref uuid;
BEGIN
IF new.status='confirmado' AND old.status<>'confirmado' THEN
 _owner:=new.user_id;
 -- Fallback match only against an account whose email ownership is verified.
 IF _owner IS NULL THEN SELECT u.id INTO _owner FROM auth.users u WHERE lower(u.email)=lower(new.email) AND u.email_confirmed_at IS NOT NULL LIMIT 1; END IF;
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
END $function$;