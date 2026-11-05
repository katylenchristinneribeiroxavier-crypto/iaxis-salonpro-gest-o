CREATE TABLE public.configuracoes_salao (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id uuid NOT NULL UNIQUE,
 salon_id uuid NOT NULL UNIQUE REFERENCES public.salons(id),
 whatsapp_salao text NOT NULL DEFAULT '',
 nome_salao text NOT NULL DEFAULT '',
 evolution_api_url text,
 evolution_api_key text
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.configuracoes_salao TO authenticated;
GRANT ALL ON public.configuracoes_salao TO service_role;
ALTER TABLE public.configuracoes_salao ENABLE ROW LEVEL SECURITY;
CREATE POLICY config_owner_read ON public.configuracoes_salao FOR SELECT TO authenticated USING (user_id = auth.uid() AND public.owns_salon(salon_id));
CREATE POLICY config_owner_insert ON public.configuracoes_salao FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND public.owns_salon(salon_id));
CREATE POLICY config_owner_update ON public.configuracoes_salao FOR UPDATE TO authenticated USING (user_id = auth.uid() AND public.owns_salon(salon_id)) WITH CHECK (user_id = auth.uid() AND public.owns_salon(salon_id));
CREATE POLICY config_access_allowed ON public.configuracoes_salao AS RESTRICTIVE FOR ALL TO authenticated USING (public.salon_access_allowed(salon_id)) WITH CHECK (public.salon_access_allowed(salon_id));
CREATE FUNCTION public.validate_salon_owner_config() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
 IF NOT EXISTS (SELECT 1 FROM public.salons WHERE id = NEW.salon_id AND owner_id = NEW.user_id) THEN
  RAISE EXCEPTION 'Configuração deve pertencer à dona do salão';
 END IF;
 IF NEW.whatsapp_salao <> '' AND NEW.whatsapp_salao !~ '^[0-9]{10,11}$' THEN
  RAISE EXCEPTION 'WhatsApp deve conter DDD e número válido';
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER validate_salon_owner_config BEFORE INSERT OR UPDATE ON public.configuracoes_salao FOR EACH ROW EXECUTE FUNCTION public.validate_salon_owner_config();
INSERT INTO public.configuracoes_salao (user_id, salon_id, nome_salao, evolution_api_url, evolution_api_key)
SELECT s.owner_id, s.id, s.name, NULLIF(c.evolution_url, ''), NULLIF(c.api_token, '') FROM public.salons s LEFT JOIN public.salon_connections c ON c.salon_id = s.id
ON CONFLICT DO NOTHING;
CREATE FUNCTION public.public_salon_booking_contact(_salon uuid) RETURNS TABLE(nome_salao text, whatsapp_salao text) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
 SELECT COALESCE(NULLIF(c.nome_salao,''),s.name),COALESCE(c.whatsapp_salao,'')
 FROM public.salons s LEFT JOIN public.configuracoes_salao c ON c.user_id = s.owner_id AND c.salon_id = s.id
 WHERE s.id = _salon AND s.status = 'ativo' AND public.salon_access_allowed(s.id)
$$;
REVOKE ALL ON FUNCTION public.public_salon_booking_contact(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.public_salon_booking_contact(uuid) TO anon, authenticated;