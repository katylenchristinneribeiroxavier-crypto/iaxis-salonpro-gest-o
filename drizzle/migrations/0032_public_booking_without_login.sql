CREATE OR REPLACE FUNCTION public.public_book_appointment(_salon uuid, _service uuid, _professional uuid, _starts timestamptz, _name text, _whatsapp text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _s public.salons; _svc public.services; _deposit numeric:=0; _id uuid; _client uuid; _phone text; _nm text;
BEGIN
 _nm := btrim(coalesce(_name,'')); _phone := regexp_replace(coalesce(_whatsapp,''),'\D','','g');
 IF char_length(_nm) < 2 OR char_length(_nm) > 120 THEN RAISE EXCEPTION 'Informe seu nome'; END IF;
 IF char_length(_phone) < 10 OR char_length(_phone) > 15 THEN RAISE EXCEPTION 'Informe um WhatsApp válido com DDD'; END IF;
 IF _starts <= now() THEN RAISE EXCEPTION 'Escolha um horário futuro'; END IF;
 SELECT * INTO _s FROM public.salons WHERE id=_salon AND status='ativo' AND public.salon_access_allowed(id);
 IF NOT FOUND THEN RAISE EXCEPTION 'Salão indisponível'; END IF;
 SELECT * INTO _svc FROM public.services WHERE id=_service AND salon_id=_salon;
 IF NOT FOUND THEN RAISE EXCEPTION 'Serviço indisponível'; END IF;
 IF NOT EXISTS (SELECT 1 FROM public.professionals WHERE id=_professional AND salon_id=_salon) THEN RAISE EXCEPTION 'Profissional indisponível'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(_professional::text,0));
 IF NOT EXISTS(SELECT 1 FROM public.salon_available_slots(_salon,_service,_professional,(_starts AT TIME ZONE _s.timezone)::date) sl WHERE sl.starts_at=_starts) THEN RAISE EXCEPTION 'Horário indisponível. Escolha outro horário'; END IF;
 SELECT id INTO _client FROM public.salon_clients WHERE salon_id=_salon AND regexp_replace(whatsapp,'\D','','g')=_phone LIMIT 1;
 IF _client IS NULL THEN INSERT INTO public.salon_clients(salon_id,name,whatsapp) VALUES(_salon,_nm,_phone) RETURNING id INTO _client; END IF;
 IF _s.cobrar_sinal AND _svc.price>0 THEN
  _deposit:=CASE WHEN _s.tipo_sinal='fixo' THEN least(_s.valor_sinal,_svc.price) ELSE round(_svc.price*_s.valor_sinal/100,2) END;
  IF _deposit>0 AND _s.pix_key='' THEN RAISE EXCEPTION 'O salão precisa configurar o PIX do sinal'; END IF;
 END IF;
 INSERT INTO public.appointments(salon_id,salon_client_id,client_name,service_id,professional_id,starts_at,price,deposit,valor_sinal_pago,status_sinal,status)
 VALUES(_salon,_client,_nm,_service,_professional,_starts,_svc.price,_deposit,0,CASE WHEN _deposit>0 THEN 'pendente' ELSE 'isento' END,'confirmado') RETURNING id INTO _id;
 RETURN jsonb_build_object('id',_id,'starts_at',_starts,'deposit',_deposit,'price',_svc.price,'pix_key',CASE WHEN _deposit>0 THEN _s.pix_key ELSE '' END,'pix_holder',_s.pix_holder);
END $$;
REVOKE ALL ON FUNCTION public.public_book_appointment(uuid,uuid,uuid,timestamptz,text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.public_book_appointment(uuid,uuid,uuid,timestamptz,text,text) TO anon, authenticated;