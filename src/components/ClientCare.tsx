import { useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { salonContextOptions } from '@/lib/salon-data';
import { PageTitle } from './Shell';
type Insight = { id: string; name: string; service: string | null; visits: number; interval_days: number; days_away: number | null; needs_care: boolean | null };
export function ClientCare() {
  const { data: ctx } = useSuspenseQuery(salonContextOptions);
  const q = useQuery({ queryKey: ['client-care', ctx.salon?.id], enabled: !!ctx.salon, queryFn: async () => { if (!ctx.salon) return []; const r = await supabase.rpc('salon_crm_insights', { _salon: ctx.salon.id }); if (r.error) throw r.error; return r.data as unknown as Insight[]; } });
  return <><PageTitle title="Clientes · cuidado inteligente" />{q.error && <p role="alert">Não foi possível consultar as clientes.</p>}<div className="grid gap-4 sm:grid-cols-2">{q.data?.map(c => <article className="rounded-md border bg-card p-5" key={c.id}><h2 className="text-xl">{c.name}</h2><p className="mt-2 text-sm text-gold">{c.needs_care ? 'Precisa de carinho 💛' : c.visits ? 'Cuidado em dia' : 'Primeiro encontro'}</p><p className="mt-3 text-sm">{c.service || 'Serviço ainda não identificado'} · {c.visits} atendimento(s)</p><p className="mt-2 text-sm text-muted-foreground">{c.visits > 1 ? `Retorno observado: cerca de ${c.interval_days} dias` : 'Aguardando mais visitas para identificar o intervalo'}</p>{c.days_away !== null && <p className="mt-2 text-sm">Já faz {c.days_away} dias desde o último cuidado.</p>}</article>)}</div>{q.data?.length === 0 && <p>Nenhuma cliente cadastrada.</p>}</>;
}