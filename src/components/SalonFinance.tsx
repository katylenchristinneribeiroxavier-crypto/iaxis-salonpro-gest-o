import { useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { BrazilYearCalendar } from './BrazilYearCalendar';
import { Download, Folder, CalendarDays } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { salonContextOptions } from '@/lib/salon-data';
import { brasiliaDate, monthDays, FINANCE_CATEGORIES, type FinancialMonth } from '@/lib/automatic-finance';
import { PageTitle, Stat, inputCls } from './Shell';
import { Button } from './ui/button';
import { brl } from '@/lib/auth';

export function SalonFinance({ personal = false, closure = false }: { personal?: boolean; closure?: boolean }) {
  const { data: ctx } = useSuspenseQuery(salonContextOptions);
  const [month, setMonth] = useState(brasiliaDate().slice(0, 7));
  const [followCurrent, setFollowCurrent] = useState(true);
  useEffect(() => { const update = () => { if (followCurrent) setMonth(brasiliaDate().slice(0, 7)); }; const id = setInterval(update, 1000); return () => clearInterval(id); }, [followCurrent]);
  const selectMonth = (value: string) => { setMonth(value); setFollowCurrent(value === brasiliaDate().slice(0, 7)); };
  const [professional, setProfessional] = useState('');
  const [folder, setFolder] = useState('');
  const q = useQuery({ queryKey: ['automatic-finance', ctx.salon?.id, month, personal], enabled: !!ctx.salon, queryFn: async () => {
    if (!ctx.salon) return null;
    if (personal && !ctx.member?.professional_id) throw new Error('Profissional não identificada.');
    const r = await supabase.rpc('salon_financial_month', { _salon: ctx.salon.id, _month: month, ...(personal && ctx.member?.professional_id ? { _professional: ctx.member.professional_id } : {}) });
    if (r.error) throw r.error;
    return r.data as unknown as FinancialMonth;
  } });
  const d = q.data;
  const rows = (d?.rows ?? []).filter(r => !professional || r.professional_id === professional);
  const exportRows = () => {
    if (!d) return;
    const safe = (v: unknown) => `"${String(v ?? '').replaceAll('"', '""').replace(/^[=+@-]/, "'")}"`;
    const lines = [['Mês', month], ['Faturamento', d.revenue], ['Parte da equipe', d.commissions], ['Parte da dona antes das despesas', Number(d.revenue) - Number(d.commissions)], ['Despesas', d.expenses], ['Lucro de caixa', d.cash_profit], ['Resultado operacional', d.operating_profit], [], ['Data recebimento', 'Cliente', 'Profissional', 'Total', 'Comissão %', 'Comissão'], ...rows.map(r => [brasiliaDate(new Date(r.received_at)), r.client_name, r.professional, r.price, r.applied_commission_pct, r.commission_amount]), [], ['Categoria', 'Descrição', 'Valor'], ...d.expense_rows.map(e => [e.categoria, e.descricao, e.valor])];
    const url = URL.createObjectURL(new Blob(['\uFEFF' + lines.map(line => line.map(safe).join(';')).join('\n')], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a'); a.href = url; a.download = `resumo-${month}.csv`; a.click(); URL.revokeObjectURL(url);
  };
  return <><PageTitle title={personal ? 'Minhas comissões' : closure ? 'Fechamento mensal' : 'Financeiro automático'} />
    {closure && <BrazilYearCalendar month={month} onMonth={selectMonth} salon={ctx.salon?.name ?? ''} />}
    <div className="mb-6 flex flex-wrap items-center gap-3"><input aria-label="Mês" type="month" className={`${inputCls} max-w-48`} value={month} onChange={e => { if (e.target.value) selectMonth(e.target.value); }} /><span className="text-sm text-muted-foreground">{d?.closed ? 'Resumo do mês encerrado' : 'Mês em andamento'} · Brasília</span><Button variant="outline" onClick={exportRows} disabled={!d}><Download />Exportar resumo</Button></div>
    {q.isPending && <p>Carregando valores…</p>}{q.error && <p role="alert" className="text-destructive">{q.error.message}</p>}
    {d && <><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {!personal && <><Stat label="Faturamento total pago" value={brl(Number(d.revenue))} /><Stat label="Parte da dona antes das despesas" value={brl(Number(d.revenue) - Number(d.commissions))} /></>}<Stat label={personal ? 'Comissões dos serviços pagos' : 'Parte da equipe · comissões'} value={brl(d.commissions)} /><Stat label="Adiantamentos" value={brl(d.advances)} />
      {personal ? <Stat label="Total a receber" value={brl(d.receivable)} /> : <><Stat label="Despesas registradas" value={brl(Number(d.expenses))} /><Stat label="Lucro de caixa" value={brl(Number(d.cash_profit))} /><Stat label="Resultado após consumo de estoque" value={brl(Number(d.operating_profit))} /></>}
    </div>
    {!personal && <section className="mt-8"><h2 className="text-xl">Pastas de despesas</h2><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{FINANCE_CATEGORIES.map(c => <Button key={c} variant={folder === c ? 'secondary' : 'outline'} className="h-auto min-h-16 justify-between whitespace-normal text-left" onClick={() => setFolder(folder === c ? '' : c)}><span className="flex items-center gap-2"><Folder className="shrink-0" />{c}</span><span>{brl(d.expense_rows.filter(e => e.categoria === c).reduce((s, e) => s + Number(e.valor), 0))}</span></Button>)}</div>{folder && <div className="mt-4 space-y-2">{d.expense_rows.filter(e => e.categoria === folder).map(e => <p className="flex justify-between gap-4 border-b py-2" key={e.id}><span>{e.data_despesa.split('-').reverse().join('/')} · {e.descricao}</span><span>{brl(Number(e.valor))}</span></p>)}</div>}</section>}
    {!personal && <section className="mt-8"><h2 className="text-xl">Comissões privadas por profissional</h2><div className="mt-3 grid gap-3 sm:grid-cols-2">{d.professionals.map(p => <Button key={p.id} variant={professional === p.id ? 'secondary' : 'outline'} className="h-auto min-h-20 flex-col items-start whitespace-normal" onClick={() => setProfessional(professional === p.id ? '' : p.id)}><span>{p.name}</span><span className="text-gold">A receber: {brl(Math.max(0, p.commission - p.advance))}</span><span className="text-xs text-muted-foreground">Comissão {brl(p.commission)} · Adiantamento {brl(p.advance)}</span></Button>)}</div></section>}
    <section className="mt-8"><h2 className="flex items-center gap-2 text-xl"><CalendarDays />Calendário financeiro · {month.split('-').reverse().join('/')}</h2><div className="mt-4 grid grid-cols-7 gap-1 sm:gap-2">{['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => <span key={day} className="text-center text-xs text-muted-foreground">{day}</span>)}{Array.from({ length: new Date(`${month}-01T12:00:00-03:00`).getUTCDay() }, (_, i) => <div key={`blank-${i}`} />)}{Array.from({ length: monthDays(month) }, (_, i) => { const date = `${month}-${String(i + 1).padStart(2, '0')}`; const dayRows = rows.filter(r => brasiliaDate(new Date(r.received_at)) === date); return <div key={date} className="min-h-20 rounded-md border p-1 sm:p-2"><p className="text-sm">{i + 1}</p><p className="mt-1 break-words text-[10px] text-gold sm:text-xs">{brl(dayRows.reduce((s, r) => s + Number(personal || professional ? r.commission_amount : r.price), 0))}</p></div>; })}</div></section>
    <div className="mt-8 overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b text-left text-muted-foreground">{['Recebimento', 'Cliente', 'Profissional', 'Serviço pago', 'Comissão %', 'Comissão'].map(h => <th key={h} className="p-3">{h}</th>)}</tr></thead><tbody>{rows.map(r => <tr key={r.id} className="border-b"><td className="p-3">{brasiliaDate(new Date(r.received_at)).split('-').reverse().join('/')}</td><td className="p-3">{r.client_name}</td><td className="p-3">{r.professional}</td><td className="p-3">{brl(r.price)}</td><td className="p-3">{r.applied_commission_pct}%</td><td className="p-3 text-gold">{brl(r.commission_amount)}</td></tr>)}</tbody></table>{!rows.length && <p className="py-6 text-muted-foreground">Nenhum atendimento pago neste mês.</p>}</div></>}
  </>;
}
