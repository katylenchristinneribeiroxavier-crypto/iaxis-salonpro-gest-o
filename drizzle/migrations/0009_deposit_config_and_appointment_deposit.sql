ALTER TABLE public.salons
  ADD COLUMN IF NOT EXISTS cobrar_sinal BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS tipo_sinal TEXT NOT NULL DEFAULT 'porcentagem',
  ADD COLUMN IF NOT EXISTS valor_sinal NUMERIC NOT NULL DEFAULT 0;

ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS valor_sinal_pago NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS status_sinal TEXT NOT NULL DEFAULT 'pendente';

COMMENT ON COLUMN public.salons.cobrar_sinal IS 'Se true, o agendamento online só confirma após pagamento do sinal.';
COMMENT ON COLUMN public.salons.tipo_sinal IS 'porcentagem | fixo';
COMMENT ON COLUMN public.salons.valor_sinal IS 'Percentual (0-100) ou valor fixo em reais, conforme tipo_sinal.';
COMMENT ON COLUMN public.appointments.valor_sinal_pago IS 'Valor do sinal pago pelo cliente no agendamento online.';
COMMENT ON COLUMN public.appointments.status_sinal IS 'pendente | pago | isento';