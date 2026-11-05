REVOKE ALL ON public.platform_evolution_settings FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.platform_evolution_settings TO service_role;
COMMENT ON TABLE public.platform_evolution_settings IS 'Central private credentials; no browser grants or RLS policies by design. Access only through authenticated super_admin server functions.';