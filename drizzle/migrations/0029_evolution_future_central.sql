CREATE TABLE public.evolution_config_global (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  evolution_url text NOT NULL DEFAULT '',
  evolution_api_key_global text NOT NULL DEFAULT '',
  ativo boolean NOT NULL DEFAULT false,
  criado_em timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.evolution_config_global TO authenticated;
GRANT ALL ON public.evolution_config_global TO service_role;
ALTER TABLE public.evolution_config_global ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Master reads evolution global" ON public.evolution_config_global FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Master inserts evolution global" ON public.evolution_config_global FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Master updates evolution global" ON public.evolution_config_global FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'super_admin')) WITH CHECK (public.has_role(auth.uid(), 'super_admin'));
INSERT INTO public.evolution_config_global (evolution_url, evolution_api_key_global, ativo) VALUES ('', '', false);

ALTER TABLE public.salons ADD COLUMN IF NOT EXISTS evolution_instance_name text NOT NULL DEFAULT '';
ALTER TABLE public.salons ADD COLUMN IF NOT EXISTS evolution_conectado boolean NOT NULL DEFAULT false;
ALTER TABLE public.salons ADD COLUMN IF NOT EXISTS evolution_ultimo_qr text;

CREATE OR REPLACE FUNCTION public.master_gerar_instancia_futura(_salon uuid)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _name text;
BEGIN
  IF NOT public.has_role(auth.uid(), 'super_admin') THEN RAISE EXCEPTION 'Acesso negado'; END IF;
  SELECT evolution_instance_name INTO _name FROM public.salons WHERE id = _salon;
  IF NOT FOUND THEN RAISE EXCEPTION 'Salão não encontrado'; END IF;
  IF _name = '' THEN
    _name := 'iaxis-' || replace(_salon::text, '-', '');
    UPDATE public.salons SET evolution_instance_name = _name WHERE id = _salon;
  END IF;
  RETURN _name;
END $$;
REVOKE ALL ON FUNCTION public.master_gerar_instancia_futura(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.master_gerar_instancia_futura(uuid) TO authenticated;