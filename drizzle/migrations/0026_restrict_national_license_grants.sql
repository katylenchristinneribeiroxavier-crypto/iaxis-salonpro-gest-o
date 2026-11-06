REVOKE ALL ON public.licencas_nacionais FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.licencas_nacionais TO authenticated;
GRANT ALL ON public.licencas_nacionais TO service_role;
REVOKE ALL ON FUNCTION public.sync_purchase_license() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.licenca_valida(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.licenca_valida(uuid) TO authenticated, service_role;