import { createFileRoute } from "@tanstack/react-router";
import { PageTitle, Shell, Stat, StatusBadge } from "@/components/Shell";
import { saloes } from "@/lib/modules";

export const Route = createFileRoute("/revendedor")({
  head: () => ({ meta: [
    { title: "Painel do Revendedor — IAxis SalonPRO" },
    { name: "description", content: "Link de afiliado, salões vendidos e repasse mensal." },
    { property: "og:title", content: "Painel do Revendedor — IAxis SalonPRO" },
    { property: "og:description", content: "Revenda e lucre todo mês." },
  ]}),
  component: Rev,
});

const preco: Record<string, number> = { Básico: 97, Pro: 197, Premium: 297 };

function Rev() {
  const meus = saloes.filter((s) => s.revendedor === "João Salvador");
  const total = meus.reduce((a, s) => a + (preco[s.plano] ?? 0) * 0.3, 0);
  return (
    <Shell role="Sócio Revendedor" nav={[{ to: "/revendedor", label: "Meu Painel" }, { to: "/", label: "Sair" }]}>
      <PageTitle title="Olá, João" sub="Acompanhe seus salões e repasses" />
      <div className="rounded-xl border bg-card p-5">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">Seu link de afiliado</p>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <code className="rounded bg-muted px-3 py-2 text-gold">iaxissalonpro.com/r/joaosalvador</code>
          <button onClick={() => navigator.clipboard?.writeText("https://iaxissalonpro.com/r/joaosalvador")} className="rounded-md bg-gradient-gold px-4 py-2 text-sm font-semibold text-primary-foreground">Copiar</button>
        </div>
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <Stat label="Salões vendidos" value={String(meus.length)} />
        <Stat label="Repasse do mês" value={`R$ ${total.toFixed(2).replace(".", ",")}`} hint="30% recorrente via PIX" />
        <Stat label="Próximo PIX" value="05/11" />
      </div>
      <h2 className="mt-10 mb-4 text-2xl">Meus salões</h2>
      <div className="grid gap-3 md:grid-cols-2">
        {meus.map((s) => (
          <div key={s.nome} className="flex items-center justify-between rounded-xl border bg-card p-5">
            <div><p className="font-semibold">{s.nome}</p><p className="text-sm text-muted-foreground">{s.cidade} · {s.plano}</p></div>
            <div className="text-right"><StatusBadge s={s.status} /><p className="mt-1 text-sm text-gold">R$ {((preco[s.plano] ?? 0) * 0.3).toFixed(2).replace(".", ",")}/mês</p></div>
          </div>
        ))}
      </div>
    </Shell>
  );
}
