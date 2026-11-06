import { createFileRoute, Link } from "@tanstack/react-router";
import * as Icons from "lucide-react";
import { PageTitle } from "@/components/Shell";
import { ownerBlocks } from "@/lib/owner-menu";

export const Route = createFileRoute("/_authenticated/app/")({
  head: () => ({ meta: [
    { title: "Meu Salão — IAxis SalonPRO" },
    { name: "description", content: "Menu principal da dona do salão em blocos." },
    { property: "og:title", content: "Meu Salão — IAxis SalonPRO" },
    { property: "og:description", content: "Funcionárias, agenda, estoque, pedidos, financeiro, serviços e configurações." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ]}),
  component: AppHome,
});

export function blockIcon(name: string) {
  return (Icons as unknown as Record<string, Icons.LucideIcon>)[name] ?? Icons.Sparkles;
}

function AppHome() {
  return (
    <div className="p-4 sm:p-8">
      <PageTitle title="Meu Salão" sub="Escolha um menu" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {ownerBlocks.map((b) => {
          const Icon = blockIcon(b.icon);
          return (
            <Link key={b.slug} to="/app/$bloco" params={{ bloco: b.slug }}
              className="flex min-h-40 flex-col justify-between rounded-2xl border bg-card p-5 transition hover:-translate-y-1 hover:border-primary hover:shadow-gold">
              <Icon className="h-10 w-10 text-gold" />
              <div>
                <h2 className="text-xl font-semibold uppercase tracking-wide">{b.title}</h2>
                <p className="text-sm text-muted-foreground">{b.desc}</p>
              </div>
            </Link>
          );
        })}
      </div>
      <Link to="/salao" className="mt-6 inline-block text-sm text-gold hover:underline">Ver painel com números do dia</Link>
    </div>
  );
}
