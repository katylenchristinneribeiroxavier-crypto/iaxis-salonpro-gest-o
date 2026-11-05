-- Read-only regression checks; fail with division by zero when a rule breaks.
SELECT 1/CASE WHEN (SELECT count(*) FROM public.platform_test_purchase)=1 THEN 1 ELSE 0 END AS exactly_one_free_purchase;
SELECT 1/CASE WHEN EXISTS(SELECT 1 FROM public.platform_test_purchase t JOIN public.subscription_requests r ON r.id=t.request_id WHERE r.amount=0 AND r.trial_ends_at-r.confirmed_at=interval '7 days') THEN 1 ELSE 0 END AS free_trial_seven_days;
SELECT 1/CASE WHEN NOT EXISTS(SELECT 1 FROM public.referral_sales r JOIN public.platform_test_purchase t ON t.request_id=r.request_id) THEN 1 ELSE 0 END AS free_purchase_has_no_commission;
SELECT 1/CASE WHEN pg_get_functiondef('public.stamp_purchase_trial()'::regprocedure) LIKE '%interval ''7 days''%' THEN 1 ELSE 0 END AS every_purchase_seven_days;
SELECT 1/CASE WHEN pg_get_functiondef('public.prepare_salon_reminders(uuid)'::regprocedure) LIKE '%starts_at-interval ''1 hour''%' THEN 1 ELSE 0 END AS one_hour_before;
SELECT 1/CASE WHEN pg_get_functiondef('public.prepare_salon_reminders(uuid)'::regprocedure) LIKE '%time ''07:00''%' THEN 1 ELSE 0 END AS birthday_at_seven;
SELECT 1/CASE WHEN pg_get_functiondef('public.prepare_salon_reminders(uuid)'::regprocedure) LIKE '%time ''09:00''%' THEN 1 ELSE 0 END AS return_at_nine;
SELECT 1/CASE WHEN NOT has_table_privilege('authenticated','public.platform_reminder_control','UPDATE') THEN 1 ELSE 0 END AS developer_only_activation;
SELECT 1/CASE WHEN pg_get_functiondef('public.handle_new_user()'::regprocedure) LIKE '%status=''confirmado''%' THEN 1 ELSE 0 END AS purchase_before_salon;
SELECT 1/CASE WHEN NOT has_function_privilege('anon','public.assistant_book_appointment(uuid,uuid,uuid,timestamptz,uuid)','EXECUTE') THEN 1 ELSE 0 END AS booking_requires_login;
