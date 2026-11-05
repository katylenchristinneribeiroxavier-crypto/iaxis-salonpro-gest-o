CREATE TABLE public.caixa_master_saas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID REFERENCES public.salons(id) ON DELETE SET NULL,
  nome_salao TEXT NOT NULL DEFAULT '',
  tipo TEXT NOT NULL DEFAULT 'entrada_assinatura_mensal',
  descricao TEXT NOT NULL DEFAULT '',
  valor NUMERIC NOT NULL DEFAULT 0,
  valor_liquido NUMERIC NOT NULL DEFAULT 0,
  taxa NUMERIC NOT NULL DEFAULT 0,
  forma_pagamento TEXT NOT NULL DEFAULT 'pix_manual',
  status TEXT NOT NULL DEFAULT 'recebido',
  data_recebimento DATE NOT NULL DEFAULT CURRENT_DATE,
  mes_referencia TEXT NOT NULL DEFAULT to_char(CURRENT_DATE, 'YYYY-MM'),
  criado_por UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.caixa_master_saas TO authenticated;
GRANT ALL ON public.caixa_master_saas TO service_role;

ALTER TABLE public.caixa_master_saas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Somente super admin ve o caixa master"
  ON public.caixa_master_saas FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Somente super admin insere no caixa master"
  ON public.caixa_master_saas FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Somente super admin edita o caixa master"
  ON public.caixa_master_saas FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Somente super admin apaga do caixa master"
  ON public.caixa_master_saas FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));