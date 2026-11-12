BEGIN;
DO $$
DECLARE u uuid:=gen_random_uuid();
BEGIN
 INSERT INTO auth.users(id,email,raw_user_meta_data) VALUES(u,'owner-regression-'||u||'@example.invalid','{"role":"super_admin","salon_name":"Must not create"}'::jsonb);
 IF NOT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id=u AND role='dono_salao') THEN RAISE EXCEPTION 'default role must be owner'; END IF;
 IF public.has_role(u,'super_admin') THEN RAISE EXCEPTION 'signup metadata granted master'; END IF;
 IF EXISTS(SELECT 1 FROM public.salons WHERE owner_id=u) THEN RAISE EXCEPTION 'salon created without purchase'; END IF;
 PERFORM set_config('request.jwt.claim.sub',u::text,true);
 IF public.can_create_own_salon(u) THEN RAISE EXCEPTION 'unpaid account can create salon'; END IF;
 BEGIN
  PERFORM public.become_reseller();
  RAISE EXCEPTION 'unpaid owner can enroll';
 EXCEPTION WHEN raise_exception THEN
  IF SQLERRM='unpaid owner can enroll' THEN RAISE; END IF;
 END;
END $$;
SELECT 1 / CASE WHEN NOT has_function_privilege('anon','public.pay_referral_amount(uuid,numeric)','EXECUTE') THEN 1 ELSE 0 END AS anonymous_payout_denied;
ROLLBACK;