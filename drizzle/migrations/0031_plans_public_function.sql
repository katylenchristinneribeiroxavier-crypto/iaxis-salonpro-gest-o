DROP POLICY IF EXISTS "plans public" ON public.plans;
CREATE POLICY "plans signed in read" ON public.plans FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
REVOKE SELECT ON public.plans FROM anon;
CREATE OR REPLACE FUNCTION public.public_plans()
RETURNS TABLE(id uuid, name text, price numeric, annual_monthly_price numeric, online_fee_pct numeric, sort integer)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id, name, price, annual_monthly_price, online_fee_pct, sort FROM public.plans ORDER BY sort
$$;
REVOKE ALL ON FUNCTION public.public_plans() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.public_plans() TO anon, authenticated;