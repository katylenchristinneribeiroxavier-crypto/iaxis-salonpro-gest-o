-- Read-only boundary checks; sandbox execution cannot create managed auth users.
SELECT 1 / CASE WHEN NOT public.can_create_own_salon(gen_random_uuid()) THEN 1 ELSE 0 END AS unpaid_creation_denied;
SELECT 1 / CASE WHEN NOT public.has_role(gen_random_uuid(),'super_admin') THEN 1 ELSE 0 END AS unknown_master_denied;
SELECT 1 / CASE WHEN NOT has_function_privilege('anon','public.pay_referral_amount(uuid,numeric)','EXECUTE') THEN 1 ELSE 0 END AS anonymous_payout_denied;
SELECT 1 / CASE WHEN NOT has_table_privilege('authenticated','public.referral_payout_log','INSERT') THEN 1 ELSE 0 END AS self_written_payout_denied;