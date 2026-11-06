-- 1) Dona cria o próprio salão (somente com compra confirmada e um salão por conta)
CREATE OR REPLACE FUNCTION public.can_create_own_salon(_owner uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 SELECT _owner IS NOT NULL AND _owner = auth.uid()
  AND NOT EXISTS (SELECT 1 FROM public.salons WHERE owner_id=_owner)
  AND (public.has_role(_owner,'super_admin') OR EXISTS (
    SELECT 1 FROM public.subscription_requests r JOIN public.profiles p ON p.id=_owner
    WHERE r.status='confirmado' AND (r.user_id=_owner OR (r.user_id IS NULL AND lower(r.email)=lower(p.email)))))
$$;
REVOKE ALL ON FUNCTION public.can_create_own_salon(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_create_own_salon(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.sanitize_owner_salon_insert() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$
BEGIN
 IF auth.uid() IS NOT NULL AND NOT public.has_role(auth.uid(),'super_admin') THEN
  new.status:='ativo'; new.access_enabled:=true; new.block_reason:=''; new.blocked_at:=NULL; new.blocked_by:=NULL;
  new.released_at:=NULL; new.suspended_until:=NULL; new.archived_at:=NULL; new.reseller_id:=NULL;
  new.evolution_instance_name:=''; new.evolution_conectado:=false; new.evolution_ultimo_qr:=NULL;
  new.slug:='salao-'||replace(new.owner_id::text,'-','');
 END IF;
 RETURN new;
END $$;
CREATE TRIGGER a_sanitize_owner_salon_insert BEFORE INSERT ON public.salons FOR EACH ROW EXECUTE FUNCTION public.sanitize_owner_salon_insert();

GRANT INSERT ON public.salons TO authenticated;
CREATE POLICY salons_owner_insert ON public.salons FOR INSERT TO authenticated
 WITH CHECK (owner_id = auth.uid() AND public.can_create_own_salon(owner_id));

-- 2) Portal da funcionária
ALTER TABLE public.professionals ADD COLUMN whatsapp text NOT NULL DEFAULT '';
ALTER TABLE public.professionals ADD COLUMN portal_token uuid NOT NULL DEFAULT gen_random_uuid();
CREATE UNIQUE INDEX professionals_portal_token_key ON public.professionals(portal_token);
ALTER TABLE public.appointments ADD COLUMN motivo_alteracao text NOT NULL DEFAULT '';

CREATE OR REPLACE FUNCTION public.staff_portal(_token uuid) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE _p public.professionals; _s public.salons; _m0 timestamptz; _m1 timestamptz;
BEGIN
 SELECT * INTO _p FROM public.professionals WHERE portal_token=_token;
 IF NOT FOUND THEN RAISE EXCEPTION 'Link inválido ou desativado'; END IF;
 SELECT * INTO _s FROM public.salons WHERE id=_p.salon_id;
 IF _s.archived_at IS NOT NULL OR _s.status<>'ativo' THEN RAISE EXCEPTION 'Salão indisponível'; END IF;
 _m0 := date_trunc('month', now() AT TIME ZONE _s.timezone) AT TIME ZONE _s.timezone;
 _m1 := (date_trunc('month', now() AT TIME ZONE _s.timezone) + interval '1 month') AT TIME ZONE _s.timezone;
 RETURN jsonb_build_object(
  'salon', jsonb_build_object('name',_s.name,'logo_url',_s.logo_url,'brand_color',_s.brand_color,'timezone',_s.timezone),
  'professional', jsonb_build_object('name',_p.name,'photo_url',_p.photo_url,'commission_pct',_p.commission_pct),
  'agenda', coalesce((SELECT jsonb_agg(jsonb_build_object('id',a.id,'starts_at',a.starts_at,'duration_min',a.duration_min,'client_name',a.client_name,'service',sv.name,'status',a.status,'motivo',a.motivo_alteracao) ORDER BY a.starts_at)
     FROM public.appointments a LEFT JOIN public.services sv ON sv.id=a.service_id
     WHERE a.professional_id=_p.id AND a.starts_at >= date_trunc('day', now() AT TIME ZONE _s.timezone) AT TIME ZONE _s.timezone AND a.starts_at < now()+interval '7 days'),'[]'::jsonb),
  'comissao_mes', coalesce((SELECT sum(commission_amount) FROM public.appointments WHERE professional_id=_p.id AND status='finalizado' AND starts_at>=_m0 AND starts_at<_m1),0),
  'servicos_mes', coalesce((SELECT jsonb_agg(jsonb_build_object('starts_at',a.starts_at,'service',sv.name,'client_name',a.client_name,'price',a.price,'commission',a.commission_amount) ORDER BY a.starts_at DESC)
     FROM public.appointments a LEFT JOIN public.services sv ON sv.id=a.service_id
     WHERE a.professional_id=_p.id AND a.status='finalizado' AND a.starts_at>=_m0 AND a.starts_at<_m1),'[]'::jsonb)
 );
END $$;

CREATE OR REPLACE FUNCTION public.staff_change_appointment(_token uuid, _appointment uuid, _action text, _reason text, _new_starts timestamptz DEFAULT NULL) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE _p public.professionals; _a public.appointments; _r text := btrim(coalesce(_reason,''));
BEGIN
 SELECT * INTO _p FROM public.professionals WHERE portal_token=_token;
 IF NOT FOUND THEN RAISE EXCEPTION 'Link inválido ou desativado'; END IF;
 IF NOT EXISTS (SELECT 1 FROM public.salons WHERE id=_p.salon_id AND status='ativo' AND archived_at IS NULL) THEN RAISE EXCEPTION 'Salão indisponível'; END IF;
 IF char_length(_r) < 3 OR char_length(_r) > 300 THEN RAISE EXCEPTION 'Informe o motivo'; END IF;
 SELECT * INTO _a FROM public.appointments WHERE id=_appointment AND professional_id=_p.id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Agendamento não encontrado'; END IF;
 IF _a.status IN ('cancelado','finalizado') THEN RAISE EXCEPTION 'Este agendamento não pode mais ser alterado'; END IF;
 IF _action='desmarcar' THEN
  UPDATE public.appointments SET status='cancelado', motivo_alteracao='Desmarcado pela profissional: '||_r WHERE id=_a.id;
 ELSIF _action='remarcar' THEN
  IF _new_starts IS NULL OR _new_starts <= now() THEN RAISE EXCEPTION 'Escolha um novo horário futuro'; END IF;
  UPDATE public.appointments SET starts_at=_new_starts, motivo_alteracao='Remarcado pela profissional: '||_r WHERE id=_a.id;
 ELSE RAISE EXCEPTION 'Ação inválida'; END IF;
 RETURN jsonb_build_object('id',_a.id,'action',_action);
END $$;
REVOKE ALL ON FUNCTION public.staff_portal(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.staff_change_appointment(uuid,uuid,text,text,timestamptz) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.staff_portal(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.staff_change_appointment(uuid,uuid,text,text,timestamptz) TO anon, authenticated;