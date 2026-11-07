import { useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { salonContextOptions } from '@/lib/salon-data';
import { brasiliaDate } from '@/lib/automatic-finance';
import { productionSummary, type ProductionRow } from '@/lib/evolving-automation';
import { MONTH_NAMES } from '@/lib/brazil-calendar';
import { brl } from '@/lib/auth';
import { Stat } from './Shell';
export function ProductionEvolution() {
  const { data: ctx } = useSuspenseQuery(salonContextOptions);
  const today = brasiliaDate();
  const q = useQuery({ queryKey: ['production-evolution', ctx.salon?.id, today], enabled: !!ctx.salon, queryFn: async () => { if (!ctx.salon) return []; const r = await supabase.rpc('salon_production_year', { _salon: ctx.salon.id, _year: Number(today.slice(0, 4)) }); if (r.error) throw r.error; return r.data as unknown as ProductionRow[]; } });
  const d = productionSummary(q.data ?? [], today);
  const max = Math.max(1, ...d.months.map(m => m.value));
  return <section className="mb-8 border-b pb-6"><h2 className="mb-4 text-xl">Evolução dos atendimentos concluídos · {today.slice(0, 4)}</h2>{q.error && <p role="alert">Não foi possível carregar a evolução.</p>}<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><Stat label="Produção diária" value={brl(d.daily)} /><Stat label="Produção semanal" value={brl(d.weekly)} /><Stat label="Produção mensal" value={brl(d.monthly)} /><Stat label="Produção anual" value={brl(d.annual)} /></div><p className="my-4 text-sm text-muted-foreground">Margem dos serviços após produtos: {brl(d.productMargin)} · Recebimentos, comissões e despesas separados no financeiro.</p><div className="grid grid-cols-6 items-end gap-2 sm:grid-cols-12" role="img" aria-label="Gráfico anual da produção"><div className="sr-only">{d.months.map((m, i) => `${MONTH_NAMES[i]}: ${brl(m.value)}`).join('; ')}</div>{d.months.map((m, i) => <div key={m.month} className="text-center"><div className="flex h-28 items-end justify-center"><progress className="h-full w-full" max={max} value={m.value} aria-label={`${MONTH_NAMES[i]}: ${brl(m.value)}`} /></div><span className="text-xs text-muted-foreground">{MONTH_NAMES[i]?.slice(0, 3)}</span><p className="break-words text-[10px] text-gold">{brl(m.value)}</p></div>)}</div></section>;
}