-- Transactional regression tests: no test tickets remain after the run.
BEGIN;
INSERT INTO public.tickets_suporte(id,user_id,contato,mensagem) VALUES
 ('c804733e-1094-48fa-95df-e4eedb81fcb1','47111333-1111-4111-8111-111111111111','teste interno','Teste transacional do suporte'),
 ('c804733e-1094-48fa-95df-e4eedb81fcb2','47111333-1111-4111-8111-111111111112','teste interno','Outro solicitante');
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','47111333-1111-4111-8111-111111111111',true);
SELECT public.reply_support_ticket('c804733e-1094-48fa-95df-e4eedb81fcb1','Preciso de ajuda');
SELECT 1 / CASE WHEN EXISTS (SELECT 1 FROM public.support_ticket_messages WHERE ticket_id='c804733e-1094-48fa-95df-e4eedb81fcb1' AND author_id='47111333-1111-4111-8111-111111111111' AND NOT is_developer) THEN 1 ELSE 0 END AS requester_cannot_impersonate_developer;
DO $$ BEGIN
 BEGIN PERFORM public.reply_support_ticket('c804733e-1094-48fa-95df-e4eedb81fcb2','Acesso indevido'); RAISE EXCEPTION 'TEST FAILED: cross-account reply accepted';
 EXCEPTION WHEN raise_exception THEN IF SQLERRM <> 'Chamado indisponível' THEN RAISE; END IF; END;
END $$;
DO $$ BEGIN
 BEGIN PERFORM public.reply_support_ticket('c804733e-1094-48fa-95df-e4eedb81fcb1','Resolver','resolvido'); RAISE EXCEPTION 'TEST FAILED: requester changed status';
 EXCEPTION WHEN raise_exception THEN IF SQLERRM <> 'Status não permitido' THEN RAISE; END IF; END;
END $$;
SELECT set_config('request.jwt.claim.sub','6ec7fe72-e94e-4a4a-a94e-914ed3036d9d',true);
SELECT public.reply_support_ticket('c804733e-1094-48fa-95df-e4eedb81fcb1','Resposta da desenvolvedora','resolvido');
SELECT 1 / CASE WHEN EXISTS (SELECT 1 FROM public.tickets_suporte WHERE id='c804733e-1094-48fa-95df-e4eedb81fcb1' AND status='resolvido') THEN 1 ELSE 0 END AS developer_can_resolve;
SELECT set_config('request.jwt.claim.sub','47111333-1111-4111-8111-111111111112',true);
SELECT 1 / CASE WHEN NOT EXISTS (SELECT 1 FROM public.support_ticket_messages WHERE ticket_id='c804733e-1094-48fa-95df-e4eedb81fcb1') THEN 1 ELSE 0 END AS other_requester_cannot_read_history;
SELECT set_config('request.jwt.claim.sub','47111333-1111-4111-8111-111111111111',true);
SELECT public.reply_support_ticket('c804733e-1094-48fa-95df-e4eedb81fcb1','Ainda preciso de ajuda');
SELECT 1 / CASE WHEN EXISTS (SELECT 1 FROM public.tickets_suporte WHERE id='c804733e-1094-48fa-95df-e4eedb81fcb1' AND status='aberto') THEN 1 ELSE 0 END AS followup_reopens_ticket;
SELECT 1 / CASE WHEN NOT has_table_privilege('authenticated','public.support_ticket_messages','INSERT') AND NOT has_table_privilege('authenticated','public.support_ticket_messages','UPDATE') AND NOT has_table_privilege('authenticated','public.support_ticket_messages','DELETE') THEN 1 ELSE 0 END AS history_is_immutable;
SELECT 1 / CASE WHEN NOT has_function_privilege('anon','public.reply_support_ticket(uuid,text,text)','EXECUTE') THEN 1 ELSE 0 END AS anonymous_reply_denied;
ROLLBACK;