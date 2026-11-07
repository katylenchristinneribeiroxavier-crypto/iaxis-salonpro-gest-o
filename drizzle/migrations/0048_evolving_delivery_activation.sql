CREATE FUNCTION public.activate_evolving_queue(_salon uuid) RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE n integer;
BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.platform_reminder_control WHERE id=true AND enabled) OR NOT EXISTS(SELECT 1 FROM public.configuracoes_salao WHERE salon_id=_salon AND evolution_connection_state='open') OR NOT public.salon_access_allowed(_salon) THEN RETURN 0; END IF;
 UPDATE public.fila_mensagens_ia SET status='cancelado',error='Prazo da mensagem encerrado; não enviar atrasada' WHERE salon_id=_salon AND status='aguardando_conexao_whatsapp' AND agendado_para<now()-interval '15 minutes';
 UPDATE public.fila_mensagens_ia SET status='pendente',error='' WHERE salon_id=_salon AND status='aguardando_conexao_whatsapp' AND agendado_para>=now()-interval '15 minutes';
 GET DIAGNOSTICS n=ROW_COUNT; RETURN n;
END $$;
REVOKE ALL ON FUNCTION public.activate_evolving_queue(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.activate_evolving_queue(uuid) TO service_role;
CREATE OR REPLACE FUNCTION public.prepare_salon_reminders(_salon uuid DEFAULT NULL) RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE n integer;total integer:=0;
BEGIN
 PERFORM public.prepare_evolving_messages(_salon);
 UPDATE public.fila_mensagens_ia q SET status='cancelado',error='Agendamento cancelado ou alterado' FROM public.appointments a WHERE q.appointment_id=a.id AND q.tipo='lembrete_agendamento' AND q.status='pendente' AND (_salon IS NULL OR q.salon_id=_salon) AND (a.status IN ('cancelado','finalizado') OR q.agendado_para<>a.starts_at-interval '1 hour');
 INSERT INTO public.fila_mensagens_ia(salon_id,client_id,appointment_id,dedupe_key,cliente_whatsapp,mensagem,tipo,agendado_para)
 SELECT a.salon_id,a.salon_client_id,a.id,'appointment:'||a.id||':'||extract(epoch from a.starts_at)::text,coalesce(c.whatsapp,''),'Oi, '||a.client_name||'! 💛 Nosso encontro está marcado para '||to_char(a.starts_at AT TIME ZONE 'America/Sao_Paulo','DD/MM às HH24:MI')||'. Te espero com carinho! ✨','lembrete_agendamento',a.starts_at-interval '1 hour'
 FROM public.appointments a LEFT JOIN public.salon_clients c ON c.id=a.salon_client_id LEFT JOIN public.salon_automation_preferences p ON p.salon_id=a.salon_id WHERE (_salon IS NULL OR a.salon_id=_salon) AND public.salon_access_allowed(a.salon_id) AND a.status NOT IN ('cancelado','finalizado') AND a.starts_at>now() AND coalesce(p.appointment_reminders,true) ON CONFLICT(dedupe_key) DO NOTHING;
 GET DIAGNOSTICS n=ROW_COUNT;RETURN n;
END $$;