import { createFileRoute } from '@tanstack/react-router';
import { useServerFn } from '@tanstack/react-start';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { ShieldCheck, Lock, CalendarDays } from 'lucide-react';
import { toast } from 'sonner';
import { RoleGate } from '@/components/RoleGate';
import { Brand, inputCls } from '@/components/Shell';
import { Button } from '@/components/ui/button';
import { gerenciarLicenca } from '@/lib/license.functions';
import { supabase } from '@/integrations/supabase/client';
import { pageHead } from '@/lib/salon-data';

export const Route = createFileRoute('/_authenticated/admin-master-iaxis-2026-secreto')({
  head: () => ({ ...pageHead('Controle de licenças nacionais', 'Controle exclusivo da desenvolvedora do IAxis SalonPRO.'), meta: [...pageHead('Controle de licenças nacionais', 'Controle exclusivo da desenvolvedora do IAxis SalonPRO.').meta, { name: 'robots', content: 'noindex, nofollow' }] }),
  component: () => <RoleGate role="super_admin"><MasterLicenses /></RoleGate>,
});

function MasterLicenses() {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const qc = useQueryClient();
  const update = useServerFn(gerenciarLicenca);
  const licenses = useQuery({ queryKey: ['master-licenses'], queryFn: async () => { const r = await supabase.from('licencas_nacionais').select('*').order('data_inicio', { ascending: false }); if (r.error) throw r.error; return r.data; } });
  async function action(acao: 'mensal' | 'anual' | 'bloquear') {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { toast.error('Informe um email válido.'); return; }
    setBusy(true);
    try { await update({ data: { email, acao } }); await Promise.all([qc.invalidateQueries({ queryKey: ['master-licenses'] }), qc.invalidateQueries({ queryKey: ['national-license'] }), qc.invalidateQueries({ queryKey: ['salon-access'] })]); toast.success(acao === 'bloquear' ? 'Licença bloqueada' : `Licença liberada por ${acao === 'anual' ? 365 : 30} dias`); }
    catch (e) { toast.error(e instanceof Error ? e.message : 'Não foi possível alterar a licença.'); }
    finally { setBusy(false); }
  }
  return <div className="min-h-screen bg-gradient-navy p-6 md:p-10"><Brand /><main className="mx-auto mt-12 max-w-4xl"><h1 className="flex items-center gap-3 text-4xl"><ShieldCheck className="shrink-0 text-gold" />Licenças nacionais</h1><section className="my-8 max-w-xl space-y-4"><label className="block text-sm">Email da cliente<input type="email" maxLength={254} className={`${inputCls} mt-2`} value={email} onChange={e => setEmail(e.target.value)} /></label><div className="flex flex-wrap gap-3"><Button disabled={busy} onClick={() => action('mensal')}><CalendarDays />LIBERAR MENSAL (+30 dias)</Button><Button disabled={busy} onClick={() => action('anual')}><CalendarDays />LIBERAR ANUAL (+365 dias)</Button><Button variant="destructive" disabled={busy} onClick={() => action('bloquear')}><Lock />BLOQUEAR</Button></div></section><section className="border-t pt-5">{licenses.isPending ? <p>Carregando licenças…</p> : licenses.error ? <p role="alert">Não foi possível consultar as licenças.</p> : !licenses.data?.length ? <p className="text-muted-foreground">Nenhuma licença cadastrada.</p> : <ul className="divide-y">{licenses.data.map(l => <li key={l.id} className="flex flex-wrap items-center justify-between gap-3 py-4"><div><p className="break-all">{l.email_cliente}</p><p className="text-sm text-muted-foreground">{l.tipo_plano} · {l.status} · Termos: {l.aceitou_termos ? 'aceitos' : 'pendentes'}</p></div><p className="text-sm text-gold">Vence em {new Date(l.data_expira).toLocaleDateString('pt-BR')}</p></li>)}</ul>}</section></main></div>;
}