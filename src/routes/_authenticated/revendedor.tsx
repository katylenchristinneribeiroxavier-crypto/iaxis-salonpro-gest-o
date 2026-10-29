import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageTitle, Shell, Stat, StatusBadge, btnGold } from "@/components/Shell";
import { RoleGate } from "@/components/RoleGate";
import { brl } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/revendedor")({
  head: () => ({ meta: [
    { title: "Painel do Revendedor — IAxis SalonPRO" },
    { name: "description", content: "Link de afiliado, salões vendidos e repasse mensal." },
    { property: "og:title", content: "Painel do Revendedor — IAxis SalonPRO" },
    { property: "og:description", content: "Revenda e lucre todo mês." },
  ]}),
  component: () => <RoleGate role="revendedor"><Rev /></RoleGate>,
});

function Rev() {
  const { data } = useQuery({
    queryKey: ["revendedor"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const [r, s, p] = await Promise.all([
        supabase.from("resellers").select("*").eq("user_id", user!.id).maybeSingle(),
        supabase.from("salons").select("*").eq("reseller_id", user!.id),
        supabase.from("plans").select("*"),
      ]);
      return { reseller: r.data, salons: s.data ?? [], plans: p.data ?? [] };
    },
  });
  if (!data) return null;
  if (!data.reseller) return <Shell role="Revendedor" nav={[]}><p>Sua conta não é de revendedor.</p></Shell>;
  const pct = Number(data.reseller.commission_pct);
  const priceOf = (id: string | null) => Number(data.plans.find((p) => p.id === id)?.price ?? 0);
  const ativos = data.salons.filter((s) => s.status === "ativo");
  const total = ativos.reduce((a, s) => a + priceOf(s.plan_id) * pct / 100, 0);
  const link = `${typeof window !== "undefined" ? window.location.origin : ""}/r/${data.reseller.code}`;

  return (
    <Shell role="Sócio Revendedor" nav={[{ to: "/revendedor", label: "Meu Painel" }]}>
      <PageTitle title="Meu painel de revenda" sub={`Você ganha ${pct}% recorrente de cada salão ativo`} />
      <div className="rounded-xl border bg-card p-5">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">Seu link de afiliado</p>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <code className="rounded bg-muted px-3 py-2 text-gold">{link}</code>
          <button onClick={() => { navigator.clipboard?.writeText(link); toast.success("Link copiado"); }} className={btnGold}>Copiar</button>
        </div>
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <Stat label="Salões vendidos" value={String(data.salons.length)} hint={`${ativos.length} ativos`} />
        <Stat label="Repasse mensal" value={brl(total)} hint="Pago via PIX" />
        <Stat label="Comissão" value={`${pct}%`} />
      </div>
      <h2 className="mt-10 mb-4 text-2xl">Meus salões</h2>
      {data.salons.length === 0 && <p className="text-muted-foreground">Compartilhe seu link para cadastrar o primeiro salão.</p>}
      <div className="grid gap-3 md:grid-cols-2">
        {data.salons.map((s) => (
          <div key={s.id} className="flex items-center justify-between rounded-xl border bg-card p-5">
            <div><p className="font-semibold">{s.name}</p><p className="text-sm text-muted-foreground">{s.city ?? "—"} · {data.plans.find((p) => p.id === s.plan_id)?.name}</p></div>
            <div className="text-right"><StatusBadge s={s.status} /><p className="mt-1 text-sm text-gold">{brl(s.status === "ativo" ? priceOf(s.plan_id) * pct / 100 : 0)}/mês</p></div>
          </div>
        ))}
      </div>
    </Shell>
  );
}
