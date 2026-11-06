CREATE TABLE public.suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id uuid NOT NULL REFERENCES public.salons(id) ON DELETE CASCADE,
  nome text NOT NULL DEFAULT '',
  categoria text NOT NULL DEFAULT '',
  whatsapp text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  observacoes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (id, salon_id)
);
CREATE INDEX suppliers_salon_idx ON public.suppliers(salon_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.suppliers TO authenticated;
GRANT ALL ON public.suppliers TO service_role;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
CREATE POLICY suppliers_salon ON public.suppliers FOR ALL TO authenticated
  USING (public.manages_salon(salon_id)) WITH CHECK (public.manages_salon(salon_id));

CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id uuid NOT NULL REFERENCES public.salons(id) ON DELETE CASCADE,
  supplier_id uuid,
  nome text NOT NULL DEFAULT '',
  marca text NOT NULL DEFAULT '',
  unidade text NOT NULL DEFAULT 'ml' CHECK (unidade IN ('ml','g','unidade','litro')),
  quantidade_atual numeric NOT NULL DEFAULT 0,
  quantidade_minima numeric NOT NULL DEFAULT 0,
  custo_unitario numeric NOT NULL DEFAULT 0,
  consumo_por_servico numeric NOT NULL DEFAULT 0,
  servico_relacionado text NOT NULL DEFAULT '',
  qtd_usos_restantes numeric GENERATED ALWAYS AS (CASE WHEN consumo_por_servico > 0 THEN floor(quantidade_atual / consumo_por_servico) ELSE NULL END) STORED,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (id, salon_id),
  FOREIGN KEY (supplier_id, salon_id) REFERENCES public.suppliers(id, salon_id) ON DELETE SET NULL (supplier_id)
);
CREATE INDEX products_salon_idx ON public.products(salon_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY products_salon ON public.products FOR ALL TO authenticated
  USING (public.manages_salon(salon_id)) WITH CHECK (public.manages_salon(salon_id));

CREATE TABLE public.stock_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id uuid NOT NULL REFERENCES public.salons(id) ON DELETE CASCADE,
  product_id uuid NOT NULL,
  tipo text NOT NULL CHECK (tipo IN ('entrada','saida_uso','perda','ajuste')),
  quantidade numeric NOT NULL,
  motivo text NOT NULL DEFAULT '',
  appointment_id uuid,
  created_by uuid DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (product_id, salon_id) REFERENCES public.products(id, salon_id) ON DELETE CASCADE
);
CREATE INDEX stock_movements_salon_idx ON public.stock_movements(salon_id, created_at DESC);
CREATE UNIQUE INDEX stock_movements_appt_once ON public.stock_movements(appointment_id, product_id) WHERE appointment_id IS NOT NULL;
GRANT SELECT, INSERT ON public.stock_movements TO authenticated;
GRANT ALL ON public.stock_movements TO service_role;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
CREATE POLICY stock_movements_read ON public.stock_movements FOR SELECT TO authenticated USING (public.manages_salon(salon_id));
CREATE POLICY stock_movements_insert ON public.stock_movements FOR INSERT TO authenticated WITH CHECK (public.manages_salon(salon_id) AND appointment_id IS NULL);

CREATE OR REPLACE FUNCTION public.stock_on_appointment_done()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _svc text; p record;
BEGIN
  IF NEW.status <> 'finalizado' OR OLD.status = 'finalizado' OR NEW.service_id IS NULL THEN RETURN NEW; END IF;
  SELECT name INTO _svc FROM services WHERE id = NEW.service_id AND salon_id = NEW.salon_id;
  IF _svc IS NULL THEN RETURN NEW; END IF;
  FOR p IN SELECT id, consumo_por_servico FROM products
    WHERE salon_id = NEW.salon_id AND consumo_por_servico > 0
      AND lower(trim(servico_relacionado)) <> '' AND lower(_svc) LIKE '%' || lower(trim(servico_relacionado)) || '%'
  LOOP
    INSERT INTO stock_movements(salon_id, product_id, tipo, quantidade, motivo, appointment_id, created_by)
    VALUES (NEW.salon_id, p.id, 'saida_uso', p.consumo_por_servico, 'Atendimento concluído: ' || _svc, NEW.id, auth.uid())
    ON CONFLICT DO NOTHING;
    IF FOUND THEN
      UPDATE products SET quantidade_atual = GREATEST(quantidade_atual - p.consumo_por_servico, 0) WHERE id = p.id;
    END IF;
  END LOOP;
  RETURN NEW;
END $$;
CREATE TRIGGER appointments_stock_done AFTER UPDATE OF status ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.stock_on_appointment_done();