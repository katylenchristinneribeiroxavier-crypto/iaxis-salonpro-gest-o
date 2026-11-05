ALTER TABLE public.configuracoes_salao ADD COLUMN evolution_instance text NOT NULL DEFAULT '', ADD COLUMN evolution_connection_state text NOT NULL DEFAULT '', ADD COLUMN evolution_webhook_enabled boolean NOT NULL DEFAULT false, ADD COLUMN evolution_last_received_at timestamptz;
UPDATE public.configuracoes_salao c SET evolution_instance = sc.evolution_instance FROM public.salon_connections sc WHERE sc.salon_id = c.salon_id;
CREATE TABLE public.salon_messages (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), salon_id uuid NOT NULL REFERENCES public.salons(id), contact_phone text NOT NULL, contact_name text NOT NULL DEFAULT '', direction text NOT NULL, body text NOT NULL, provider_message_id text, status text NOT NULL DEFAULT 'pending', error text NOT NULL DEFAULT '', appointment_id uuid REFERENCES public.appointments(id), created_by uuid, created_at timestamptz NOT NULL DEFAULT now(), provider_timestamp timestamptz,
 UNIQUE(salon_id, provider_message_id)
);
GRANT SELECT ON public.salon_messages TO authenticated;
GRANT ALL ON public.salon_messages TO service_role;
ALTER TABLE public.salon_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY messages_manager_read ON public.salon_messages FOR SELECT TO authenticated USING (public.manages_salon(salon_id));
CREATE POLICY messages_salon_access ON public.salon_messages AS RESTRICTIVE FOR ALL TO authenticated USING (public.salon_access_allowed(salon_id)) WITH CHECK (public.salon_access_allowed(salon_id));
CREATE INDEX salon_messages_contact ON public.salon_messages(salon_id, contact_phone, created_at);
CREATE TABLE public.evolution_webhook_events (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), salon_id uuid NOT NULL REFERENCES public.salons(id), event_key text NOT NULL, event text NOT NULL, payload jsonb NOT NULL, received_at timestamptz NOT NULL DEFAULT now(), processed_at timestamptz, processing_error text NOT NULL DEFAULT '', UNIQUE(salon_id,event_key)
);
GRANT SELECT ON public.evolution_webhook_events TO authenticated;
GRANT ALL ON public.evolution_webhook_events TO service_role;
ALTER TABLE public.evolution_webhook_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY evolution_events_owner_read ON public.evolution_webhook_events FOR SELECT TO authenticated USING (public.owns_salon(salon_id));
CREATE POLICY evolution_events_salon_access ON public.evolution_webhook_events AS RESTRICTIVE FOR ALL TO authenticated USING (public.salon_access_allowed(salon_id)) WITH CHECK (public.salon_access_allowed(salon_id));
COMMENT ON COLUMN public.configuracoes_salao.evolution_api_key IS 'Private owner credential. Never returned by public functions or messaging settings reads.';