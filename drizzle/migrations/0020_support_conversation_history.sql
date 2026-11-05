CREATE TABLE public.support_ticket_messages (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 ticket_id uuid NOT NULL REFERENCES public.tickets_suporte(id),
 author_id uuid NOT NULL,
 is_developer boolean NOT NULL,
 body text NOT NULL CHECK (char_length(btrim(body)) BETWEEN 1 AND 4000),
 created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.support_ticket_messages TO authenticated;
GRANT ALL ON public.support_ticket_messages TO service_role;
ALTER TABLE public.support_ticket_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY support_message_read ON public.support_ticket_messages FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.tickets_suporte t WHERE t.id=ticket_id AND (t.user_id=auth.uid() OR public.has_role(auth.uid(),'super_admin'))));
CREATE INDEX support_messages_ticket_date ON public.support_ticket_messages(ticket_id,created_at);
CREATE FUNCTION public.reply_support_ticket(_ticket uuid,_body text,_status text DEFAULT NULL) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE _admin boolean; _owner uuid; _id uuid;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Entre na sua conta'; END IF;
 _admin:=public.has_role(auth.uid(),'super_admin');
 SELECT user_id INTO _owner FROM public.tickets_suporte WHERE id=_ticket FOR UPDATE;
 IF NOT FOUND OR (NOT _admin AND _owner<>auth.uid()) THEN RAISE EXCEPTION 'Chamado indisponível'; END IF;
 IF char_length(btrim(coalesce(_body,''))) NOT BETWEEN 1 AND 4000 THEN RAISE EXCEPTION 'Resposta inválida'; END IF;
 IF _status IS NOT NULL AND (NOT _admin OR _status NOT IN ('aberto','em_atendimento','resolvido')) THEN RAISE EXCEPTION 'Status não permitido'; END IF;
 INSERT INTO public.support_ticket_messages(ticket_id,author_id,is_developer,body) VALUES(_ticket,auth.uid(),_admin,btrim(_body)) RETURNING id INTO _id;
 UPDATE public.tickets_suporte SET status=CASE WHEN _admin THEN coalesce(_status,'em_atendimento') ELSE 'aberto' END WHERE id=_ticket;
 RETURN _id;
END $$;
REVOKE ALL ON FUNCTION public.reply_support_ticket(uuid,text,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.reply_support_ticket(uuid,text,text) TO authenticated;
COMMENT ON TABLE public.support_ticket_messages IS 'Histórico imutável do suporte: somente solicitante e desenvolvedora podem ler; autoria e papel atribuídos pelo banco.';