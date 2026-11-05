import { useQuery, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Check, Search } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { salonContextOptions } from '@/lib/salon-data';
import { PageTitle, Stat, StatusBadge, inputCls } from './Shell';
import { Button } from './ui/button';
import { brl } from '@/lib/auth';

type Row = { id: string; client_name: string; starts_at: string; status: string; price: number; deposit:number; valor_sinal_pago: number; status_sinal: string; services: { name: string } | null };

export function ClientsDeposits() {
  const { data: ctx } = useSuspenseQuery(salonContextOptions);
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('todos');

  const { data } = useQuery({
    queryKey: ['clients-deposits', ctx.salon?.id],
    enabled: !!ctx.salon,
    queryFn: async () => {
      if (!ctx.salon) return null;
      const r = await supabase.from('appointments')
        .select('id, client_name, starts_at, status, price, deposit, valor_sinal_pago, status_sinal, services(name)')
        .eq('salon_id', ctx.salon.id)
        .neq('status', 'cancelado')
        .gte('starts_at', new Date().toISOString().slice(0, 10))
        .order('starts_at');
      if (r.error) throw r.error;
      return (r.data ?? []) as Row[];
    },
  });

  const rows = (data ?? []).filter((r) => {
    if (!r.client_name.toLowerCase().includes(search.toLowerCase())) return false;
    if (filter === 'confirmados') return r.status_sinal === 'pago';
    if (filter === 'pendentes') return r.status_sinal === 'pendente';
    if (filter === 'isentos') return r.status_sinal === 'isento';
    return true;
  });

  const confirmados = (data ?? []).filter((r) => r.status_sinal === 'pago').length;
  const pendentes = (data ?? []).filter((r) => r.status_sinal === 'pendente').length;
  const totalPendente = (data ?? []).filter((r) => r.status_sinal === 'pendente').reduce((s, r) => s + Number(r.deposit), 0);

  const confirmar = async (id: string): Promise<void> => {
    const row=data?.find(r=>r.id===id);if(!row)return;
    const r = await supabase.from('appointments').update({ status_sinal: 'pago',valor_sinal_pago:row.deposit }).eq('id', id);
    if (r.error) { toast.error(r.error.message); return; }
    toast.success('Sinal confirmado');
    await qc.invalidateQueries({ queryKey: ['clients-deposits'] });
  };

  return <>
    <PageTitle title="Clientes e sinais" sub="Acompanhe quem já confirmou o horário com o pagamento do sinal" />
    <div className="grid gap-4 sm:grid-cols-3">
      <Stat label="Sinais confirmados" value={String(confirmados)} />
      <Stat label="Aguardando pagamento" value={String(pendentes)} />
      <Stat label="Valor pendente" value={brl(totalPendente)} />
    </div>

    <div className="mt-6 flex flex-wrap items-center gap-3">
      <label className="flex items-center gap-2">
        <Search className="h-5 w-5 text-muted-foreground" />
        <input aria-label="Buscar cliente" className={inputCls} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nome do cliente" />
      </label>
      <select aria-label="Filtrar por status do sinal" className={`${inputCls} max-w-56`} value={filter} onChange={(e) => setFilter(e.target.value)}>
        <option value="todos">Todos</option>
        <option value="confirmados">Sinal confirmado</option>
        <option value="pendentes">Aguardando pagamento</option>
        <option value="isentos">Sem sinal</option>
      </select>
    </div>

    <div className="mt-5 overflow-x-auto">
      <table className="w-full text-sm">
        <thead><tr className="border-b text-left text-muted-foreground">{['Cliente', 'Data do agendamento', 'Serviço', 'Valor do sinal', 'Sinal', 'Agendamento', ''].map((h) => <th key={h} className="p-3">{h}</th>)}</tr></thead>
        <tbody>{rows.map((r) => <tr key={r.id} className="border-b">
          <td className="p-3 font-medium">{r.client_name}</td>
          <td className="p-3">{new Date(r.starts_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</td>
          <td className="p-3">{r.services?.name ?? '—'} · {brl(Number(r.price))}</td>
          <td className="p-3 text-gold">{r.status_sinal === 'isento' ? '—' : brl(Number(r.status_sinal==='pago'?r.valor_sinal_pago:r.deposit))}</td>
          <td className="p-3"><StatusBadge s={r.status_sinal === 'pago' ? 'confirmado' : r.status_sinal === 'pendente' ? 'pendente' : 'isento'} /></td>
          <td className="p-3"><StatusBadge s={r.status} /></td>
          <td className="p-3">{r.status_sinal === 'pendente' && <Button size="sm" variant="outline" onClick={() => confirmar(r.id)}><Check />Confirmar</Button>}</td>
        </tr>)}</tbody>
      </table>
      {!rows.length && <p className="py-8 text-muted-foreground">Nenhum agendamento futuro encontrado.</p>}
    </div>
  </>;
}
