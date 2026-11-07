import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { brasiliaDate } from '@/lib/automatic-finance';
import { brl } from '@/lib/auth';
import { inputCls, Stat } from './Shell';
type Result = { commission: number; advances: number; receivable: number; rows: { starts_at: string; received_at: string; service: string; client_name: string; commission: number; percentage: number }[] };
export function StaffMonthlyFinance({ token }: { token: string }) {
  const [month, setMonth] = useState(brasiliaDate().slice(0, 7));
  const q = useQuery({ queryKey: ['staff-monthly-finance', token, month], retry: false, queryFn: async () => { const r = await supabase.rpc('staff_financial_month', { _token: token, _month: month }); if (r.error) throw r.error; return r.data as unknown as Result; } });
  return <section className="mt-8"><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-2xl">Meu fechamento mensal</h2><input aria-label="Mês das minhas comissões" type="month" value={month} className={`${inputCls} max-w-48`} onChange={e => { if (e.target.value) setMonth(e.target.value); }} /></div>{q.error && <p role="alert" className="mt-3 text-destructive">{q.error.message}</p>}{q.data && <><div className="mt-4 grid gap-3 sm:grid-cols-3"><Stat label="Comissão dos serviços pagos" value={brl(q.data.commission)} /><Stat label="Adiantamentos" value={brl(q.data.advances)} /><Stat label="Total a receber" value={brl(q.data.receivable)} /></div><div className="mt-4">{q.data.rows.map((r, i) => <div key={i} className="flex flex-wrap justify-between gap-3 border-b py-3 text-sm"><span>{brasiliaDate(new Date(r.received_at)).split('-').reverse().join('/')} · {r.service} · {r.client_name}</span><span className="text-gold">{r.percentage}% · {brl(r.commission)}</span></div>)}</div></>}</section>;
}