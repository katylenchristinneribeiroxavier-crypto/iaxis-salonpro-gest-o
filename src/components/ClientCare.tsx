import { useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { salonContextOptions } from '@/lib/salon-data';
import { PageTitle } from './Shell';
import { ClientImport } from './ClientImport';
import { ReturnAlert, returnInsightOptions } from './ReturnAlert';
export function ClientCare() {
  const { data: ctx } = useSuspenseQuery(salonContextOptions);
  const q = useQuery(returnInsightOptions(ctx.salon?.id));
  return <><PageTitle title="Clientes · cuidado inteligente" />{ctx.salon&&ctx.manager&&<><ClientImport salonId={ctx.salon.id}/><ReturnAlert salonId={ctx.salon.id}/></>}{q.error && <p role="alert">Não foi possível consultar as clientes.</p>}<div className="grid gap-4 sm:grid-cols-2">{q.data?.map(c => <article className="rounded-md border bg-card p-5" key={c.id}><h2 className="break-words text-xl">{c.name}</h2><p className="mt-2 text-sm text-gold">{c.needs_care ? 'Precisa de carinho 💛' : c.visits ? 'Cuidado em dia' : 'Primeiro encontro'}</p><p className="mt-3 text-sm">{c.service || 'Serviço ainda não identificado'} · {c.visits} atendimento(s)</p><p className="mt-2 text-sm text-muted-foreground">{c.visits ? `Retorno por serviço: ${c.interval_days} dias` : 'Sem histórico de atendimento'}</p>{c.next_return&&<p className="mt-2 text-sm text-gold">Próximo retorno previsto para: {c.next_return.split('-').reverse().join('/')}</p>}{c.days_away !== null && <p className="mt-2 text-sm">Já faz {c.days_away} dias desde o último cuidado.</p>}</article>)}</div>{q.data?.length === 0 && <p>Nenhuma cliente cadastrada.</p>}</>;
}