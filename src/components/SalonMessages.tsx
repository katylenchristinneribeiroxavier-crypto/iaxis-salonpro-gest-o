import { useQuery, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { Link } from '@tanstack/react-router';
import { useState } from 'react';
import { MessageCircle, Send, RefreshCw, Plus, CalendarDays, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { salonContextOptions } from '@/lib/salon-data';
import { sendSalonMessage } from '@/lib/evolution.functions';
import { recoverSalonMessages } from '@/lib/salon-messages.functions';
import { evolutionPhone } from '@/lib/evolution';
import { salonMessageSchema } from '@/lib/message-security';
import { brl } from '@/lib/auth';
import { Button } from './ui/button';
import { PageTitle, inputCls } from './Shell';

const statuses: Record<string, string> = { pending: 'Preparando', accepted: 'Aceita pela Evolution', sent: 'Enviada', delivered: 'Entregue', read: 'Lida', received: 'Recebida', failed: 'Falha', unknown: 'Confira no WhatsApp antes de reenviar' };
export function SalonMessages() {
  const { data: ctx } = useSuspenseQuery(salonContextOptions);
  const qc = useQueryClient();
  const send = useServerFn(sendSalonMessage);
  const recover = useServerFn(recoverSalonMessages);
  const [phone, setPhone] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [search, setSearch] = useState('');
  const [draft, setDraft] = useState('');
  const [appointment, setAppointment] = useState('');
  const [busy, setBusy] = useState(false);
  const { data, error, isPending } = useQuery({ queryKey: ['salon-messages', ctx.salon?.id], enabled: !!ctx.salon, refetchInterval: 8000,
    queryFn: async () => {
      if (!ctx.salon) return { messages: [], appointments: [], clients: [] };
      const [m, a, c] = await Promise.all([
        supabase.from('salon_messages').select('*').eq('salon_id', ctx.salon.id).order('created_at', { ascending: false }).limit(500),
        supabase.from('appointments').select('id, client_name, salon_client_id, starts_at, valor_sinal_pago, status_sinal, status, services(name)').eq('salon_id', ctx.salon.id).neq('status', 'cancelado').order('starts_at', { ascending: false }).limit(100),
        supabase.from('salon_clients').select('id, name, whatsapp').eq('salon_id', ctx.salon.id),
      ]);
      if (m.error) throw m.error; if (a.error) throw a.error; if (c.error) throw c.error;
      return { messages: m.data, appointments: a.data, clients: c.data };
    },
  });
  const contacts = new Map<string, { name: string; last: string }>();
  for (const m of data?.messages || []) if (!contacts.has(m.contact_phone)) contacts.set(m.contact_phone, { name: m.contact_name || m.contact_phone, last: m.body });
  for (const c of data?.clients || []) { try { const p = evolutionPhone(c.whatsapp); if (!contacts.has(p)) contacts.set(p, { name: c.name, last: '' }); } catch { /* incomplete contact */ } }
  if (phone && !contacts.has(phone)) contacts.set(phone, { name: phone, last: '' });
  const messages = (data?.messages || []).filter(m => m.contact_phone === phone).reverse();
  const linked = data?.appointments.find(a => a.id === appointment);
  const refresh = async () => {
    if (!ctx.salon) return;
    try { await recover({ data: ctx.salon.id }); await qc.invalidateQueries({ queryKey: ['salon-messages'] }); }
    catch (err) { toast.error(err instanceof Error ? err.message : 'Falha ao atualizar.'); }
  };
  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); if (!ctx.salon || !phone || !draft.trim()) return;
    setBusy(true);
    try { const validated = salonMessageSchema.parse({ salonId: ctx.salon.id, phone, body: draft, appointmentId: appointment || undefined }); await send({ data: validated }); setDraft(''); toast.success('Mensagem aceita pela Evolution'); }
    catch (err) { toast.error(err instanceof Error ? err.message : 'Falha no envio.'); }
    finally { setBusy(false); await qc.invalidateQueries({ queryKey: ['salon-messages'] }); }
  };
  return <>
    <div className="flex flex-wrap items-start justify-between gap-3"><PageTitle title="Mensagens do salão" /><div className="flex gap-2"><Button title="Atualizar mensagens" aria-label="Atualizar mensagens" variant="outline" size="icon" onClick={refresh}><RefreshCw /></Button><Button asChild variant="outline"><Link to="/configuracoes/whatsapp">Conexão Evolution</Link></Button></div></div>
    {error && <p role="alert" className="mb-4 text-destructive">Não foi possível carregar as conversas.</p>}
    <div className="grid min-h-[600px] overflow-hidden rounded-lg border bg-card lg:grid-cols-[280px_minmax(0,1fr)]">
      <aside className="min-w-0 border-b p-4 lg:border-r lg:border-b-0">
        <input aria-label="Buscar conversa" placeholder="Buscar cliente ou número" className={inputCls} value={search} onChange={e => setSearch(e.target.value)} />
        <form className="my-3 flex gap-2" onSubmit={e => { e.preventDefault(); try { setPhone(evolutionPhone(newPhone)); setNewPhone(''); setAppointment(''); } catch (err) { toast.error(err instanceof Error ? err.message : 'Número inválido'); } }}><input type="tel" aria-label="WhatsApp para nova conversa" placeholder="DDD + WhatsApp" className={`${inputCls} min-w-0`} value={newPhone} onChange={e => setNewPhone(e.target.value)} /><Button aria-label="Nova conversa" title="Nova conversa" variant="outline" size="icon" type="submit"><Plus /></Button></form>
        <div className="max-h-96 space-y-1 overflow-y-auto">{Array.from(contacts).filter(([p, c]) => `${p} ${c.name}`.toLowerCase().includes(search.toLowerCase())).map(([p, c]) => <Button key={p} variant="ghost" className={`h-auto w-full justify-start overflow-hidden px-3 py-3 text-left ${phone === p ? 'bg-primary/15 text-gold' : ''}`} onClick={() => { setPhone(p); setAppointment(''); }}><div className="min-w-0"><p className="truncate font-semibold">{c.name}</p><p className="truncate text-xs text-muted-foreground">{c.last || p}</p></div></Button>)}{!contacts.size && <p className="py-8 text-sm text-muted-foreground">{isPending ? 'Carregando…' : 'Nenhuma conversa ainda.'}</p>}</div>
      </aside>
      {!phone ? <div className="flex min-h-80 flex-col items-center justify-center gap-3 p-8 text-muted-foreground"><MessageCircle className="h-10 w-10" /><p>Selecione uma conversa</p></div> : <div className="flex min-w-0 flex-col">
        <header className="border-b px-5 py-4"><h2 className="break-words text-xl">{contacts.get(phone)?.name || phone}</h2><p className="text-xs text-muted-foreground">{phone}</p></header>
        <div className="max-h-[520px] min-h-64 flex-1 space-y-4 overflow-y-auto p-5" aria-live="polite">{messages.map(m => <article key={m.id} className={`max-w-[90%] rounded-lg border p-3 sm:max-w-[80%] ${m.direction === 'outbound' ? 'ml-auto border-primary/30 bg-primary/10' : 'bg-muted'}`}><p className="whitespace-pre-wrap break-words text-sm">{m.body}</p><p className="mt-2 text-[11px] text-muted-foreground">{new Date(m.provider_timestamp || m.created_at).toLocaleString('pt-BR')} · {statuses[m.status] || m.status}</p>{m.error && <p className="mt-1 break-words text-xs text-destructive">{m.error}</p>}</article>)}{!messages.length && <p className="text-sm text-muted-foreground">Nenhuma mensagem nesta conversa.</p>}</div>
        <form className="space-y-3 border-t p-4" onSubmit={submit}>
          <select className={inputCls} aria-label="Agendamento relacionado" value={appointment} onChange={e => setAppointment(e.target.value)}><option value="">Sem agendamento vinculado</option>{data?.appointments.map(a => <option key={a.id} value={a.id}>{a.client_name} · {new Date(a.starts_at).toLocaleString('pt-BR')}</option>)}</select>
          <div className="flex flex-wrap gap-2"><Button type="button" variant="outline" size="sm" disabled={!linked} onClick={() => { if (linked) setDraft(`Olá, ${linked.client_name}! Seu agendamento no ${ctx.salon?.name} está marcado para ${new Date(linked.starts_at).toLocaleString('pt-BR')}. Podemos confirmar sua presença?`); }}><CalendarDays />Agendamento</Button><Button type="button" variant="outline" size="sm" disabled={!linked} onClick={() => { if (linked) setDraft(`Olá, ${linked.client_name}! O sinal do seu agendamento no ${ctx.salon?.name} é ${brl(linked.valor_sinal_pago)}. Status: ${linked.status_sinal === 'pago' ? 'recebimento confirmado' : linked.status_sinal === 'isento' ? 'isento' : 'aguardando confirmação do recebimento'}.`); }}><Wallet />Sinal</Button></div>
          <div className="flex items-end gap-2"><textarea aria-label="Mensagem" placeholder="Escreva sua resposta" maxLength={4000} rows={3} className={`${inputCls} min-w-0 resize-none`} value={draft} onChange={e => setDraft(e.target.value)} /><Button type="submit" size="icon" title="Enviar mensagem" aria-label="Enviar mensagem" disabled={busy || !draft.trim()}><Send /></Button></div>
        </form>
      </div>}
    </div>
  </>;
}