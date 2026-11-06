import { useQuery, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { salonContextOptions } from '@/lib/salon-data';
import { brl } from '@/lib/auth';
import { SALON_EXPENSE_CATEGORIES, intervaloMes, lucroMes, totaisPorCategoria } from '@/lib/salon-expenses';
import { PageTitle, Stat, inputCls } from './Shell';
import { Button } from './ui/button';

export function SalonExpenses() {
  const qc = useQueryClient();
  const { data: ctx } = useSuspenseQuery(salonContextOptions);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [form, setForm] = useState({ categoria: 'Aluguel', descricao: '', valor: '', data: new Date().toISOString().slice(0, 10) });
  const salonId = ctx.salon?.id;
  const key = ['despesas-salao', salonId, month];
  const { data } = useQuery({
    queryKey: key, enabled: !!salonId,
    queryFn: async () => {
      const { inicio, fim } = intervaloMes(month);
      const [d, a] = await Promise.all([
        supabase.from('despesas_salao').select('*').eq('salon_id', salonId!).gte('data_despesa', inicio).lt('data_despesa', fim).order('data_despesa', { ascending: false }),
        supabase.from('appointments').select('price').eq('salon_id', salonId!).eq('status', 'finalizado').gte('starts_at', new Date(`${inicio}T00:00:00`).toISOString()).lt('starts_at', new Date(`${fim}T00:00:00`).toISOString()),
      ]);
      if (d.error) throw d.error;
      return { rows: d.data ?? [], faturamento: (a.data ?? []).reduce((s, r) => s + Number(r.price), 0) };
    },
  });
  if (!salonId) return <p className="text-muted-foreground">Nenhum salão encontrado.</p>;
  const rows = data?.rows ?? [];
  const totalDesp = rows.reduce((s, r) => s + Number(r.valor), 0);
  const fat = data?.faturamento ?? 0;
  const lucro = lucroMes(fat, totalDesp);
  const chart = totaisPorCategoria(rows.map(r => ({ categoria: r.categoria, valor: Number(r.valor) })));

  async function salvar() {
    const valor = Number(form.valor.replace(',', '.'));
    if (!(valor > 0)) return void toast.error('Informe um valor maior que zero.');
    const r = await supabase.from('despesas_salao').insert({ salon_id: salonId!, categoria: form.categoria, descricao: form.descricao.trim(), valor, data_despesa: form.data });
    if (r.error) return void toast.error('Não foi possível salvar a despesa.');
    toast.success('Despesa cadastrada'); setForm(f => ({ ...f, descricao: '', valor: '' }));
    qc.invalidateQueries({ queryKey: ['despesas-salao'] });
  }
  async function remover(id: string) {
    if (!confirm('Excluir esta despesa?')) return;
    const r = await supabase.from('despesas_salao').delete().eq('id', id);
    if (r.error) toast.error('Não foi possível excluir.'); else qc.invalidateQueries({ queryKey: ['despesas-salao'] });
  }

  return <>
    <PageTitle title="Despesas do salão" />
    <input aria-label="Mês" type="month" className={`${inputCls} mb-6 max-w-48`} value={month} onChange={e => setMonth(e.target.value)} />
    <div className="grid gap-4 sm:grid-cols-3">
      <Stat label="Faturamento do mês" value={brl(fat)} />
      <Stat label="Despesas do mês" value={brl(totalDesp)} />
      <Stat label="Lucro (faturamento − despesas)" value={brl(lucro)} />
    </div>
    <section className="mt-8 rounded-lg border bg-card p-4">
      <h2 className="text-xl">Nova despesa</h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-5">
        <select aria-label="Categoria" className={inputCls} value={form.categoria} onChange={e => setForm({ ...form, categoria: e.target.value })}>{SALON_EXPENSE_CATEGORIES.map(c => <option key={c}>{c}</option>)}</select>
        <input aria-label="Descrição" placeholder="Descrição" className={`${inputCls} sm:col-span-2`} value={form.descricao} onChange={e => setForm({ ...form, descricao: e.target.value })} />
        <input aria-label="Valor" inputMode="decimal" placeholder="Valor (R$)" className={inputCls} value={form.valor} onChange={e => setForm({ ...form, valor: e.target.value })} />
        <input aria-label="Data" type="date" className={inputCls} value={form.data} onChange={e => setForm({ ...form, data: e.target.value })} />
      </div>
      <Button className="mt-3" onClick={salvar}><Plus />Cadastrar despesa</Button>
    </section>
    <section className="mt-8">
      <h2 className="text-xl">Despesas por categoria no mês</h2>
      {chart.length ? <div className="mt-3 h-64"><ResponsiveContainer><BarChart data={chart}><CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" /><XAxis dataKey="categoria" stroke="currentColor" fontSize={12} /><YAxis stroke="currentColor" fontSize={12} /><Tooltip formatter={(v: number) => brl(v)} /><Bar dataKey="total" fill="var(--gold, currentColor)" className="fill-gold" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div> : <p className="mt-3 text-muted-foreground">Nenhuma despesa neste mês.</p>}
    </section>
    {rows.length > 0 && <div className="mt-6 overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b text-left text-muted-foreground"><th className="p-3">Data</th><th className="p-3">Categoria</th><th className="p-3">Descrição</th><th className="p-3 text-right">Valor</th><th /></tr></thead><tbody>{rows.map(r => <tr key={r.id} className="border-b"><td className="p-3">{r.data_despesa.split('-').reverse().join('/')}</td><td className="p-3">{r.categoria}</td><td className="p-3">{r.descricao || '—'}</td><td className="p-3 text-right">{brl(Number(r.valor))}</td><td className="p-3"><button aria-label="Excluir" onClick={() => remover(r.id)}><Trash2 className="h-4 w-4 text-destructive" /></button></td></tr>)}</tbody></table></div>}
  </>;
}

export function MasterSalonExpenses() {
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const { data } = useQuery({
    queryKey: ['master-despesas-salao', month],
    queryFn: async () => {
      const { inicio, fim } = intervaloMes(month);
      const [d, s] = await Promise.all([
        supabase.from('despesas_salao').select('salon_id, valor').gte('data_despesa', inicio).lt('data_despesa', fim),
        supabase.from('salons').select('id, name'),
      ]);
      if (d.error) throw d.error;
      return { rows: d.data ?? [], salons: s.data ?? [] };
    },
  });
  const rows = data?.rows ?? [];
  const total = rows.reduce((s, r) => s + Number(r.valor), 0);
  const porSalao = (data?.salons ?? []).map(s => ({ name: s.name || 'Salão sem nome', total: rows.filter(r => r.salon_id === s.id).reduce((a, r) => a + Number(r.valor), 0) })).filter(s => s.total > 0).sort((a, b) => b.total - a.total);
  return <section className="mt-10 rounded-lg border bg-card p-4">
    <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-2xl">Despesas de todos os salões</h2><input aria-label="Mês das despesas" type="month" className={`${inputCls} max-w-48`} value={month} onChange={e => setMonth(e.target.value)} /></div>
    <p className="mt-3 text-lg">Total no mês: <b className="text-gold">{brl(total)}</b></p>
    {porSalao.map(s => <p key={s.name} className="mt-2 flex justify-between border-b pb-2"><span>{s.name}</span><span>{brl(s.total)}</span></p>)}
    {!porSalao.length && <p className="mt-2 text-muted-foreground">Nenhuma despesa cadastrada neste mês.</p>}
  </section>;
}
