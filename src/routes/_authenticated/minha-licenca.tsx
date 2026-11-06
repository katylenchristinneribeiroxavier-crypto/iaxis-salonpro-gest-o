import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { CalendarClock, CreditCard, ShieldCheck } from 'lucide-react';
import { Brand } from '@/components/Shell';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { verificarLicenca } from '@/lib/license.functions';
import { diasRestantes } from '@/lib/license-rules';
import { planCharge } from '@/lib/plans';
import { pageHead } from '@/lib/salon-data';

export const Route = createFileRoute('/_authenticated/minha-licenca')({
  head: () => pageHead('Minha Licença', 'Veja seu plano, a validade da licença e renove o IAxis SalonPRO dentro do app.'),
  component: MinhaLicenca,
});

const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const data = (v?: string | null) => (v ? new Date(v).toLocaleDateString('pt-BR') : '—');

function MinhaLicenca() {
  const check = useServerFn(verificarLicenca);
  const q = useQuery({
    queryKey: ['minha-licenca'],
    queryFn: async () => {
      const r = await check();
      let salao: string | undefined = r.licenca?.salao_id;
      if (!salao && r.master) {
        const { data: { user } } = await supabase.auth.getUser();
        const own = user ? await supabase.from('salons').select('id').eq('owner_id', user.id).limit(1).maybeSingle() : null;
        salao = own?.data?.id;
      }
      const [lic, salon, hist] = await Promise.all([
        salao ? supabase.from('licencas_nacionais').select('*').eq('salao_id', salao).maybeSingle() : Promise.resolve({ data: null }),
        salao ? supabase.from('salons').select('plan_id, plans(name, price, annual_monthly_price)').eq('id', salao).maybeSingle() : Promise.resolve({ data: null }),
        supabase.from('subscription_requests').select('id, billing, amount, status, confirmed_at, created_at, is_test_purchase').order('created_at', { ascending: false }).limit(12),
      ]);
      return { r, lic: lic.data, salon: salon.data as { plans: { name: string; price: number; annual_monthly_price: number } | null } | null, hist: hist.data ?? [] };
    },
  });
  if (q.isPending) return <p className="p-8 text-muted-foreground">Carregando sua licença…</p>;
  if (q.error) return <p role="alert" className="p-8 text-destructive">Não foi possível carregar sua licença.</p>;
  const { lic, salon, hist, r } = q.data;
  const ciclo = lic?.tipo_plano === 'anual' ? 'anual' : 'mensal';
  const plan = salon?.plans;
  const valor = plan ? planCharge(plan, ciclo) : null;
  const dias = lic ? diasRestantes(lic.data_expira, new Date()) : 0;
  const liberado = r.master ? lic?.status === 'liberado' && dias > 0 : r.permitido;
  return (
    <div className="min-h-screen bg-gradient-navy p-6">
      <Brand />
      <main className="mx-auto max-w-3xl py-10">
        <p className="text-sm text-gold"><Link to="/configuracoes">Configurações</Link> › Minha Licença</p>
        <h1 className="mt-2 text-4xl">Minha Licença</h1>
        {!lic ? <p className="mt-6 text-muted-foreground">{r.master ? 'Conta master: sem licença própria.' : 'Nenhuma licença encontrada. Adquira o app para criar seu salão.'}</p> : (
          <>
            <section className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-gold/30 bg-card p-5"><ShieldCheck className="mb-2 h-6 w-6 text-gold" /><p className="text-sm text-muted-foreground">Plano atual</p><p className="text-2xl capitalize">{plan?.name ? `${plan.name} · ` : ''}{ciclo}</p><p className={`mt-2 text-sm font-semibold ${liberado ? 'text-gold' : 'text-destructive'}`}>Status: {liberado ? 'liberado' : 'bloqueado'}</p></div>
              <div className="rounded-lg border border-gold/30 bg-card p-5"><CalendarClock className="mb-2 h-6 w-6 text-gold" /><p className="text-sm text-muted-foreground">Início {data(lic.data_inicio)} · Expira {data(lic.data_expira)}</p><p className="text-2xl">{dias > 0 ? `Faltam ${dias} ${dias === 1 ? 'dia' : 'dias'}` : 'Expirada'}</p></div>
              <div className="rounded-lg border border-gold/30 bg-card p-5"><CreditCard className="mb-2 h-6 w-6 text-gold" /><p className="text-sm text-muted-foreground">Valor {ciclo === 'anual' ? 'da anuidade' : 'da mensalidade'}</p><p className="text-2xl">{valor != null ? brl(Number(valor)) : '—'}</p></div>
              <div className="rounded-lg border border-gold/30 bg-card p-5"><p className="text-sm text-muted-foreground">Último pagamento</p><p className="text-2xl">{data(lic.ultimo_pagamento)}</p></div>
            </section>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild><Link to="/assinar" search={{ plano: undefined, ciclo: 'mensal' }}>Renovar licença (mensal)</Link></Button>
              <Button asChild variant="outline"><Link to="/assinar" search={{ plano: undefined, ciclo: 'anual' }}>Renovar licença (anual)</Link></Button>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">Após a confirmação do PIX, sua licença é liberada automaticamente por 30 dias (mensal) ou 365 dias (anual).</p>
          </>
        )}
        <h2 className="mt-10 text-xl">Histórico de pagamentos</h2>
        {hist.length === 0 ? <p className="mt-2 text-sm text-muted-foreground">Nenhum pagamento registrado.</p> : (
          <ul className="mt-3 divide-y divide-border rounded-lg border bg-card">
            {hist.map(h => <li key={h.id} className="flex justify-between p-3 text-sm"><span>{data(h.confirmed_at ?? h.created_at)} · {h.is_test_purchase ? 'teste grátis' : h.billing}</span><span>{brl(Number(h.amount))} · {h.status}</span></li>)}
          </ul>
        )}
      </main>
    </div>
  );
}
