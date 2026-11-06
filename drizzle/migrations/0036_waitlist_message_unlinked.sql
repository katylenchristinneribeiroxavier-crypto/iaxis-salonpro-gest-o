CREATE OR REPLACE FUNCTION public.notify_waitlist_on_cancel() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE _w public.lista_espera; _s public.salons;
BEGIN
 IF new.status <> 'cancelado' OR old.status = 'cancelado' OR new.starts_at <= now() THEN RETURN new; END IF;
 SELECT * INTO _w FROM public.lista_espera WHERE salon_id=new.salon_id AND desired_at=new.starts_at AND status='aguardando'
  AND (professional_id IS NULL OR professional_id=new.professional_id) ORDER BY created_at LIMIT 1 FOR UPDATE SKIP LOCKED;
 IF NOT FOUND THEN RETURN new; END IF;
 SELECT * INTO _s FROM public.salons WHERE id=new.salon_id;
 UPDATE public.lista_espera SET status='notificado', notified_at=now() WHERE id=_w.id;
 INSERT INTO public.fila_mensagens_ia(salon_id,dedupe_key,cliente_whatsapp,mensagem,tipo,agendado_para)
 VALUES(new.salon_id,'espera:'||_w.id,_w.whatsapp,
  'Olá! Abriu vaga no salão '||coalesce(nullif(_s.name,''),'')||' no horário '||to_char(new.starts_at AT TIME ZONE _s.timezone,'DD/MM "às" HH24:MI')||' que você queria! Quer agendar?',
  'lista_espera',now()) ON CONFLICT (dedupe_key) DO NOTHING;
 RETURN new;
END $$;