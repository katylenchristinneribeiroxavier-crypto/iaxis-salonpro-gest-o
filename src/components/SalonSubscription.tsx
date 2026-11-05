import { useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { CreditCard } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { salonContextOptions } from '@/lib/salon-data';
import { brl } from '@/lib/auth';
import { PageTitle, StatusBadge } from './Shell';
import { Button } from './ui/button';

export function SalonSubscription() {
  const { data: ctx } = useSuspenseQuery(salonContextOptions);
  const salon = ctx.salon;
  const canReadPayments = !!salon && (ctx.userId === salon.owner_id || ctx.admin);
  const { data, isPending, error } = useQuery({
    queryKey: ['salon-subscription', salon?.id, ctx.userId],
    enabled: !!salon,
    queryFn: async () => {
      if (!salon) return null;
      const plans = await supabase.from('plans').select('*').order('sort');
      if (plans.error) throw plans.error;
      if (!canReadPayments) return { plans: plans.data, requests: [] };
      const requests = await supabase.from('subscription_requests')
        .select('id, plan_id, amount, billing, status, created_at')
        .eq('user_id', salon.owner_id).order('created_at', { ascending: false });
      if (requests.error) throw requests.error;
      return { plans: plans.data, requests: requests.data };
    },
  });
  const plan = data?.plans.find(p => p.id === salon?.plan_id);
  return <>
    <PageTitle title="Assinatura do salão" />
    {isPending ? <p role="status">Carregando assinatura…</p> : error ? <p role="alert" className="text-destructive">Não foi possível carregar a assinatura. Tente novamente.</p> : <>
      <div className="flex flex-wrap items-center justify-between gap-6 border-b pb-6">
        <dl className="grid w-full gap-5 sm:w-auto sm:grid-cols-3">
          <div><dt className="text-sm text-muted-foreground">Plano atual</dt><dd className="mt-2 text-xl">{plan?.name || 'Sem plano'}</dd></div>
          <div><dt className="text-sm text-muted-foreground">Status da assinatura</dt><dd className="mt-2"><StatusBadge s={salon?.status || 'pendente'} /></dd></div>
          <div><dt className="text-sm text-muted-foreground">Próximo vencimento</dt><dd className="mt-2">{salon?.subscription_due_date ? new Date(`${salon.subscription_due_date}T12:00:00`).toLocaleDateString('pt-BR') : 'Não informado'}</dd></div>
        </dl>
        {canReadPayments && <Button asChild variant="outline"><Link to="/assinar" search={{ plano: salon?.plan_id || undefined, ciclo: 'mensal' }}><CreditCard className="h-4 w-4" />Assinar / renovar via PIX</Link></Button>}
      </div>
      {canReadPayments ? <>
        <h2 className="mt-6 text-xl">Pedidos e pagamentos da conta da dona</h2>
        <div className="mt-4 overflow-x-auto"><table className="w-full text-sm">
          <thead><tr className="border-b text-left text-muted-foreground">{['Data', 'Plano', 'Ciclo', 'Valor solicitado', 'Status'].map(h => <th className="whitespace-nowrap p-3" key={h}>{h}</th>)}</tr></thead>
          <tbody>{data?.requests.map(r => <tr key={r.id} className="border-b">
            <td className="whitespace-nowrap p-3">{new Date(r.created_at).toLocaleDateString('pt-BR')}</td>
            <td className="p-3">{data.plans.find(p => p.id === r.plan_id)?.name || 'Não informado'}</td>
            <td className="p-3 capitalize">{r.billing}</td><td className="whitespace-nowrap p-3 text-gold">{brl(r.amount)}</td>
            <td className="p-3"><StatusBadge s={r.status} /></td>
          </tr>)}</tbody>
        </table></div>
        {!data?.requests.length && <p className="py-6 text-muted-foreground">Nenhum pedido de assinatura registrado nesta conta.</p>}
      </> : <p className="mt-6 text-muted-foreground">O histórico de pagamentos está disponível para a dona do salão.</p>}
    </>}
  </>;
}