CREATE TABLE public.salon_automation_preferences (
 salon_id uuid PRIMARY KEY REFERENCES public.salons(id),
 appointment_reminders boolean NOT NULL DEFAULT true,
 birthday_reminders boolean NOT NULL DEFAULT false,
 return_reminders boolean NOT NULL DEFAULT false,
 return_days integer NOT NULL DEFAULT 60 CHECK(return_days BETWEEN 1 AND 365),
 updated_at timestamptz NOT NULL DEFAULT now()
);
REVOKE ALL ON public.salon_automation_preferences FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT,UPDATE ON public.salon_automation_preferences TO authenticated;
GRANT ALL ON public.salon_automation_preferences TO service_role;
ALTER TABLE public.salon_automation_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY automation_preferences_manage ON public.salon_automation_preferences FOR ALL TO authenticated USING(public.manages_salon(salon_id)) WITH CHECK(public.manages_salon(salon_id));
CREATE POLICY automation_preferences_access ON public.salon_automation_preferences AS RESTRICTIVE FOR ALL TO authenticated USING(public.salon_access_allowed(salon_id)) WITH CHECK(public.salon_access_allowed(salon_id));
ALTER TABLE public.fila_mensagens_ia ADD COLUMN IF NOT EXISTS sent_at timestamptz, ADD COLUMN IF NOT EXISTS provider_message_id text, ADD COLUMN IF NOT EXISTS claimed_at timestamptz;
CREATE INDEX reminder_due_idx ON public.fila_mensagens_ia(agendado_para) WHERE status='pendente';
CREATE POLICY reminder_customer_read ON public.fila_mensagens_ia FOR SELECT TO authenticated USING(agendado_para<=now() AND EXISTS(SELECT 1 FROM public.appointments a WHERE a.id=appointment_id AND a.client_id=auth.uid()));
CREATE TABLE public.platform_reminder_control (id boolean PRIMARY KEY DEFAULT true CHECK(id),enabled boolean NOT NULL DEFAULT false,updated_by uuid,updated_at timestamptz NOT NULL DEFAULT now());
REVOKE ALL ON public.platform_reminder_control FROM PUBLIC,anon,authenticated;
GRANT ALL ON public.platform_reminder_control TO service_role;
ALTER TABLE public.platform_reminder_control ENABLE ROW LEVEL SECURITY;
CREATE TABLE public.booking_handoffs(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),salon_id uuid NOT NULL REFERENCES public.salons(id),user_id uuid NOT NULL,message text NOT NULL CHECK(char_length(message) BETWEEN 1 AND 2000),status text NOT NULL DEFAULT 'pendente' CHECK(status IN ('pendente','resolvido')),created_at timestamptz NOT NULL DEFAULT now());
REVOKE ALL ON public.booking_handoffs FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT,UPDATE ON public.booking_handoffs TO authenticated;
GRANT ALL ON public.booking_handoffs TO service_role;
ALTER TABLE public.booking_handoffs ENABLE ROW LEVEL SECURITY;
CREATE POLICY handoff_read ON public.booking_handoffs FOR SELECT TO authenticated USING(user_id=auth.uid() OR public.manages_salon(salon_id));
CREATE POLICY handoff_insert ON public.booking_handoffs FOR INSERT TO authenticated WITH CHECK(user_id=auth.uid() AND status='pendente' AND public.salon_access_allowed(salon_id));
CREATE POLICY handoff_manage ON public.booking_handoffs FOR UPDATE TO authenticated USING(public.manages_salon(salon_id)) WITH CHECK(public.manages_salon(salon_id));
CREATE POLICY handoff_access ON public.booking_handoffs AS RESTRICTIVE FOR ALL TO authenticated USING(public.salon_access_allowed(salon_id)) WITH CHECK(public.salon_access_allowed(salon_id));
CREATE FUNCTION public.salon_booking_catalog(_salon uuid) RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE _s public.salons; _agent public.config_agente_secretario;
BEGIN
 SELECT * INTO _s FROM public.salons WHERE id=_salon AND public.salon_access_allowed(id) AND (status='ativo' OR public.manages_salon(id));
 IF NOT FOUND THEN RAISE EXCEPTION 'Salão indisponível'; END IF;
 SELECT * INTO _agent FROM public.config_agente_secretario WHERE salon_id=_salon;
 RETURN jsonb_build_object('salon',jsonb_build_object('id',_s.id,'name',_s.name,'timezone',_s.timezone,'opening_time',_s.opening_time,'closing_time',_s.closing_time,'nome_agente',coalesce(_agent.nome_agente,''),'genero',coalesce(_agent.genero,'neutro'),'name_article',_s.name_article),
 'services',coalesce((SELECT jsonb_agg(jsonb_build_object('id',id,'name',name,'price',price,'duration_min',duration_min) ORDER BY name) FROM public.services WHERE salon_id=_salon),'[]'::jsonb),
 'professionals',coalesce((SELECT jsonb_agg(jsonb_build_object('id',id,'name',name) ORDER BY name) FROM public.professionals WHERE salon_id=_salon),'[]'::jsonb));
