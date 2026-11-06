-- Read-only checks for national license grants and database enforcement.
SELECT 1 / CASE WHEN NOT has_table_privilege('anon','public.licencas_nacionais','SELECT') THEN 1 ELSE 0 END AS anonymous_license_read_denied;
SELECT 1 / CASE WHEN NOT has_table_privilege('authenticated','public.licencas_nacionais','UPDATE') THEN 1 ELSE 0 END AS self_renewal_denied;
SELECT 1 / CASE WHEN has_table_privilege('authenticated','public.licencas_nacionais','SELECT') THEN 1 ELSE 0 END AS authenticated_license_read;
SELECT 1 / CASE WHEN NOT has_function_privilege('anon','public.master_licenca(text,text)','EXECUTE') THEN 1 ELSE 0 END AS anonymous_master_denied;
SELECT 1 / CASE WHEN pg_get_functiondef('public.salon_access_allowed(uuid)'::regprocedure) LIKE '%licenca_valida%' THEN 1 ELSE 0 END AS database_license_enforcement;