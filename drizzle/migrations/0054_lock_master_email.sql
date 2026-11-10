CREATE OR REPLACE FUNCTION public.guard_super_admin_role() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF new.role='super_admin' AND NOT EXISTS(SELECT 1 FROM auth.users u WHERE u.id=new.user_id AND lower(u.email)='katylenchristinneribeiroxavier@gmail.com' AND u.email_confirmed_at IS NOT NULL) THEN
  RAISE EXCEPTION 'Somente a conta master autorizada pode ter acesso de desenvolvedora';
 END IF;
 RETURN new;
END $$;
DROP TRIGGER IF EXISTS guard_super_admin_role ON public.user_roles;
CREATE TRIGGER guard_super_admin_role BEFORE INSERT OR UPDATE ON public.user_roles FOR EACH ROW EXECUTE FUNCTION public.guard_super_admin_role();

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE _role text:=coalesce(new.raw_user_meta_data->>'role','dono_salao'); _purchase public.subscription_requests; _ref uuid; _salon text:=trim(coalesce(new.raw_user_meta_data->>'salon_name',''));
BEGIN
 INSERT INTO public.profiles(id,full_name,email) VALUES(new.id,coalesce(new.raw_user_meta_data->>'full_name',new.raw_user_meta_data->>'name',''),new.email);
 IF _role NOT IN ('revendedor','dono_salao','cliente') THEN _role:='dono_salao'; END IF;
 INSERT INTO public.user_roles(user_id,role) VALUES(new.id,_role::public.app_role) ON CONFLICT DO NOTHING;
 IF lower(new.email)='katylenchristinneribeiroxavier@gmail.com' AND new.email_confirmed_at IS NOT NULL THEN
  INSERT INTO public.user_roles(user_id,role) VALUES(new.id,'super_admin') ON CONFLICT DO NOTHING;
 END IF;
 IF _role='revendedor' THEN INSERT INTO public.resellers(user_id,code) VALUES(new.id,upper(substr(replace(new.id::text,'-',''),1,8))); END IF;
 SELECT * INTO _purchase FROM public.subscription_requests WHERE status='confirmado' AND lower(email)=lower(new.email) AND (user_id IS NULL OR user_id=new.id) ORDER BY created_at DESC LIMIT 1;
 IF FOUND OR (_role='dono_salao' AND _salon<>'') THEN
  SELECT user_id INTO _ref FROM public.resellers WHERE lower(code)=lower(new.raw_user_meta_data->>'ref') AND user_id<>new.id;
  INSERT INTO public.salons(owner_id,name,slug,city,plan_id,reseller_id) VALUES(new.id,_salon,'salao-'||replace(new.id::text,'-',''),nullif(new.raw_user_meta_data->>'city',''),_purchase.plan_id,_ref);
  INSERT INTO public.user_roles(user_id,role) VALUES(new.id,'dono_salao') ON CONFLICT DO NOTHING;
  IF _purchase.id IS NOT NULL THEN UPDATE public.subscription_requests SET user_id=new.id WHERE id=_purchase.id; END IF;
 END IF;
 RETURN new;
END $function$;