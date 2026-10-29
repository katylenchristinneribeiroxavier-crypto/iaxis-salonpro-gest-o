import { createFileRoute, Link } from "@tanstack/react-router";
import * as Icons from "lucide-react";
import { PageTitle, Stat, StatusBadge } from "@/components/Shell";
import { agendaHoje, salaoFolders } from "@/lib/modules";

export const Route = createFileRoute("/salao/")({
  head: () => ({ meta: [
    { title: "Painel do Salão — IAxis SalonPRO" },
    { name: "description", content: "Agenda do dia, faturamento e todas as pastas de gestão do salão." },
    { property: "og:title", content: "Painel do Salão — IAxis SalonPRO" },
    { property: "og:description", content: "Gestão completa do seu salão." },
  ]}),
  component: Painel,
});

function Painel() {
  return (
    <>
      <PageTitle title="Bom dia, Studio Bella" sub="Quinta-feira, 29 de outubro" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Faturamento hoje" value="R$ 1.840" />
        <Stat label="Agendamentos" value="23" hint="3 online" />
        <Stat label="Comissões a pagar" value="R$ 612" />
        <Stat label="Estoque baixo" value="4 itens" />
      </div>
      <h2 className="mt-10 mb-4 text-2xl">Pastas</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {salaoFolders.map((f) => {
          const Icon = (Icons as unknown as Record<string, Icons.LucideIcon>)[f.icon];
          return (
            <Link key={f.slug} to="/salao/$pasta" params={{ pasta: f.slug }} className="rounded-2xl border bg-card p-5 transition hover:-translate-y-1 hover:shadow-gold">
              <Icon className="h-7 w-7 text-gold" />
              <h3 className="mt-3 text-xl font-semibold">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.topics.length} tópicos · {f.desc}</p>
            </Link>
          );
        })}
      </div>
      <h2 className="mt-10 mb-4 text-2xl">Agenda de hoje</h2>
      <div className="space-y-2">
        {agendaHoje.map((a) => (
          <div key={a.hora} className="flex items-center gap-4 rounded-xl border bg-card p-4">
            <span className="font-display text-2xl text-gold">{a.hora}</span>
            <div className="flex-1"><p className="font-semibold">{a.cliente}</p><p className="text-sm text-muted-foreground">{a.servico} · {a.prof}</p></div>
            <StatusBadge s={a.status} />
          </div>
        ))}
      </div>
    </>
  );
}
