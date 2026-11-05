import { useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { salonContextOptions } from '@/lib/salon-data';
import { PageTitle, Stat, inputCls } from './Shell';
import { brl } from '@/lib/auth';

type Row = { id: string; salon_id: string; client_name: string; starts_at: string; status: string; price: number; valor_sinal_pago: number; status_sinal: string };

export function SalonDeposits() {
  const { data: ctx } = useSuspenseQuery(salonContextOptions);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));

  const { data } = useQuery({
    queryKey: ['deposits', ctx.salon?.id, month, ctx.manager],
    enabled: !!ctx.salon,
    queryFn: async () => {
      if (!ctx.salon) return null;
      const start = new Date(`${month}-01T00:00:00`);
      const end = new Date(start); end.setMonth(end.getMonth() + 1);
      const q = supabase.from('appointments')
        .select('id, salon_id, client_name, starts_at, status, price, valor_sinal_pago, status_sinal')
        .gte('starts_at', start.toISOString()).lt('starts_at', end.toISOString())
        .neq('status', 'cancelado').order('starts_at', { ascending: false });
      const a = await (ctx.manager ? q.eq('salon_id', ctx.salon.id) : q);
      if (a.error) throw a.error;
      const s = await supabase.from('salons').select('id, name');
      if (s.error) throw s.error;
      return { rows: (a.data ?? []) as Row[], salons: s.data ?? [] };
    },
  });

  const rows = data?.rows ?? [];
  const comSinal = rows.filter((r) => r.status_sinal !== 'isento');
  const pendente = comSinal.filter((r) => r.status_sinal === 'pendente').reduce((s, r) => s + Number(r.valor_sinal_pago), 0);
  const confirmado = comSinal.filter((r) => r.status_sinal === 'pago').reduce((s, r) => s + Number(r.valor_sinal_pago), 0);
  const saldo = comSinal.filter((r) => r.status_sinal === 'pago').reduce((s, r) => s + Number(r.price) - Number(r.valor_sinal_pago), 0);

  const porSalao = (data?.salons ?? [])
    .map((s) => {
      const r = comSinal.filter((x) => x.salon_id === s.id);
      return {
        id: s.id, name: s.name || 'Sem nome',
        pendente: r.filter((x) => x.status_sinal === 'pendente').reduce((t, x) => t + Number(x.valor_sinal_pago), 0),
        confirmado: r.filter((x) => x.status_sinal === 'pago').reduce((t, x) => t + Number(x.valor_sinal_pago), 0),
        saldo: r.filter((x) => x.status_sinal === 'pago').reduce((t, x) => t + Number(x.price) - Number(x.valor_sinal_pago), 0),
      };
    })
    .filter((s) => s.pendente > 0 || s.confirmado > 0 || s.saldo > 0);

  return <>
    <PageTitle title="Sinais de agendamento" sub="Valores de sinal pendentes, confirmados e saldo a receber no salão" />
    <div className="mb-6"><input aria-label="Mês" type="month" className={`${inputCls} max-w-48`} value={month} onChange={(e) => setMonth(e.target.value)} /></div>
    <div className="grid gap-4 sm:grid-cols-3">
      <Stat label="Sinal pendente" value={brl(pendente)} />
      <Stat label="Sinal confirmado" value={brl(confirmado)} />
      <Stat label="Saldo a receber no salão" value={brl(saldo)} />
    </div>

    <section className="mt-8">
      <h2 className="text-2xl">Saldo por salão</h2>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="border-b text-left text-muted-foreground">{['Salão', 'Pendente', 'Confirmado', 'Saldo a receber'].map((h) => <th key={h} className="p-3">{h}</th>)}</tr></thead>
          <tbody>{porSalao.map((s) => <tr key={s.id} className="border-b"><td className="p-3">{s.name}</td><td className="p-3">{brl(s.pendente)}</td><td className="p-3 text-gold">{brl(s.confirmado)}</td><td className="p-3">{brl(s.saldo)}</td></tr>)}</tbody>
        </table>
        {!porSalao.length && <p className="py-6 text-muted-foreground">Nenhum sinal neste mês.</p>}
      </div>
    </section>

    <section className="mt-8">
      <h2 className="text-2xl">Agendamentos com sinal</h2>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="border-b text-left text-muted-foreground">{['Data', 'Cliente', 'Serviço', 'Sinal', 'Status do sinal', 'Saldo'].map((h) => <th key={h} className="p-3">{h}</th>)}</tr></thead>
          <tbody>{comSinal.map((r) => <tr key={r.id} className="border-b">
            <td className="p-3">{new Date(r.starts_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</td>
            <td className="p-3">{r.client_name}</td>
            <td className="p-3">{brl(Number(r.price))}</td>
            <td className="p-3 text-gold">{brl(Number(r.valor_sinal_pago))}</td>
            <td className="p-3">{r.status_sinal === 'pago' ? 'Confirmado' : 'Pendente'}</td>
            <td className="p-3">{r.status_sinal === 'pago' ? brl(Number(r.price) - Number(r.valor_sinal_pago)) : '—'}</td>
          </tr>)}</tbody>
        </table>
        {!comSinal.length && <p className="py-6 text-muted-foreground">Nenhum agendamento com sinal neste mês.</p>}
      </div>
    </section>
  </>;
}
