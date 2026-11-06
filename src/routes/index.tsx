import { createFileRoute, Link } from "@tanstack/react-router";
import { Crown, Handshake, Store, UserRound } from "lucide-react";
import { Brand } from "@/components/Shell";
import { PlansSection } from "@/components/PlansSection";
import { homeFor, useMe } from '@/lib/auth';
import { Button } from '@/components/ui/button';

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "IAxis SalonPRO — Gestão para Salões de Beleza" },
      { name: "description", content: "Agenda 24h, financeiro, estoque fracionado, comissões, CRM, notas fiscais e IA para salões de beleza." },
      { property: "og:title", content: "IAxis SalonPRO — Gestão para Salões de Beleza" },
      { property: "og:description", content: "Sistema completo de gestão para negócios de beleza." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const portais = [
  { to: "/admin", icon: Crown, t: "Super Admin", d: "Painel master: salões, planos, revendedores, MRR e churn." },
  { to: "/revendedor", icon: Handshake, t: "Revendedor", d: "Link de afiliado, salões vendidos e repasse recorrente." },
  { to: "/salao", icon: Store, t: "Dono do Salão", d: "Agenda, financeiro, estoque, comissões, CRM e IA." },
  { to: "/cliente", icon: UserRound, t: "Cliente", d: "Agende serviço e profissional, veja cashback e pacotes." },
] as const;

function Index() {
  const me = useMe();
  const master = me.data?.roles.includes('super_admin') ?? false;
  const visiblePortals = portais.filter(p => p.to !== '/admin' || master);
  return (
    <div className="min-h-screen bg-gradient-navy">
      <header className="mx-auto flex max-w-6xl items-center justify-between p-6">
        <Brand />
        <Button asChild><Link to={me.data ? homeFor(me.data.roles) : '/auth'}>{me.data ? 'Meu painel' : 'Entrar'}</Link></Button>
      </header>
      <section className="mx-auto max-w-6xl px-6 py-16 text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-gold">Gestão de beleza com inteligência</p>
        <h1 className="mx-auto mt-4 max-w-3xl text-5xl font-semibold leading-tight md:text-7xl">
          Seu salão inteiro em <span className="text-gradient-gold">um só lugar</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-muted-foreground">
          Agenda gera comanda › comanda baixa estoque › estoque gera financeiro › financeiro gera comissão › comissão gera relatório › relatório gera campanha.
        </p>
      </section>
      <section className="mx-auto grid max-w-6xl gap-4 px-6 sm:grid-cols-2 lg:grid-cols-4">
        {visiblePortals.map((p) => (
          <Link key={p.to} to={p.to} className="group rounded-2xl border bg-card p-6 transition hover:-translate-y-1 hover:shadow-gold">
            <p.icon className="h-8 w-8 text-gold" />
            <h3 className="mt-4 text-2xl font-semibold">{p.t}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{p.d}</p>
          </Link>
        ))}
      </section>
      <PlansSection />
    </div>
  );
}
