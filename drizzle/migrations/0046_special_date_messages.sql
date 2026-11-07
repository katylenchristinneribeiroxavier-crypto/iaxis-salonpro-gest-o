ALTER TABLE public.salon_automation_preferences ADD COLUMN special_date_messages boolean NOT NULL DEFAULT false;
CREATE FUNCTION public.queue_special_date(_salon uuid,_date date,_key text,_message text) RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE n integer;
BEGIN
 IF _date<>(now() AT TIME ZONE 'America/Sao_Paulo')::date OR length(_key)>60 OR length(_message)>1500 THEN RAISE EXCEPTION 'Data ou mensagem inválida'; END IF;
 INSERT INTO public.fila_mensagens_ia(salon_id,client_id,dedupe_key,cliente_whatsapp,mensagem,tipo,agendado_para)
 SELECT s.id,c.id,'special:'||s.id||':'||c.id||':'||_date||':'||_key,c.whatsapp,'Olá'||CASE WHEN trim(c.name)<>'' THEN ', '||c.name ELSE '' END||'! '||_message||CASE WHEN trim(s.name)<>'' THEN ' Com carinho, equipe '||s.name||'.' ELSE '' END,'data_especial',(_date+time '09:00') AT TIME ZONE 'America/Sao_Paulo'
 FROM public.salons s JOIN public.salon_clients c ON c.salon_id=s.id JOIN public.salon_automation_preferences p ON p.salon_id=s.id
 WHERE s.id=_salon AND public.salon_access_allowed(s.id) AND p.special_date_messages AND c.consent AND trim(c.whatsapp)<>''
 ON CONFLICT(dedupe_key) DO NOTHING;
 GET DIAGNOSTICS n=ROW_COUNT; RETURN n;
END $$;
REVOKE ALL ON FUNCTION public.queue_special_date(uuid,date,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.queue_special_date(uuid,date,text,text) TO service_role;