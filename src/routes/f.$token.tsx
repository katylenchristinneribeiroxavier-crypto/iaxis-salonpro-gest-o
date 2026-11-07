import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Brand, inputCls } from '@/components/Shell';
import { Button } from '@/components/ui/button';
import { brl } from '@/lib/auth';
import { StaffMonthlyFinance } from '@/components/StaffMonthlyFinance';

export const Route = createFileRoute('/f/$token')({
  head: () => ({ meta: [
    { title: 'Meu acesso pessoal — IAxis SalonPRO' },
    { name: 'description', content: 'Agenda pessoal e comissão da profissional do salão.' },
    { name: 'robots', content: 'noindex, nofollow' },
    { property: 'og:title', content: 'Meu acesso pessoal — IAxis SalonPRO' },
    { property: 'og:description', content: 'Sua agenda e sua comissão do mês.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary' },
  ] }),
  component: Portal,
});

type Item = { id: string; starts_at: string; duration_min: number; client_name: string; service: string | null; status: string; motivo: string };
type Feito = { starts_at: string; service: string | null; client_name: string; price: number; commission: number | null };
type Data = { salon: { name: string; logo_url: string; timezone: string }; professional: { name: string; photo_url: string; commission_pct: number }; agenda: Item[]; comissao_mes: number; servicos_mes: Feito[] };

const isUuid = (v: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);

function Portal() {
  const { token } = Route.useParams();
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ['staff-portal', token], retry: false, queryFn: async () => {
    if (!isUuid(token)) throw new Error('Link inválido');
    const r = await supabase.rpc('staff_portal' as never, { _token: token } as never);
    if (r.error) throw new Error(r.error.message);
    return r.data as unknown as Data;
  } });
  const [open, setOpen] = useState<{ id: string; action: 'desmarcar' | 'remarcar' } | null>(null);
  const [reason, setReason] = useState(''); const [when, setWhen] = useState(''); const [busy, setBusy] = useState(false);

  if (q.isPending) return <main className="grid min-h-screen place-items-center"><p className="text-muted-foreground">Carregando…</p></main>;
  if (q.isError || !q.data) return <main className="grid min-h-screen place-items-center p-6"><div className="max-w-md rounded-xl border border-destructive bg-card p-8 text-center"><Brand /><h1 className="mt-6 text-2xl">Link inválido</h1><p className="mt-2 text-muted-foreground">Este acesso pessoal não existe ou foi desativado. Peça um novo link à dona do salão.</p></div></main>;
  const d = q.data; const tz = d.salon.timezone || 'America/Sao_Paulo';
  const fmt = (s: string) => new Date(s).toLocaleString('pt-BR', { timeZone: tz, weekday: 'short', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); if (!open) return; setBusy(true);
    const r = await supabase.rpc('staff_change_appointment' as never, { _token: token, _appointment: open.id, _action: open.action, _reason: reason, _new_starts: open.action === 'remarcar' && when ? new Date(when).toISOString() : null } as never);
    setBusy(false);
    if (r.error) return void toast.error(r.error.message);
    toast.success(open.action === 'desmarcar' ? 'Cliente desmarcada. A lista de espera foi avisada.' : 'Atendimento remarcado');
    setOpen(null); setReason(''); setWhen(''); qc.invalidateQueries({ queryKey: ['staff-portal', token] });
  };

  return <main className="mx-auto min-h-screen max-w-3xl p-5">
    <header className="flex items-center justify-between border-b pb-4"><div className="flex items-center gap-3">{d.salon.logo_url ? <img src={d.salon.logo_url} alt={`Logo ${d.salon.name}`} className="h-12 w-12 rounded-md object-cover" /> : null}<div><p className="text-xs text-muted-foreground">Seu salão</p><h1 className="text-2xl text-gold">{d.salon.name || 'Salão'}</h1></div></div><Brand /></header>
    <section className="mt-6 flex items-center gap-4">{d.professional.photo_url ? <img src={d.professional.photo_url} alt={d.professional.name} className="h-14 w-14 rounded-full object-cover" /> : null}<div><p className="text-sm text-muted-foreground">Olá,</p><p className="text-xl font-semibold">{d.professional.name}</p></div></section>
    <StaffMonthlyFinance token={token} />
    <h2 className="mt-8 text-2xl">Minha agenda (hoje e próximos 7 dias)</h2>
    {d.agenda.length === 0 && <p className="mt-3 text-muted-foreground">Nenhum agendamento.</p>}
    <div className="mt-3 space-y-2">{d.agenda.map(a => <article key={a.id} className="rounded-xl border bg-card p-4"><div className="flex flex-wrap items-center gap-3"><span className="font-display text-lg text-gold">{fmt(a.starts_at)}</span><div className="flex-1"><p className="font-semibold">{a.client_name}</p><p className="text-sm text-muted-foreground">{a.service ?? 'Serviço'} · {a.status}</p>{a.motivo && <p className="text-xs text-muted-foreground">{a.motivo}</p>}</div>{!['cancelado', 'finalizado'].includes(a.status) && <div className="flex gap-2"><Button size="sm" variant="outline" onClick={() => setOpen({ id: a.id, action: 'remarcar' })}>Remarcar</Button><Button size="sm" variant="destructive" onClick={() => setOpen({ id: a.id, action: 'desmarcar' })}>Desmarcar</Button></div>}</div>
      {open?.id === a.id && <form onSubmit={submit} className="mt-4 grid gap-3 border-t pt-4">{open.action === 'remarcar' && <label className="text-sm">Novo horário<input required type="datetime-local" className={`${inputCls} mt-2`} value={when} onChange={e => setWhen(e.target.value)} /></label>}<label className="text-sm">Motivo<input required minLength={3} maxLength={300} className={`${inputCls} mt-2`} value={reason} onChange={e => setReason(e.target.value)} /></label><div className="flex gap-2"><Button disabled={busy} type="submit">{open.action === 'desmarcar' ? 'Confirmar desmarcação' : 'Confirmar remarcação'}</Button><Button type="button" variant="ghost" onClick={() => setOpen(null)}>Voltar</Button></div></form>}
    </article>)}</div>
    <p className="mt-10 text-center text-xs text-muted-foreground">Link pessoal e intransferível. Desenvolvido por Katylen Ribeiro</p>
  </main>;
}
