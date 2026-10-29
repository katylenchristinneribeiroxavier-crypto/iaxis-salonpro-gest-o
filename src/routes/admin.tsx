import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageTitle, Shell, Stat, StatusBadge } from "@/components/Shell";
import { planos, saloes as inicial } from "@/lib/modules";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [
    { title: "Painel Master — IAxis SalonPRO" },
    { name: "description", content: "Super Admin: salões, planos, revendedores, MRR e churn." },
    { property: "og:title", content: "Painel Master — IAxis SalonPRO" },
    { property: "og:description", content: "Controle total da plataforma." },
  ]}),
  component: Admin,
});

function Admin() {
  const [saloes, setSaloes] = useState(inicial);
  const [repasse, setRepasse] = useState(30);
  const toggle = (nome: string) =>
    setSaloes((s) => s.map((x) => x.nome === nome ? { ...x, status: x.status === "Bloqueado" ? "Ativo" : "Bloqueado" } : x));
  return (
    <Shell role="Super Admin" nav={[{ to: "/admin", label: "Painel Master" }, { to: "/", label: "Sair" }]}>
      <PageTitle title="Painel Master" sub="Visão geral de toda a plataforma" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="MRR" value="R$ 48.750" hint="+12% no mês" />
        <Stat label="Salões ativos" value="247" />
        <Stat label="Churn" value="2,1%" />
        <Stat label="Revendedores" value="18" hint={`Repasse padrão ${repasse}%`} />
      </div>
      <h2 className="mt-10 mb-4 text-2xl">Salões cadastrados</h2>
      <div className="overflow-x-auto rounded-xl border bg-card">
        <table className="w-full text-sm">
          <thead className="text-left text-muted-foreground"><tr>{["Salão","Cidade","Plano","Revendedor","Status",""].map(h=><th key={h} className="p-3">{h}</th>)}</tr></thead>
          <tbody>{saloes.map((s) => (
            <tr key={s.nome} className="border-t">
              <td className="p-3">{s.nome}</td><td className="p-3">{s.cidade}</td><td className="p-3">{s.plano}</td>
              <td className="p-3">{s.revendedor}</td><td className="p-3"><StatusBadge s={s.status} /></td>
              <td className="p-3"><button onClick={() => toggle(s.nome)} className="text-gold hover:underline">{s.status === "Bloqueado" ? "Liberar" : "Bloquear"}</button></td>
            </tr>))}</tbody>
        </table>
      </div>
      <div className="mt-10 grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border bg-card p-6">
          <h3 className="text-2xl">Planos</h3>
          {planos.map((p) => <div key={p.nome} className="mt-3 flex justify-between border-t pt-3"><span>{p.nome}</span><span className="text-gold">R$ {p.preco}/mês</span></div>)}
        </div>
        <div className="rounded-xl border bg-card p-6">
          <h3 className="text-2xl">Comissão do revendedor</h3>
          <p className="mt-2 text-sm text-muted-foreground">Percentual recorrente repassado todo mês via PIX.</p>
          <input type="range" min={5} max={50} value={repasse} onChange={(e) => setRepasse(+e.target.value)} className="mt-6 w-full accent-gold" />
          <p className="mt-2 font-display text-4xl text-gold">{repasse}%</p>
          <p className="text-xs text-muted-foreground">Plano Pro R$ 197 → R$ {(197 * repasse / 100).toFixed(2).replace(".", ",")} ao parceiro</p>
        </div>
      </div>
    </Shell>
  );
}
