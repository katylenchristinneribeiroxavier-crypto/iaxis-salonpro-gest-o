import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { accessOpen } from '@/lib/salon-access';
import { PageTitle, Stat, StatusBadge, inputCls } from './Shell';
import { brl } from '@/lib/auth';

export function MasterSubscriptions() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('todos');

  const { data, error } = useQuery({
    queryKey: ['master-subscriptions'],
    queryFn: async () => {
      const [s, p, pr, r] = await Promise.all([
        supabase.from('salons').select('*').order('created_at', { ascending: false }),
        supabase.from('plans').select('*'),
        supabase.from('profiles').select('id, full_name, email'),
        supabase.from('subscription_requests').select('user_id, amount, status, billing, created_at').eq('status', 'confirmado'),
      ]);
      if (s.error) throw s.error;
      if (p.error) throw p.error;
      if (pr.error) throw pr.error;
      if (r.error) throw r.error;
      return { salons: s.data, plans: p.data, profiles: p.data ? pr.data : [], requests: r.data };
    },
  });

  const today = new Date().toISOString().slice(0, 10);
  const rows = (data?.salons ?? []).map((s) => {
    const plan = data?.plans.find((p) => p.id === s.plan_id);
    const owner = data?.profiles.find((p) => p.id === s.owner_id);
    const pago = data?.requests.filter((r) => r.user_id === s.owner_id).reduce((t, r) => t + Number(r.amount), 0) ?? 0;
    const atrasado = !!s.subscription_due_date && s.subscription_due_date <= today;
    return { s, plan, owner, pago, atrasado, mensal: plan ? Number(plan.price) : 0 };
  });

  const filtered = rows.filter((r) => {
    const texto = [r.s.name, r.owner?.email ?? '', r.owner?.full_name ?? '', r.plan?.name ?? ''].join(' ').toLowerCase();
    if (!texto.includes(search.toLowerCase())) return false;
    if (filter === 'ativos') return r.s.status === 'ativo' && !r.atrasado;
    if (filter === 'atrasados') return r.atrasado;
    if (filter === 'pendentes') return r.s.status !== 'ativo';
    return true;
  });

  const mrr = rows.filter((r) => r.s.status === 'ativo').reduce((t, r) => t + r.mensal, 0);
  const totalRecebido = rows.reduce((t, r) => t + r.pago, 0);
  const atrasados = rows.filter((r) => r.atrasado).length;

  return <>
    <PageTitle title="Assinaturas por salão" sub="O que cada cliente paga e o status de cada plano" />
    {error && <p role="alert">Não foi possível consultar as assinaturas.</p>}
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Stat label="Receita mensal prevista" value={brl(mrr)} />
      <Stat label="Total já recebido" value={brl(totalRecebido)} />
      <Stat label="Salões ativos" value={String(rows.filter((r) => r.s.status === 'ativo').length)} />
      <Stat label="Vencidos / vencendo hoje" value={String(atrasados)} />
    </div>

    <div className="mt-6 flex flex-wrap items-center gap-3">
      <label className="flex items-center gap-2">
        <Search className="h-5 w-5 text-muted-foreground" />
        <input aria-label="Buscar assinatura" className={inputCls} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por salão, dona ou plano" />
      </label>
      <select aria-label="Filtrar status" className={`${inputCls} max-w-56`} value={filter} onChange={(e) => setFilter(e.target.value)}>
        <option value="todos">Todos</option>
        <option value="ativos">Em dia</option>
        <option value="atrasados">Vencidos</option>
        <option value="pendentes">Assinatura pendente</option>
      </select>
    </div>

    <div className="mt-5 overflow-x-auto">
      <table className="w-full text-sm">
        <thead><tr className="border-b text-left text-muted-foreground">{['Salão', 'Cliente', 'Plano', 'Mensalidade', 'Total pago', 'Vencimento', 'Status', 'Acesso'].map((h) => <th key={h} className="p-3">{h}</th>)}</tr></thead>
        <tbody>{filtered.map((r) => <tr key={r.s.id} className="border-b">
          <td className="p-3">{r.s.name || 'Nome não informado'}</td>
          <td className="p-3"><p>{r.owner?.full_name || '—'}</p><p className="text-xs text-muted-foreground">{r.owner?.email ?? ''}</p></td>
          <td className="p-3">{r.plan?.name ?? 'Sem plano'}</td>
          <td className="p-3 text-gold">{r.plan ? brl(r.mensal) : '—'}</td>
          <td className="p-3">{brl(r.pago)}</td>
          <td className={`p-3 ${r.atrasado ? 'text-destructive' : ''}`}>{r.s.subscription_due_date ? new Date(`${r.s.subscription_due_date}T12:00:00`).toLocaleDateString('pt-BR') : '—'}</td>
          <td className="p-3"><StatusBadge s={r.atrasado ? 'inadimplente' : r.s.status} /></td>
          <td className="p-3">{accessOpen(r.s) ? 'Liberado' : 'Bloqueado'}</td>
        </tr>)}</tbody>
      </table>
      {!filtered.length && <p className="py-6 text-muted-foreground">Nenhuma assinatura encontrada.</p>}
    </div>
  </>;
}
