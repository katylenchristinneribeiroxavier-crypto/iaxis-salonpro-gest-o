DROP POLICY IF EXISTS "plans signed in read" ON public.plans;
CREATE POLICY "plans scoped read" ON public.plans FOR SELECT TO authenticated USING (
  public.has_role(auth.uid(),'super_admin')
  OR public.has_role(auth.uid(),'revendedor')
  OR EXISTS (SELECT 1 FROM public.salons s WHERE s.plan_id = plans.id AND public.belongs_salon(s.id))
);