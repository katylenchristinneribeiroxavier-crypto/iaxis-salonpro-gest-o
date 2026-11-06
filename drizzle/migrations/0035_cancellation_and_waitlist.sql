CREATE TABLE public.salon_booking_rules (
 salon_id uuid PRIMARY KEY REFERENCES public.salons(id),
 cancel_min_hours integer NOT NULL DEFAULT 2 CHECK (cancel_min_hours BETWEEN 0 AND 168),
 updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.salon_booking_rules TO authenticated;
GRANT ALL ON public.salon_booking_rules TO service_role;
ALTER TABLE public.salon_booking_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY booking_rules_read ON public.salon_booking_rules FOR SELECT TO authenticated USING (public.belongs_salon(salon_id) OR public.has_role(auth.uid(),'super_admin'));
CREATE POLICY booking_rules_insert ON public.salon_booking_rules FOR INSERT TO authenticated WITH CHECK (public.manages_salon(salon_id));
CREATE POLICY booking_rules_update ON public.salon_booking_rules FOR UPDATE TO authenticated USING (public.manages_salon(salon_id)) WITH CHECK (public.manages_salon(salon_id));

CREATE TABLE public.lista_espera (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 salon_id uuid NOT NULL REFERENCES public.salons(id),
 service_id uuid REFERENCES public.services(id) ON DELETE SET NULL,
 professional_id uuid REFERENCES public.professionals(id) ON DELETE SET NULL,
 desired_at timestamptz NOT NULL,
 client_name text NOT NULL CHECK (char_length(client_name) BETWEEN 2 AND 120),
 whatsapp text NOT NULL CHECK (char_length(whatsapp) BETWEEN 10 AND 15),
 status text NOT NULL DEFAULT 'aguardando' CHECK (status IN ('aguardando','notificado','agendado','removido')),
 notified_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX lista_espera_slot_idx ON public.lista_espera(salon_id, desired_at, created_at) WHERE status='aguardando';
GRANT SELECT, UPDATE, DELETE ON public.lista_espera TO authenticated;
GRANT ALL ON public.lista_espera TO service_role;
ALTER TABLE public.lista_espera ENABLE ROW LEVEL SECURITY;
CREATE POLICY espera_read ON public.lista_espera FOR SELECT TO authenticated USING (public.manages_salon(salon_id) OR public.has_role(auth.uid(),'super_admin'));
CREATE POLICY espera_update ON public.lista_espera FOR UPDATE TO authenticated USING (public.manages_salon(salon_id)) WITH CHECK (public.manages_salon(salon_id));
CREATE POLICY espera_delete ON public.lista_espera FOR DELETE TO authenticated USING (public.manages_salon(salon_id));

CREATE FUNCTION public.public_join_waitlist(_salon uuid, _service uuid, _professional uuid, _desired timestamptz, _name text, _whatsapp text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE _id uuid; _phone text := regexp_replace(coalesce(_whatsapp,''),'\D','','g'); _nm text := btrim(coalesce(_name,''));
BEGIN
 IF char_length(_nm) < 2 OR char_length(_nm) > 120 THEN RAISE EXCEPTION 'Informe seu nome'; END IF;
 IF char_length(_phone) < 10 OR char_length(_phone) > 15 THEN RAISE EXCEPTION 'Informe um WhatsApp válido com DDD'; END IF;
 IF _desired <= now() THEN RAISE EXCEPTION 'Escolha um horário futuro'; END IF;
 IF NOT EXISTS (SELECT 1 FROM public.salons WHERE id=_salon AND status='ativo' AND public.salon_access_allowed(id)) THEN RAISE EXCEPTION 'Salão indisponível'; END IF;
 IF _service IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.services WHERE id=_service AND salon_id=_salon) THEN RAISE EXCEPTION 'Serviço indisponível'; END IF;
 IF _professional IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.professionals WHERE id=_professional AND salon_id=_salon) THEN RAISE EXCEPTION 'Profissional indisponível'; END IF;
 IF EXISTS (SELECT 1 FROM public.lista_espera WHERE salon_id=_salon AND desired_at=_desired AND whatsapp=_phone AND status='aguardando') THEN RAISE EXCEPTION 'Você já está na lista de espera deste horário'; END IF;
 INSERT INTO public.lista_espera(salon_id,service_id,professional_id,desired_at,client_name,whatsapp) VALUES(_salon,_service,_professional,_desired,_nm,_phone) RETURNING id INTO _id;
 RETURN _id;
END $$;
REVOKE ALL ON FUNCTION public.public_join_waitlist(uuid,uuid,uuid,timestamptz,text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.public_join_waitlist(uuid,uuid,uuid,timestamptz,text,text) TO anon, authenticated;

CREATE FUNCTION public.public_cancel_appointment(_appointment uuid, _whatsapp text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE _a public.appointments; _hours integer; _phone text := regexp_replace(coalesce(_whatsapp,''),'\D','','g');
BEGIN
 SELECT a.* INTO _a FROM public.appointments a LEFT JOIN public.salon_clients c ON c.id=a.salon_client_id
  WHERE a.id=_appointment AND _phone<>'' AND (regexp_replace(coalesce(a.client_whatsapp,''),'\D','','g')=_phone OR regexp_replace(coalesce(c.whatsapp,''),'\D','','g')=_phone) FOR UPDATE OF a;
 IF NOT FOUND THEN RAISE EXCEPTION 'Reserva não encontrada'; END IF;
 IF _a.status IN ('cancelado','finalizado') THEN RAISE EXCEPTION 'Esta reserva não pode mais ser cancelada'; END IF;
 SELECT coalesce((SELECT cancel_min_hours FROM public.salon_booking_rules WHERE salon_id=_a.salon_id),2) INTO _hours;
 IF _a.starts_at - now() < make_interval(hours=>_hours) THEN RAISE EXCEPTION 'Cancelamento permitido somente com até % horas de antecedência', _hours; END IF;
 UPDATE public.appointments SET status='cancelado' WHERE id=_a.id;
 RETURN jsonb_build_object('id',_a.id,'starts_at',_a.starts_at);
END $$;
REVOKE ALL ON FUNCTION public.public_cancel_appointment(uuid,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.public_cancel_appointment(uuid,text) TO anon, authenticated;

CREATE FUNCTION public.notify_waitlist_on_cancel() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE _w public.lista_espera; _s public.salons;
BEGIN
 IF new.status <> 'cancelado' OR old.status = 'cancelado' OR new.starts_at <= now() THEN RETURN new; END IF;
 SELECT * INTO _w FROM public.lista_espera WHERE salon_id=new.salon_id AND desired_at=new.starts_at AND status='aguardando'
  AND (professional_id IS NULL OR professional_id=new.professional_id) ORDER BY created_at LIMIT 1 FOR UPDATE SKIP LOCKED;
 IF NOT FOUND THEN RETURN new; END IF;
 SELECT * INTO _s FROM public.salons WHERE id=new.salon_id;
 UPDATE public.lista_espera SET status='notificado', notified_at=now() WHERE id=_w.id;
 INSERT INTO public.fila_mensagens_ia(salon_id,appointment_id,dedupe_key,cliente_whatsapp,mensagem,tipo,agendado_para)
 VALUES(new.salon_id,new.id,'espera:'||_w.id,_w.whatsapp,
  'Olá! Abriu vaga no salão '||coalesce(nullif(_s.name,''),'')||' no horário '||to_char(new.starts_at AT TIME ZONE _s.timezone,'DD/MM "às" HH24:MI')||' que você queria! Quer agendar?',
  'lista_espera',now()) ON CONFLICT (dedupe_key) DO NOTHING;
 RETURN new;
END $$;
CREATE TRIGGER appointments_waitlist_notify AFTER UPDATE OF status ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.notify_waitlist_on_cancel();