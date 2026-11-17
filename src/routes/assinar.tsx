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
import { useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { createSubscriptionPix, subscriptionPixStatus } from "@/lib/asaas.functions";

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
  const [f, setF] = useState({ name: "", email: "", phone: "", cpfCnpj: "" });
  const [aceitou, setAceitou] = useState(false);
  const [busy, setBusy] = useState(false);
  const [pixGerado, setPixGerado] = useState<{ requestId: string; amount: number; qrImage: string; copiaECola: string } | null>(null);
  const [pago, setPago] = useState(false);
  const gerar = useServerFn(createSubscriptionPix);
  const consultar = useServerFn(subscriptionPixStatus);
  const { data } = useQuery({
    queryKey: ["assinar"],
    queryFn: async () => {
      const p = await supabase.rpc("public_plans");
      return { plans: p.data ?? [] };
    },
  });
  const plan = data?.plans.find((p) => p.id === plano) ?? data?.plans[0];
  const valor = plan ? planCharge(plan, ciclo) : 0;

  useEffect(() => {
    if (!pixGerado || pago) return;
    const t = setInterval(async () => {
      try { const r = await consultar({ data: { requestId: pixGerado.requestId } }); if (r.status === "confirmado") setPago(true); } catch { /* tenta de novo */ }
    }, 6000);
    return () => clearInterval(t);
  }, [pixGerado, pago, consultar]);

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!plan || !aceitou) { toast.error('Concorde com os termos para continuar.'); return; }
    setBusy(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const r = await gerar({ data: { planId: plan.id, ciclo, name: f.name, email: f.email, phone: f.phone, cpfCnpj: f.cpfCnpj, aceitou: true, userId: user?.id ?? null } });
      setPixGerado(r);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível gerar o Pix.");
    } finally { setBusy(false); }
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

        {pago ? (
          <div className="mt-4 rounded-2xl border border-primary bg-card p-6 text-center shadow-gold">
            <h3 className="text-2xl">Pagamento confirmado ✦</h3>
            <p className="mt-2 text-sm text-muted-foreground">Seu acesso foi liberado. Entre ou crie sua conta com o mesmo e-mail.</p>
            <Link to="/auth" search={{ role: "dono_salao" }} className={`${btnGold} mt-4 inline-block`}>Entrar no salão</Link>
          </div>
        ) : pixGerado ? (
          <div className="mt-4 rounded-2xl border border-primary bg-card p-6 text-center shadow-gold">
            <h2 className="text-2xl">Pague {brl(pixGerado.amount)} com Pix</h2>
            <img src={`data:image/png;base64,${pixGerado.qrImage}`} alt="QR Code Pix" className="mx-auto mt-4 h-56 w-56 rounded-lg bg-card" />
            <p className="mt-4 text-sm text-muted-foreground">Ou copie o código Pix copia e cola:</p>
            <code className="mt-2 block break-all rounded-md border p-2 text-xs">{pixGerado.copiaECola}</code>
            <Button type="button" className="mt-3" onClick={() => { navigator.clipboard?.writeText(pixGerado.copiaECola); toast.success("Código copiado"); }}>Copiar código</Button>
            <p className="mt-4 text-sm text-muted-foreground">Aguardando confirmação do pagamento… esta tela atualiza sozinha.</p>
          </div>
        ) : (
          <form onSubmit={enviar} className="mt-4 space-y-3 rounded-2xl border bg-card p-6">
            <p className="text-sm text-muted-foreground">Informe seus dados para gerar o Pix:</p>
            <input required maxLength={120} placeholder="Nome / Salão" className={inputCls} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
            <input required maxLength={200} type="email" placeholder="E-mail" className={inputCls} value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
            <input required maxLength={18} placeholder="CPF ou CNPJ" className={inputCls} value={f.cpfCnpj} onChange={(e) => setF({ ...f, cpfCnpj: e.target.value })} />
            <input maxLength={30} placeholder="WhatsApp" className={inputCls} value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} />
            <TermosELGPD checked={aceitou} onChange={setAceitou} />
            <Button type="submit" disabled={!aceitou || busy} className="w-full">{busy ? "Gerando Pix…" : "Gerar Pix"}</Button>
          </form>
        )}
      </div>
    </div>
  );
}
