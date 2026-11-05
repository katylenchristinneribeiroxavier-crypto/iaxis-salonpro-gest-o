import { useQuery, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { useState } from 'react';
import { Headset, Send, Search, ArrowLeft, Check, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { supportTicketsOptions, supportStatusLabels } from '@/lib/support-data';
import { PageTitle, inputCls, StatusBadge } from './Shell';
import { Button } from './ui/button';

export function SupportInbox({ master = false }: { master?: boolean }) {
  const qc = useQueryClient();
  const { data: tickets } = useSuspenseQuery(supportTicketsOptions(master));
  const [selected, setSelected] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [body, setBody] = useState('');
  const [nextStatus, setNextStatus] = useState('em_atendimento');
  const [busy, setBusy] = useState(false);
  const ticket = tickets.find(t => t.id === selected);
  const { data: messages = [], isPending, isError, refetch } = useQuery({
    queryKey: ['support-messages', selected], enabled: !!selected,
    refetchInterval: selected ? 10000 : false,
    queryFn: async () => {
      if (!selected) return [];
      const result = await supabase.from('support_ticket_messages').select('*').eq('ticket_id', selected).order('created_at');
      if (result.error) throw result.error;
      return result.data;
    },
  });
  const filtered = tickets.filter(t => (!status || t.status === status) && `${t.nome_cliente} ${t.contato} ${t.mensagem} ${t.id}`.toLocaleLowerCase('pt-BR').includes(search.toLocaleLowerCase('pt-BR')));
  const refresh = async () => {
    await Promise.all([qc.invalidateQueries({ queryKey: ['support-tickets'] }), qc.invalidateQueries({ queryKey: ['support-messages', selected] })]);
  };
  async function reply(e: React.FormEvent) {
    e.preventDefault();
    if (!ticket || !body.trim() || busy) return;
    setBusy(true);
    try {
      const result = await supabase.rpc('reply_support_ticket', { _ticket: ticket.id, _body: body.trim(), _status: master ? nextStatus : undefined });
      if (result.error) throw result.error;
      setBody('');
      await refresh();
      toast.success('Resposta registrada');
    } catch { toast.error('Não foi possível enviar a resposta. Tente novamente.'); }
    finally { setBusy(false); }
  }
  async function changeStatus(value: string) {
    if (!ticket || !master || busy) return;
    setBusy(true);
    try {
      const result = await supabase.from('tickets_suporte').update({ status: value }).eq('id', ticket.id).select('id').single();
      if (result.error) throw result.error;
      await refresh();
      toast.success('Status atualizado');
    } catch { toast.error('Não foi possível atualizar o chamado'); }
    finally { setBusy(false); }
  }
  return <>
    <div className="flex flex-wrap items-start justify-between gap-4">
      <PageTitle title={master ? 'Central de suporte' : 'Meus chamados'} />
      {!master && <Button asChild variant="outline"><Link to="/suporte"><Headset />Novo chamado</Link></Button>}
    </div>
    <div className="mb-8 grid grid-cols-3 gap-3 border-y py-5">
      {Object.entries(supportStatusLabels).map(([key, label]) => <div key={key}><p className="text-sm text-muted-foreground">{label}</p><p className="mt-1 font-display text-3xl text-gold">{tickets.filter(t => t.status === key).length}</p></div>)}
    </div>
    <div className="grid min-w-0 gap-8 lg:grid-cols-[minmax(260px,340px)_minmax(0,1fr)]">
      <section aria-label="Lista de chamados" className={ticket ? 'hidden lg:block' : ''}>
        <div className="relative"><Search className="absolute top-3 left-3 h-4 w-4 text-muted-foreground" /><input aria-label="Buscar chamados" placeholder="Buscar chamados" className={`${inputCls} pl-9`} value={search} onChange={e => setSearch(e.target.value)} /></div>
        <select aria-label="Filtrar chamados por status" className={`${inputCls} mt-3`} value={status} onChange={e => setStatus(e.target.value)}><option value="">Todos os status</option>{Object.entries(supportStatusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
        <div className="mt-4 max-h-[650px] space-y-2 overflow-y-auto">
          {filtered.map(t => <Button key={t.id} variant="ghost" className={`h-auto w-full min-w-0 justify-start rounded-md border p-4 text-left whitespace-normal ${selected === t.id ? 'border-primary bg-accent' : ''}`} onClick={() => { setSelected(t.id); setBody(''); setNextStatus(t.status === 'resolvido' ? 'resolvido' : 'em_atendimento'); }}>
            <span className="block min-w-0 flex-1"><span className="flex flex-wrap items-center justify-between gap-2"><span className="font-semibold">#{t.id.slice(0, 8)}</span><StatusBadge s={supportStatusLabels[t.status] || t.status} /></span><span className="mt-2 block truncate">{t.nome_cliente || t.contato || 'Solicitante'}</span><span className="mt-1 block truncate text-sm font-normal text-muted-foreground">{t.mensagem}</span><span className="mt-2 block text-xs font-normal text-muted-foreground">{new Date(t.created_at).toLocaleString('pt-BR')}</span></span>
          </Button>)}
          {!filtered.length && <p className="py-8 text-sm text-muted-foreground">Nenhum chamado encontrado.</p>}
        </div>
      </section>
      <section aria-label="Conversa do chamado" className="min-w-0">
        {!ticket ? <div className="flex min-h-64 flex-col items-center justify-center gap-3 text-muted-foreground"><Headset className="h-8 w-8 text-gold" /><p>Selecione um chamado</p></div> : <>
          <Button variant="ghost" size="sm" className="mb-4 lg:hidden" onClick={() => setSelected(null)}><ArrowLeft />Voltar aos chamados</Button>
          <div className="flex flex-wrap items-start justify-between gap-3 border-b pb-4"><div className="min-w-0"><h2 className="text-2xl">Chamado #{ticket.id.slice(0, 8)}</h2><p className="mt-1 break-words text-sm text-muted-foreground">{ticket.nome_cliente || 'Solicitante'} · {ticket.contato}</p></div><StatusBadge s={supportStatusLabels[ticket.status] || ticket.status} /></div>
          <div className="max-h-[550px] space-y-5 overflow-y-auto py-6" aria-live="polite">
            <article className="border-l-2 border-border pl-4"><p className="text-xs text-muted-foreground">Solicitante · {new Date(ticket.created_at).toLocaleString('pt-BR')}</p><p className="mt-2 break-words whitespace-pre-wrap">{ticket.mensagem}</p></article>
            {isPending && <p className="text-sm text-muted-foreground">Carregando respostas…</p>}
            {isError && <div><p>Não foi possível carregar as respostas.</p><Button variant="outline" onClick={() => refetch()}>Tentar novamente</Button></div>}
            {messages.map(m => <article key={m.id} className={`border-l-2 pl-4 ${m.is_developer ? 'border-primary' : 'border-border'}`}><p className={`text-xs ${m.is_developer ? 'text-gold' : 'text-muted-foreground'}`}>{m.is_developer ? 'Suporte da desenvolvedora' : 'Solicitante'} · {new Date(m.created_at).toLocaleString('pt-BR')}</p><p className="mt-2 break-words whitespace-pre-wrap">{m.body}</p></article>)}
          </div>
          <form onSubmit={reply} className="space-y-3 border-t pt-5"><label className="block text-sm" htmlFor="support-reply">{master ? 'Resposta ao solicitante' : 'Mensagem para o suporte'}</label><textarea id="support-reply" aria-label="Resposta ao chamado" required maxLength={4000} rows={4} value={body} onChange={e => setBody(e.target.value)} className={inputCls} />
            <div className="flex flex-wrap gap-3">{master && <select aria-label="Status após resposta" value={nextStatus} onChange={e => setNextStatus(e.target.value)} className={`${inputCls} max-w-56`}>{Object.entries(supportStatusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>}<Button type="submit" disabled={busy || !body.trim()}><Send />{busy ? 'Enviando…' : 'Enviar resposta'}</Button>{master && <Button type="button" variant="outline" disabled={busy} onClick={() => changeStatus(ticket.status === 'resolvido' ? 'aberto' : 'resolvido')}>{ticket.status === 'resolvido' ? <RotateCcw /> : <Check />}{ticket.status === 'resolvido' ? 'Reabrir chamado' : 'Resolver chamado'}</Button>}</div>
          </form>
        </>}
      </section>
    </div>
  </>;
}