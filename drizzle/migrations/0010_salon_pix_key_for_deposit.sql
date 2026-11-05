ALTER TABLE public.salons
  ADD COLUMN IF NOT EXISTS pix_key TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS pix_holder TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS pix_city TEXT NOT NULL DEFAULT '';

COMMENT ON COLUMN public.salons.pix_key IS 'Chave PIX do salão para receber o sinal de agendamento.';
COMMENT ON COLUMN public.salons.pix_holder IS 'Nome do titular da chave PIX (máx. 25 caracteres no QR).';