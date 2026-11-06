CREATE TABLE public.despesas_salao (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id uuid NOT NULL REFERENCES public.salons(id) ON DELETE CASCADE,
  categoria text NOT NULL DEFAULT 'Outros',
  descricao text NOT NULL DEFAULT '',
  valor numeric NOT NULL CHECK (valor >= 0),
  data_despesa date NOT NULL DEFAULT current_date,
  criado_por uuid DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.despesas_salao TO authenticated;
GRANT ALL ON public.despesas_salao TO service_role;
ALTER TABLE public.despesas_salao ENABLE ROW LEVEL SECURITY;
CREATE POLICY despesas_salao_manager ON public.despesas_salao FOR ALL TO authenticated USING (public.manages_salon(salon_id)) WITH CHECK (public.manages_salon(salon_id));
CREATE POLICY despesas_salao_master_read ON public.despesas_salao FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'super_admin'));
CREATE INDEX despesas_salao_idx ON public.despesas_salao(salon_id, data_despesa);