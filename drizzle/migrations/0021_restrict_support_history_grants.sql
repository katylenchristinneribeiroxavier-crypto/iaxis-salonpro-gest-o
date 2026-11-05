REVOKE ALL ON public.support_ticket_messages FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.support_ticket_messages TO authenticated;
GRANT ALL ON public.support_ticket_messages TO service_role;