END $$;
REVOKE ALL ON FUNCTION public.salon_booking_catalog(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.salon_booking_catalog(uuid) TO anon,authenticated;
CREATE FUNCTION public.salon_available_slots(_salon uuid,_service uuid,_professional uuid,_day date) RETURNS TABLE(starts_at timestamptz,label text) LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE _s public.salons; _duration integer; _open timestamptz; _close timestamptz;
BEGIN
 SELECT * INTO _s FROM public.salons WHERE id=_salon AND public.salon_access_allowed(id) AND (status='ativo' OR public.manages_salon(id));
 IF NOT FOUND THEN RAISE EXCEPTION 'Salão indisponível'; END IF;
 SELECT duration_min INTO _duration FROM public.services WHERE id=_service AND salon_id=_salon;
 IF _duration IS NULL OR NOT EXISTS(SELECT 1 FROM public.professionals WHERE id=_professional AND salon_id=_salon) THEN RAISE EXCEPTION 'Serviço ou profissional inválido'; END IF;
 _open:=(_day+_s.opening_time::time) AT TIME ZONE _s.timezone;
 _close:=(CASE WHEN _s.closing_time='00:00' THEN (_day+1)::timestamp ELSE _day+_s.closing_time::time END) AT TIME ZONE _s.timezone;
 RETURN QUERY SELECT t, to_char(t AT TIME ZONE _s.timezone,'HH24:MI') FROM generate_series(_open,_close-make_interval(mins=>_duration),interval '30 minutes') t WHERE t>now() AND NOT EXISTS(SELECT 1 FROM public.appointments a WHERE a.salon_id=_salon AND a.professional_id=_professional AND a.status<>'cancelado' AND a.starts_at<t+make_interval(mins=>_duration) AND a.starts_at+make_interval(mins=>a.duration_min)>t) ORDER BY t;
END $$;
REVOKE ALL ON FUNCTION public.salon_available_slots(uuid,uuid,uuid,date) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.salon_available_slots(uuid,uuid,uuid,date) TO anon,authenticated;
CREATE FUNCTION public.assistant_book_appointment(_salon uuid,_service uuid,_professional uuid,_starts timestamptz,_client uuid DEFAULT NULL) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE _s public.salons; _svc public.services; _client_name text; _deposit numeric:=0; _id uuid; _local_day date;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Entre na sua conta para agendar'; END IF;
 SELECT * INTO _s FROM public.salons WHERE id=_salon AND public.salon_access_allowed(id) AND (status='ativo' OR public.manages_salon(id));
 IF NOT FOUND THEN RAISE EXCEPTION 'Salão indisponível'; END IF;
 SELECT * INTO _svc FROM public.services WHERE id=_service AND salon_id=_salon;
 IF NOT FOUND THEN RAISE EXCEPTION 'Serviço indisponível'; END IF;
 _local_day:=(_starts AT TIME ZONE _s.timezone)::date;
 PERFORM pg_advisory_xact_lock(hashtextextended(_professional::text,0));
 IF NOT EXISTS(SELECT 1 FROM public.salon_available_slots(_salon,_service,_professional,_local_day) slots WHERE slots.starts_at=_starts) THEN RAISE EXCEPTION 'Horário indisponível. Escolha outro horário'; END IF;
 IF _client IS NOT NULL THEN
  IF NOT public.manages_salon(_salon) THEN RAISE EXCEPTION 'Acesso restrito'; END IF;
  SELECT name INTO _client_name FROM public.salon_clients WHERE id=_client AND salon_id=_salon;
  IF NOT FOUND THEN RAISE EXCEPTION 'Cliente não pertence ao salão'; END IF;
 ELSE SELECT coalesce(nullif(full_name,''),email) INTO _client_name FROM public.profiles WHERE id=auth.uid(); END IF;
 IF coalesce(btrim(_client_name),'')='' THEN RAISE EXCEPTION 'Preencha seu nome antes de agendar'; END IF;
 IF _s.cobrar_sinal AND _svc.price>0 THEN
  IF _s.valor_sinal<0 OR (_s.tipo_sinal='porcentagem' AND _s.valor_sinal>100) THEN RAISE EXCEPTION 'Sinal do salão inválido'; END IF;
  _deposit:=CASE WHEN _s.tipo_sinal='fixo' THEN least(_s.valor_sinal,_svc.price) ELSE round(_svc.price*_s.valor_sinal/100,2) END;
  IF _deposit>0 AND _s.pix_key='' THEN RAISE EXCEPTION 'O salão precisa configurar o PIX do sinal'; END IF;
 END IF;
 INSERT INTO public.appointments(salon_id,client_id,salon_client_id,client_name,service_id,professional_id,starts_at,price,deposit,valor_sinal_pago,status_sinal,status) VALUES(_salon,CASE WHEN _client IS NULL THEN auth.uid() ELSE NULL END,_client,_client_name,_service,_professional,_starts,_svc.price,_deposit,0,CASE WHEN _deposit>0 THEN 'pendente' ELSE 'isento' END,'confirmado') RETURNING id INTO _id;
 RETURN jsonb_build_object('id',_id,'starts_at',_starts,'deposit',_deposit,'price',_svc.price,'status_sinal',CASE WHEN _deposit>0 THEN 'pendente' ELSE 'isento' END,'pix_key',CASE WHEN _deposit>0 THEN _s.pix_key ELSE '' END,'pix_holder',_s.pix_holder,'pix_city',coalesce(nullif(_s.pix_city,''),_s.city,'BRASIL'));
END $$;
REVOKE ALL ON FUNCTION public.assistant_book_appointment(uuid,uuid,uuid,timestamptz,uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.assistant_book_appointment(uuid,uuid,uuid,timestamptz,uuid) TO authenticated;
CREATE FUNCTION public.prepare_salon_reminders(_salon uuid DEFAULT NULL) RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE _count integer:=0; _n integer;
BEGIN
 UPDATE public.fila_mensagens_ia q SET status='cancelado',error='Agendamento cancelado ou alterado' FROM public.appointments a WHERE q.appointment_id=a.id AND q.status='pendente' AND (_salon IS NULL OR q.salon_id=_salon) AND (a.status IN ('cancelado','finalizado') OR q.agendado_para<>a.starts_at-interval '1 hour');
 INSERT INTO public.fila_mensagens_ia(salon_id,client_id,appointment_id,dedupe_key,cliente_whatsapp,mensagem,tipo,agendado_para)
 SELECT a.salon_id,a.salon_client_id,a.id,'appointment:'||a.id||':'||extract(epoch from a.starts_at)::text,coalesce(c.whatsapp,''),'Olá, '||a.client_name||'! Seu atendimento no '||s.name||' está marcado para '||to_char(a.starts_at AT TIME ZONE s.timezone,'DD/MM às HH24:MI')||'.','lembrete_agendamento',a.starts_at-interval '1 hour'
 FROM public.appointments a JOIN public.salons s ON s.id=a.salon_id LEFT JOIN public.salon_clients c ON c.id=a.salon_client_id LEFT JOIN public.salon_automation_preferences p ON p.salon_id=s.id
 WHERE (_salon IS NULL OR s.id=_salon) AND public.salon_access_allowed(s.id) AND a.status NOT IN ('cancelado','finalizado') AND a.starts_at>now() AND coalesce(p.appointment_reminders,true)
 ON CONFLICT(dedupe_key) DO NOTHING;
 GET DIAGNOSTICS _n=ROW_COUNT; _count:=_count+_n;
 INSERT INTO public.fila_mensagens_ia(salon_id,client_id,dedupe_key,cliente_whatsapp,mensagem,tipo,agendado_para)
 SELECT s.id,c.id,'birthday:'||c.id||':'||to_char(now() AT TIME ZONE s.timezone,'YYYY-MM-DD'),c.whatsapp,'Feliz aniversário, '||c.name||'! A equipe do '||s.name||' deseja um dia especial para você.','aniversario',(((now() AT TIME ZONE s.timezone)::date)+time '07:00') AT TIME ZONE s.timezone
 FROM public.salon_clients c JOIN public.salons s ON s.id=c.salon_id JOIN public.salon_automation_preferences p ON p.salon_id=s.id
 WHERE (_salon IS NULL OR s.id=_salon) AND public.salon_access_allowed(s.id) AND p.birthday_reminders AND c.consent AND c.birthday IS NOT NULL AND to_char(c.birthday,'MM-DD')=to_char(now() AT TIME ZONE s.timezone,'MM-DD') ON CONFLICT(dedupe_key) DO NOTHING;
 GET DIAGNOSTICS _n=ROW_COUNT; _count:=_count+_n;
 INSERT INTO public.fila_mensagens_ia(salon_id,client_id,dedupe_key,cliente_whatsapp,mensagem,tipo,agendado_para)
 SELECT s.id,c.id,'return:'||c.id||':'||extract(epoch from c.last_visit)::text,c.whatsapp,'Olá, '||c.name||'! Sentimos sua falta no '||s.name||'. Quer agendar seu retorno?','retorno',(((now() AT TIME ZONE s.timezone)::date)+time '09:00') AT TIME ZONE s.timezone
 FROM public.salon_clients c JOIN public.salons s ON s.id=c.salon_id JOIN public.salon_automation_preferences p ON p.salon_id=s.id
 WHERE (_salon IS NULL OR s.id=_salon) AND public.salon_access_allowed(s.id) AND p.return_reminders AND c.consent AND c.last_visit IS NOT NULL AND (now() AT TIME ZONE s.timezone)::date >= (c.last_visit AT TIME ZONE s.timezone)::date+p.return_days
 AND NOT EXISTS(SELECT 1 FROM public.appointments a WHERE a.salon_client_id=c.id AND a.starts_at>now() AND a.status<>'cancelado') ON CONFLICT(dedupe_key) DO NOTHING;
 GET DIAGNOSTICS _n=ROW_COUNT; RETURN _count+_n;
END $$;
REVOKE ALL ON FUNCTION public.prepare_salon_reminders(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.prepare_salon_reminders(uuid) TO service_role;
CREATE FUNCTION public.refresh_salon_reminders_trigger() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN PERFORM public.prepare_salon_reminders(new.salon_id); RETURN new; END $$;
CREATE TRIGGER appointment_reminder_queue AFTER INSERT OR UPDATE OF starts_at,status,salon_client_id ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.refresh_salon_reminders_trigger();
CREATE TRIGGER client_reminder_queue AFTER INSERT OR UPDATE ON public.salon_clients FOR EACH ROW EXECUTE FUNCTION public.refresh_salon_reminders_trigger();
CREATE TRIGGER preferences_reminder_queue AFTER INSERT OR UPDATE ON public.salon_automation_preferences FOR EACH ROW EXECUTE FUNCTION public.refresh_salon_reminders_trigger();
CREATE FUNCTION public.claim_salon_reminders(_limit integer DEFAULT 10) RETURNS SETOF public.fila_mensagens_ia LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 RETURN QUERY WITH due AS (SELECT id FROM public.fila_mensagens_ia WHERE status='pendente' AND agendado_para<=now() AND agendado_para>now()-interval '15 minutes' AND public.salon_access_allowed(salon_id) ORDER BY agendado_para FOR UPDATE SKIP LOCKED LIMIT least(greatest(_limit,1),10)) UPDATE public.fila_mensagens_ia q SET status='processando',claimed_at=now(),attempts=attempts+1 FROM due WHERE q.id=due.id RETURNING q.*;
END $$;
REVOKE ALL ON FUNCTION public.claim_salon_reminders(integer) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.claim_salon_reminders(integer) TO service_role;