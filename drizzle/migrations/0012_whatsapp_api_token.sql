ALTER TABLE public.salon_connections
  ADD COLUMN IF NOT EXISTS api_token TEXT NOT NULL DEFAULT '';

COMMENT ON COLUMN public.salon_connections.api_token IS 'Token/chave de API da Evolution ou Z-API para envio de mensagens WhatsApp.';