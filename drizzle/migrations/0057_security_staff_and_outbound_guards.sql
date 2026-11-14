CREATE OR REPLACE FUNCTION public.salon_message_recipient_allowed(_salon uuid, _phone text, _appointment uuid DEFAULT NULL) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 SELECT auth.uid() IS NOT NULL AND public.manages_salon(_salon) AND _phone ~ '^[0-9]{12,15}$'
 AND (_appointment IS NULL OR EXISTS(SELECT 1 FROM public.appointments a WHERE a.id=_appointment AND a.salon_id=_salon AND (
   CASE WHEN length(regexp_replace(coalesce(a.client_whatsapp,''),'[^0-9]','','g')) IN (10,11) THEN '55'||regexp_replace(a.client_whatsapp,'[^0-9]','','g') ELSE regexp_replace(coalesce(a.client_whatsapp,''),'[^0-9]','','g') END = _phone
   OR EXISTS(SELECT 1 FROM public.salon_clients c WHERE c.id=a.salon_client_id AND c.salon_id=_salon AND CASE WHEN length(regexp_replace(c.whatsapp,'[^0-9]','','g')) IN (10,11) THEN '55'||regexp_replace(c.whatsapp,'[^0-9]','','g') ELSE regexp_replace(c.whatsapp,'[^0-9]','','g') END = _phone))))
 AND (EXISTS(SELECT 1 FROM public.salon_clients c WHERE c.salon_id=_salon AND CASE WHEN length(regexp_replace(c.whatsapp,'[^0-9]','','g')) IN (10,11) THEN '55'||regexp_replace(c.whatsapp,'[^0-9]','','g') ELSE regexp_replace(c.whatsapp,'[^0-9]','','g') END = _phone)
 OR EXISTS(SELECT 1 FROM public.appointments a WHERE a.salon_id=_salon AND CASE WHEN length(regexp_replace(coalesce(a.client_whatsapp,''),'[^0-9]','','g')) IN (10,11) THEN '55'||regexp_replace(a.client_whatsapp,'[^0-9]','','g') ELSE regexp_replace(coalesce(a.client_whatsapp,''),'[^0-9]','','g') END = _phone)
 OR EXISTS(SELECT 1 FROM public.salon_messages m WHERE m.salon_id=_salon AND m.direction='inbound' AND m.contact_phone=_phone));
$$;
REVOKE ALL ON FUNCTION public.salon_message_recipient_allowed(uuid,text,uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.salon_message_recipient_allowed(uuid,text,uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.guard_manual_salon_message() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF NEW.direction='outbound' AND NEW.created_by IS NOT NULL THEN
  PERFORM 1 FROM public.salons WHERE id=NEW.salon_id FOR UPDATE;
  IF (SELECT count(*) FROM public.salon_messages WHERE salon_id=NEW.salon_id AND direction='outbound' AND created_by IS NOT NULL AND created_at>now()-interval '1 minute') >=20 THEN
   RAISE EXCEPTION 'Limite de 20 mensagens por minuto atingido. Aguarde antes de enviar novamente.';
  END IF;
  IF char_length(btrim(NEW.body)) NOT BETWEEN 1 AND 4000 THEN RAISE EXCEPTION 'Mensagem inválida'; END IF;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER guard_manual_salon_message BEFORE INSERT ON public.salon_messages FOR EACH ROW EXECUTE FUNCTION public.guard_manual_salon_message();

DO $$
DECLARE definition text;
BEGIN
 definition:=pg_get_functiondef('public.staff_portal(uuid)'::regprocedure);
 definition:=replace(definition,'IF _s.archived_at IS NOT NULL OR _s.status<>''ativo'' THEN','IF NOT public.salon_access_allowed(_p.salon_id) OR _s.archived_at IS NOT NULL OR _s.status<>''ativo'' THEN');
 IF definition=pg_get_functiondef('public.staff_portal(uuid)'::regprocedure) THEN RAISE EXCEPTION 'Staff portal guard not found'; END IF;
 EXECUTE definition;
 definition:=pg_get_functiondef('public.staff_change_appointment(uuid,uuid,text,text,timestamp with time zone)'::regprocedure);
 definition:=replace(definition,'IF NOT EXISTS (SELECT 1 FROM public.salons WHERE id=_p.salon_id AND status=''ativo'' AND archived_at IS NULL) THEN','IF NOT public.salon_access_allowed(_p.salon_id) OR NOT EXISTS (SELECT 1 FROM public.salons WHERE id=_p.salon_id AND status=''ativo'' AND archived_at IS NULL) THEN');
 IF definition=pg_get_functiondef('public.staff_change_appointment(uuid,uuid,text,text,timestamp with time zone)'::regprocedure) THEN RAISE EXCEPTION 'Staff appointment guard not found'; END IF;
 EXECUTE definition;
END $$;