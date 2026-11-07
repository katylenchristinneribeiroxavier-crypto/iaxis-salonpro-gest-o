import { useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { salonContextOptions } from '@/lib/salon-data';
import { brasiliaDate } from '@/lib/automatic-finance';
import { productionSummary, type ProductionRow } from '@/lib/evolving-automation';
import { MONTH_NAMES } from '@/lib/brazil-calendar';
import { brl } from '@/lib/auth';
import { Stat } from './Shell';
import { Bar, BarChart, ResponsiveContainer, XAxis, Tooltip } from 'recharts';
export function ProductionEvolution() {
  const { data: ctx } = useSuspenseQuery(salonContextOptions);
  const today = brasiliaDate();
  const q = useQuery({ queryKey: ['production-evolution', ctx.salon?.id, today], enabled: !!ctx.salon, queryFn: async () => { if (!ctx.salon) return []; const r = await supabase.rpc('salon_production_year', { _salon: ctx.salon.id, _year: Number(today.slice(0, 4)) }); if (r.error) throw r.error; return r.data as unknown as ProductionRow[]; } });
  const d = productionSummary(q.data ?? [], today);
  return <section className="mb-8 border-b pb-6"><h2 className="mb-4 text-xl">Evolução dos atendimentos concluídos · {today.slice(0, 4)}</h2>{q.error && <p role="alert">Não foi possível carregar a evolução.</p>}<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><Stat label="Produção diária" value={brl(d.daily)} /><Stat label="Produção semanal" value={brl(d.weekly)} /><Stat label="Produção mensal" value={brl(d.monthly)} /><Stat label="Produção anual" value={brl(d.annual)} /></div><p className="my-4 text-sm text-muted-foreground">Margem dos serviços após produtos: {brl(d.productMargin)} · Recebimentos, comissões e despesas separados no financeiro.</p><div className="h-48 w-full" role="img" aria-label="Gráfico anual da produção"><ResponsiveContainer width="100%" height="100%"><BarChart data={d.months.map((m, i) => ({ name: MONTH_NAMES[i]?.slice(0, 3), value: m.value }))}><XAxis dataKey="name" stroke="var(--muted-foreground)" tick={{ fontSize: 10 }} /><Tooltip formatter={value => brl(Number(value))} /><Bar dataKey="value" name="Produção" fill="var(--gold)" isAnimationActive={false} /></BarChart></ResponsiveContainer></div></section>;
}