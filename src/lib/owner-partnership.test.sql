-- Read-only boundary checks; sandbox execution cannot create managed auth users.
SELECT 1 / CASE WHEN pg_get_functiondef('public.can_create_own_salon(uuid)'::regprocedure) LIKE '%status=''confirmado''%' THEN 1 ELSE 0 END AS purchase_check_present;
SELECT 1 / CASE WHEN pg_get_functiondef('public.has_role(uuid,public.app_role)'::regprocedure) LIKE '%email_confirmed_at IS NOT NULL%' THEN 1 ELSE 0 END AS master_confirmation_check_present;
SELECT 1 / CASE WHEN NOT has_function_privilege('anon','public.pay_referral_amount(uuid,numeric)','EXECUTE') THEN 1 ELSE 0 END AS anonymous_payout_denied;
SELECT 1 / CASE WHEN NOT has_table_privilege('authenticated','public.referral_payout_log','INSERT') THEN 1 ELSE 0 END AS self_written_payout_denied;