import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Brand, btnGold, inputCls } from "@/components/Shell";
import { brl } from "@/lib/auth";
import { planCharge, type Ciclo } from "@/lib/plans";
import { TermosELGPD } from '@/components/TermosELGPD';
import { Button } from '@/components/ui/button';

export const Route = createFileRoute("/assinar")({
  validateSearch: (s: Record<string, unknown>): { plano?: string | undefined; ciclo?: Ciclo | undefined } => ({
    plano: typeof s["plano"] === "string" ? s["plano"] : undefined,
    ciclo: s["ciclo"] === "anual" ? "anual" : "mensal",
  }),
  head: () => ({ meta: [
    { title: "Assinar via PIX — IAxis SalonPRO" },
    { name: "description", content: "Pague sua assinatura do IAxis SalonPRO via PIX." },
    { property: "og:title", content: "Assinar via PIX — IAxis SalonPRO" },
    { property: "og:description", content: "Assinatura mensal ou anual via PIX." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ]}),
  component: Assinar,
});

function Assinar() {
  const { plano, ciclo = "mensal" } = Route.useSearch();
  const [f, setF] = useState({ name: "", email: "", phone: "" });
  const [sent, setSent] = useState(false);
  const [aceitou, setAceitou] = useState(false);
  const { data } = useQuery({
    queryKey: ["assinar"],
    queryFn: async () => {
      const [p, s] = await Promise.all([
        supabase.from("plans").select("*").order("sort"),
        supabase.rpc("public_pix_payment"),
      ]);
      return { plans: p.data ?? [], pix: s.data?.[0] ?? null };
    },
  });
  const plan = data?.plans.find((p) => p.id === plano) ?? data?.plans[0];
  const valor = plan ? planCharge(plan, ciclo) : 0;
  const pix = data?.pix;

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!plan || !aceitou) { toast.error('Concorde com os termos para continuar.'); return; }
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("subscription_requests").insert({
      user_id: user?.id ?? null, name: f.name, email: f.email, phone: f.phone,
      plan_id: plan.id, billing: ciclo, amount: valor, aceitou_termos: aceitou,
    });
    if (error) { toast.error(error.message); return; }
    setSent(true);
  };

  return (
    <div className="min-h-screen bg-gradient-navy p-6">
      <div className="mx-auto max-w-xl">
        <Brand />
        <h1 className="mt-8 text-4xl font-semibold">Pagamento via PIX</h1>
        {plan && (
          <div className="mt-6 rounded-2xl border bg-card p-6">
            <div className="flex flex-wrap gap-2">
              {data?.plans.map((p) => (
                <Link key={p.id} to="/assinar" search={{ plano: p.id, ciclo }} className={`rounded-md border px-3 py-1 text-sm ${p.id === plan.id ? "border-primary text-gold" : ""}`}>{p.name}</Link>
              ))}
              <span className="mx-1" />
              {(["mensal", "anual"] as const).map((c) => (
                <Link key={c} to="/assinar" search={{ plano: plan.id, ciclo: c }} className={`rounded-md border px-3 py-1 text-sm capitalize ${c === ciclo ? "border-primary text-gold" : ""}`}>{c}</Link>
              ))}
            </div>
            <p className="mt-4 text-sm text-muted-foreground">Plano {plan.name} · {ciclo === "mensal" ? "mensal, sem fidelidade" : `anual (${brl(Number(plan.annual_monthly_price))}/mês)`}</p>
            <p className="font-display text-5xl text-gold">{brl(valor)}</p>
            <p className="mt-3 text-sm text-muted-foreground">Toda compra inclui 7 dias para teste, a partir da confirmação do pagamento.</p>
          </div>
        )}

        <div className="mt-4 rounded-2xl border border-primary bg-card p-6 shadow-gold">
          <h2 className="text-2xl">Dados para o PIX</h2>
          {pix?.pix_key ? (
            <dl className="mt-3 space-y-2 text-sm">
              <div><dt className="text-muted-foreground">Chave PIX</dt><dd className="flex items-center gap-2"><code className="text-gold">{pix.pix_key}</code>
                <button className="text-xs text-gold underline" onClick={() => { navigator.clipboard?.writeText(pix.pix_key); toast.success("Chave copiada"); }}>copiar</button></dd></div>
              {pix.pix_holder && <div><dt className="text-muted-foreground">Favorecido</dt><dd>{pix.pix_holder}</dd></div>}
              {pix.pix_cnpj && <div><dt className="text-muted-foreground">CNPJ/CPF</dt><dd>{pix.pix_cnpj}</dd></div>}
              {pix.pix_bank && <div><dt className="text-muted-foreground">Banco</dt><dd>{pix.pix_bank}</dd></div>}
            </dl>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">Os dados do PIX ainda não foram cadastrados pela empresa.</p>
          )}
        </div>

        {sent ? (
          <div className="mt-4 rounded-2xl border bg-card p-6 text-center">
            <h3 className="text-2xl">Pedido registrado ✦</h3>
            <p className="mt-2 text-sm text-muted-foreground">Após o PIX ser confirmado, seu acesso é liberado. Crie sua conta de salão se ainda não tiver.</p>
            <Link to="/auth" search={{ role: "dono_salao" }} className={`${btnGold} mt-4 inline-block`}>Criar conta do salão</Link>
          </div>
        ) : (
          <form onSubmit={enviar} className="mt-4 space-y-3 rounded-2xl border bg-card p-6">
            <p className="text-sm text-muted-foreground">Depois de pagar, informe seus dados para liberarmos o acesso:</p>
            <input required placeholder="Nome / Salão" className={inputCls} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
            <input required type="email" placeholder="E-mail" className={inputCls} value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
            <input placeholder="WhatsApp" className={inputCls} value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} />
            <TermosELGPD checked={aceitou} onChange={setAceitou} />
            <Button type="submit" disabled={!aceitou} className="w-full">Já paguei o PIX</Button>
          </form>
        )}
      </div>
    </div>
  );
}
