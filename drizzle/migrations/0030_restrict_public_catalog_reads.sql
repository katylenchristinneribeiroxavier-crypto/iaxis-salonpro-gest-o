DROP POLICY IF EXISTS "pros public" ON public.professionals;
DROP POLICY IF EXISTS "services public" ON public.services;
DROP POLICY IF EXISTS "settings public" ON public.platform_settings;
CREATE POLICY "settings master read" ON public.platform_settings FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'super_admin'));
REVOKE SELECT ON public.platform_settings FROM anon;
REVOKE SELECT ON public.professionals FROM anon;
REVOKE SELECT ON public.services FROM anon;
CREATE OR REPLACE FUNCTION public.public_pix_payment()
RETURNS TABLE(pix_key text, pix_holder text, pix_bank text, pix_cnpj text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT pix_key, pix_holder, pix_bank, pix_cnpj FROM public.platform_settings WHERE id = 1
$$;
REVOKE ALL ON FUNCTION public.public_pix_payment() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.public_pix_payment() TO anon, authenticated;