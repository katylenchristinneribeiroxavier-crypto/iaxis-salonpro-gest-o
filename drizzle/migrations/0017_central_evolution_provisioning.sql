CREATE TABLE public.platform_evolution_settings (id boolean PRIMARY KEY DEFAULT true CHECK (id), api_url text NOT NULL, api_key text NOT NULL, callback_origin text NOT NULL, enabled boolean NOT NULL DEFAULT false, verified_at timestamptz, updated_at timestamptz NOT NULL DEFAULT now(), updated_by uuid NOT NULL);
GRANT ALL ON public.platform_evolution_settings TO service_role;
ALTER TABLE public.platform_evolution_settings ENABLE ROW LEVEL SECURITY;
COMMENT ON TABLE public.platform_evolution_settings IS 'Private platform Evolution credentials; service role only after authenticated super_admin authorization. Never return api_key.';
CREATE TABLE public.platform_automation_audit (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), action text NOT NULL, performed_by uuid NOT NULL, performed_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT ON public.platform_automation_audit TO authenticated;
GRANT ALL ON public.platform_automation_audit TO service_role;
ALTER TABLE public.platform_automation_audit ENABLE ROW LEVEL SECURITY;
CREATE POLICY automation_master_audit ON public.platform_automation_audit FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'super_admin'));
ALTER TABLE public.configuracoes_salao ADD COLUMN evolution_managed boolean NOT NULL DEFAULT false;
CREATE FUNCTION public.protect_managed_evolution() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$ BEGIN
IF coalesce(auth.role(), '') <> 'service_role' THEN
IF TG_OP = 'INSERT' THEN
IF NEW.evolution_managed THEN RAISE EXCEPTION 'Conexão central é gerenciada pelo servidor'; END IF;
ELSE
IF NEW.evolution_managed IS DISTINCT FROM OLD.evolution_managed OR ((OLD.evolution_managed OR NEW.evolution_managed) AND (NEW.evolution_instance IS DISTINCT FROM OLD.evolution_instance OR NEW.evolution_api_url IS DISTINCT FROM OLD.evolution_api_url OR NEW.evolution_api_key IS DISTINCT FROM OLD.evolution_api_key OR NEW.evolution_webhook_enabled IS DISTINCT FROM OLD.evolution_webhook_enabled OR NEW.evolution_connection_state IS DISTINCT FROM OLD.evolution_connection_state)) THEN RAISE EXCEPTION 'Conexão central é gerenciada pelo servidor'; END IF;
END IF; END IF; RETURN NEW; END $$;
CREATE TRIGGER protect_managed_evolution BEFORE INSERT OR UPDATE ON public.configuracoes_salao FOR EACH ROW EXECUTE FUNCTION public.protect_managed_evolution();