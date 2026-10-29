import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { brl } from "@/lib/auth";
import { planCharge, type Ciclo } from "@/lib/plans";

const recursos: Record<string, string[]> = {
  "Básico": ["Agenda online 24h", "Financeiro", "Clientes / CRM"],
  Pro: ["Tudo do Básico", "Estoque fracionado", "Comissões", "Pacotes", "Notas fiscais"],
  Premium: ["Tudo do Pro", "WhatsApp API", "IA avançada", "Campanhas", "Gerente de contas"],
};

export function PlansSection() {
  const [ciclo, setCiclo] = useState<Ciclo>("mensal");
  const { data: plans } = useQuery({
    queryKey: ["plans"],
    queryFn: async () => (await supabase.from("plans").select("*").order("sort")).data ?? [],
  });
  return (
    <section className="mx-auto max-w-6xl px-6 py-20">
      <h2 className="text-center text-4xl font-semibold">Planos</h2>
      <div className="mx-auto mt-6 flex w-fit rounded-full border bg-card p-1 text-sm">
        {(["mensal", "anual"] as const).map((c) => (
          <button key={c} onClick={() => setCiclo(c)} className={`rounded-full px-5 py-2 capitalize ${ciclo === c ? "bg-gradient-gold text-primary-foreground" : ""}`}>{c}</button>
        ))}
      </div>
      <p className="mt-3 text-center text-xs text-muted-foreground">
        {ciclo === "mensal" ? "Sem fidelidade, renovação opcional." : "Pagamento único por 12 meses, com desconto."}
      </p>
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {plans?.map((p, i) => (
          <div key={p.id} className={`flex flex-col rounded-2xl border bg-card p-8 ${i === 1 ? "border-primary shadow-gold" : ""}`}>
            <h3 className="text-2xl">{p.name}</h3>
            <p className="mt-2 font-display text-4xl text-gold">
              {brl(Number(ciclo === "mensal" ? p.price : p.annual_monthly_price))}
              <span className="text-base text-muted-foreground">/mês</span>
            </p>
            {ciclo === "anual" && <p className="text-sm text-muted-foreground">{brl(planCharge(p, "anual"))} por ano</p>}
            <ul className="mt-4 flex-1 space-y-1 text-sm text-muted-foreground">{(recursos[p.name] ?? []).map((r) => <li key={r}>✦ {r}</li>)}</ul>
            <Link to="/assinar" search={{ plano: p.id, ciclo }} className="mt-6 rounded-md bg-gradient-gold py-3 text-center text-sm font-semibold text-primary-foreground">Assinar via PIX</Link>
          </div>
        ))}
      </div>
      <p className="mt-4 text-center text-xs text-muted-foreground">+ 2% sobre cada agendamento pago online</p>
    </section>
  );
}
