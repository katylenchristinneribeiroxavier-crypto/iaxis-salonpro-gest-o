-- Only the protected reminder worker may queue special-date broadcasts.
SELECT 1 / CASE WHEN NOT has_function_privilege('anon', 'public.queue_special_date(uuid,date,text,text)', 'EXECUTE') THEN 1 ELSE 0 END AS anonymous_cannot_broadcast;
SELECT 1 / CASE WHEN NOT has_function_privilege('authenticated', 'public.queue_special_date(uuid,date,text,text)', 'EXECUTE') THEN 1 ELSE 0 END AS client_cannot_broadcast;
SELECT 1 / CASE WHEN has_function_privilege('service_role', 'public.queue_special_date(uuid,date,text,text)', 'EXECUTE') THEN 1 ELSE 0 END AS worker_can_queue;