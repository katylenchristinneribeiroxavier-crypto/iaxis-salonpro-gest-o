-- Transactional tests: all temporary salon, purchase and booking rows are rolled back.
BEGIN;
SELECT set_config('request.jwt.claim.sub','6ec7fe72-e94e-4a4a-a94e-914ed3036d9d',true);
SELECT set_config('request.jwt.claim.role','authenticated',true);
SELECT public.redeem_single_test_purchase('','') AS test_salon \gset
SELECT 1/CASE WHEN (SELECT count(*) FROM public.platform_test_purchase)=1 THEN 1 ELSE 0 END AS exactly_one_free_purchase;
SELECT 1/CASE WHEN EXISTS(SELECT 1 FROM public.platform_test_purchase t JOIN public.subscription_requests r ON r.id=t.request_id WHERE r.amount=0 AND r.trial_ends_at-r.confirmed_at=interval '7 days') THEN 1 ELSE 0 END AS free_trial_seven_days;
DO $$ BEGIN
 BEGIN PERFORM public.redeem_single_test_purchase('',''); RAISE EXCEPTION 'TEST FAILED: second free purchase accepted';
 EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'A única compra gratuita já foi utilizada' THEN RAISE; END IF; END;
END $$;
SELECT 1/CASE WHEN NOT EXISTS(SELECT 1 FROM public.referral_sales r JOIN public.platform_test_purchase t ON t.request_id=r.request_id) THEN 1 ELSE 0 END AS free_purchase_has_no_commission;
INSERT INTO public.services(salon_id,name,price,duration_min) VALUES(:'test_salon','Teste transacional',100,90) RETURNING id AS service_id \gset
INSERT INTO public.professionals(salon_id,name,commission_pct) VALUES(:'test_salon','Teste transacional',20) RETURNING id AS professional_id \gset
INSERT INTO public.salon_clients(salon_id,name,consent,birthday,last_visit) VALUES(:'test_salon','Teste transacional',true,current_date,current_timestamp-interval '61 days') RETURNING id AS client_id \gset
UPDATE public.salons SET opening_time='08:00',closing_time='00:00',cobrar_sinal=true,tipo_sinal='porcentagem',valor_sinal=30,pix_key='teste-transacional' WHERE id=:'test_salon';
SELECT public.assistant_book_appointment(:'test_salon',:'service_id',:'professional_id',((current_date+1)+time '08:00') AT TIME ZONE 'America/Sao_Paulo',:'client_id');
SELECT 1/CASE WHEN EXISTS(SELECT 1 FROM public.appointments WHERE salon_id=:'test_salon' AND price=100 AND duration_min=90 AND deposit=30 AND valor_sinal_pago=0 AND status_sinal='pendente') THEN 1 ELSE 0 END AS booking_derives_price_duration_and_unpaid_deposit;
SELECT 1/CASE WHEN EXISTS(SELECT 1 FROM public.fila_mensagens_ia q JOIN public.appointments a ON a.id=q.appointment_id WHERE a.salon_id=:'test_salon' AND q.agendado_para=a.starts_at-interval '1 hour') THEN 1 ELSE 0 END AS reminder_exactly_one_hour_before;
SELECT 1/CASE WHEN NOT EXISTS(SELECT 1 FROM public.salon_available_slots(:'test_salon',:'service_id',:'professional_id',current_date+1) WHERE label IN ('08:00','08:30','09:00')) THEN 1 ELSE 0 END AS duration_overlap_not_available;
SELECT 1/CASE WHEN EXISTS(SELECT 1 FROM public.salon_available_slots(:'test_salon',:'service_id',:'professional_id',current_date+1) WHERE label='22:30') AND NOT EXISTS(SELECT 1 FROM public.salon_available_slots(:'test_salon',:'service_id',:'professional_id',current_date+1) WHERE label='23:00') THEN 1 ELSE 0 END AS midnight_respects_service_duration;
INSERT INTO public.salon_automation_preferences(salon_id,birthday_reminders,return_reminders) VALUES(:'test_salon',true,true);
SELECT 1/CASE WHEN EXISTS(SELECT 1 FROM public.fila_mensagens_ia WHERE salon_id=:'test_salon' AND tipo='aniversario' AND (agendado_para AT TIME ZONE 'America/Sao_Paulo')::time=time '07:00') THEN 1 ELSE 0 END AS birthday_at_seven_local;
UPDATE public.appointments SET status='cancelado' WHERE salon_id=:'test_salon';
SELECT public.prepare_salon_reminders(:'test_salon');
SELECT 1/CASE WHEN EXISTS(SELECT 1 FROM public.fila_mensagens_ia WHERE salon_id=:'test_salon' AND tipo='retorno' AND (agendado_para AT TIME ZONE 'America/Sao_Paulo')::time=time '09:00') THEN 1 ELSE 0 END AS return_at_nine_local;
SELECT public.prepare_salon_reminders(:'test_salon');
SELECT 1/CASE WHEN NOT EXISTS(SELECT dedupe_key FROM public.fila_mensagens_ia WHERE salon_id=:'test_salon' GROUP BY dedupe_key HAVING count(*)>1) THEN 1 ELSE 0 END AS no_duplicate_reminders;
SELECT 1/CASE WHEN NOT has_table_privilege('authenticated','public.platform_reminder_control','UPDATE') THEN 1 ELSE 0 END AS activation_not_available_to_salon;
SELECT 1/CASE WHEN pg_get_functiondef('public.handle_new_user()'::regprocedure) LIKE '%status=''confirmado''%' THEN 1 ELSE 0 END AS signup_requires_confirmed_purchase_for_salon;
ROLLBACK;