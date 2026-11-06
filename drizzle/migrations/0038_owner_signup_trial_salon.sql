CREATE OR REPLACE FUNCTION public.can_create_own_salon(_owner uuid)
 RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$ SELECT _owner IS NOT NULL AND _owner = auth.uid() AND NOT EXISTS (SELECT 1 FROM public.salons WHERE owner_id=_owner) $$;

CREATE OR REPLACE FUNCTION public.grant_trial_license()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
BEGIN
 INSERT INTO public.licencas_nacionais(salao_id,email_cliente,data_inicio,data_expira,status,tipo_plano,aceitou_termos)
 VALUES(NEW.id,coalesce((SELECT email FROM public.profiles WHERE id=NEW.owner_id),''),now(),now()+interval '7 days','liberado','mensal',false)
 ON CONFLICT(salao_id) DO NOTHING;
 INSERT INTO public.user_roles(user_id,role) VALUES(NEW.owner_id,'dono_salao') ON CONFLICT DO NOTHING;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.grant_trial_license() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS zz_grant_trial_license ON public.salons;
CREATE TRIGGER zz_grant_trial_license AFTER INSERT ON public.salons FOR EACH ROW EXECUTE FUNCTION public.grant_trial_license();

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE _role text:=coalesce(new.raw_user_meta_data->>'role','cliente'); _purchase public.subscription_requests; _ref uuid; _salon text:=trim(coalesce(new.raw_user_meta_data->>'salon_name',''));
BEGIN
 INSERT INTO public.profiles(id,full_name,email) VALUES(new.id,coalesce(new.raw_user_meta_data->>'full_name',''),new.email);
 IF _role NOT IN ('revendedor','dono_salao','cliente') THEN _role:='cliente'; END IF;
 INSERT INTO public.user_roles(user_id,role) VALUES(new.id,_role::public.app_role) ON CONFLICT DO NOTHING;
 IF _role='revendedor' THEN INSERT INTO public.resellers(user_id,code) VALUES(new.id,upper(substr(replace(new.id::text,'-',''),1,8))); END IF;
 SELECT * INTO _purchase FROM public.subscription_requests WHERE status='confirmado' AND lower(email)=lower(new.email) AND (user_id IS NULL OR user_id=new.id) ORDER BY created_at DESC LIMIT 1;
 IF FOUND OR (_role='dono_salao' AND _salon<>'') THEN
  SELECT user_id INTO _ref FROM public.resellers WHERE lower(code)=lower(new.raw_user_meta_data->>'ref') AND user_id<>new.id;
  INSERT INTO public.salons(owner_id,name,slug,city,plan_id,reseller_id) VALUES(new.id,_salon,'salao-'||replace(new.id::text,'-',''),nullif(new.raw_user_meta_data->>'city',''),_purchase.plan_id,_ref);
  INSERT INTO public.user_roles(user_id,role) VALUES(new.id,'dono_salao') ON CONFLICT DO NOTHING;
  IF _purchase.id IS NOT NULL THEN UPDATE public.subscription_requests SET user_id=new.id WHERE id=_purchase.id; END IF;
 END IF;
 RETURN new;
END $$;