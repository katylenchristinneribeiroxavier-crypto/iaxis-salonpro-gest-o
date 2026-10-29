import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageTitle, Shell, Stat, StatusBadge, inputCls } from "@/components/Shell";
import { RoleGate } from "@/components/RoleGate";
import { brl } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [
    { title: "Painel Master — IAxis SalonPRO" },
    { name: "description", content: "Super Admin: salões, planos, revendedores, MRR e churn." },
    { property: "og:title", content: "Painel Master — IAxis SalonPRO" },
    { property: "og:description", content: "Controle total da plataforma." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ]}),
  component: () => <RoleGate role="super_admin"><Admin /></RoleGate>,
});

function Admin() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["admin"],
    queryFn: async () => {
      const [s, p, r, pr, st, rq] = await Promise.all([
        supabase.from("salons").select("*").order("created_at", { ascending: false }),
        supabase.from("plans").select("*").order("sort"),
        supabase.from("resellers").select("*"),
        supabase.from("profiles").select("id, full_name, email"),
        supabase.from("platform_settings").select("*").eq("id", 1).maybeSingle(),
        supabase.from("subscription_requests").select("*, plans(name)").order("created_at", { ascending: false }),
      ]);
      return { salons: s.data ?? [], plans: p.data ?? [], resellers: r.data ?? [], profiles: pr.data ?? [], pix: st.data, reqs: rq.data ?? [] };
    },
  });
  const salons = data?.salons ?? [];
  const plans = data?.plans ?? [];
  const resellers = data?.resellers ?? [];
  const nameOf = (id: string | null) => data?.profiles.find((p) => p.id === id)?.full_name || "—";
  const priceOf = (id: string | null) => Number(plans.find((p) => p.id === id)?.price ?? 0);
  const ativos = salons.filter((s) => s.status === "ativo");
  const mrr = ativos.reduce((a, s) => a + priceOf(s.plan_id), 0);
  const churn = salons.length ? ((salons.length - ativos.length) / salons.length) * 100 : 0;
  const refresh = () => qc.invalidateQueries({ queryKey: ["admin"] });

  const upd = async (table: "salons" | "plans" | "resellers" | "platform_settings" | "subscription_requests", key: string, id: string, patch: Record<string, unknown>) => {
    const { error } = await supabase.from(table).update(patch as never).eq(key, id);
    if (error) toast.error(error.message); else { toast.success("Salvo"); refresh(); }
  };

  return (
    <Shell role="Super Admin" nav={[{ to: "/admin", label: "Painel Master" },{to:'/master-desenvolvedora',label:'Controle de acesso'}, { to: "/salao", label: "Ver painel do salão" },{to:'/configuracao-suporte',label:'Configurar suporte'},{to:'/tickets-suporte',label:'Tickets de suporte'},{to:'/gestao-revendedores',label:'Gestão de revendas'}]}>
      <PageTitle title="Painel Master" sub="Visão geral de toda a plataforma" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="MRR" value={brl(mrr)} />
        <Stat label="Salões ativos" value={`${ativos.length} / ${salons.length}`} />
        <Stat label="Churn / bloqueados" value={`${churn.toFixed(1).replace(".", ",")}%`} />
        <Stat label="Revendedores" value={String(resellers.length)} />
      </div>

      <h2 className="mt-10 mb-4 text-2xl">Salões cadastrados</h2>
      <div className="overflow-x-auto rounded-xl border bg-card">
        <table className="w-full text-sm">
          <thead className="text-left text-muted-foreground"><tr>{["Salão","Dono","Cidade","Plano","Revendedor","Status",""].map(h=><th key={h} className="p-3">{h}</th>)}</tr></thead>
          <tbody>
            {salons.length === 0 && <tr><td colSpan={7} className="p-6 text-center text-muted-foreground">Nenhum salão ainda.</td></tr>}
            {salons.map((s) => (
              <tr key={s.id} className="border-t">
                <td className="p-3">{s.name}</td><td className="p-3">{nameOf(s.owner_id)}</td><td className="p-3">{s.city ?? "—"}</td>
                <td className="p-3">
                  <select className="rounded border bg-card px-2 py-1" value={s.plan_id ?? ""} onChange={(e) => upd("salons", "id", s.id, { plan_id: e.target.value })}>
                    {plans.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </td>
                <td className="p-3">{nameOf(s.reseller_id)}</td>
                <td className="p-3"><StatusBadge s={s.status} /></td>
                <td className="p-3"><Link to="/master-desenvolvedora" className="text-gold hover:underline">Controlar acesso</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-10 grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border bg-card p-6">
          <h3 className="text-2xl">Planos</h3>
          <p className="text-xs text-muted-foreground">Mensal · anual (valor por mês) · taxa online</p>
          {plans.map((p) => (
            <div key={p.id} className="mt-3 flex items-center justify-between gap-3 border-t pt-3">
              <span>{p.name}</span>
              <div className="flex items-center gap-2 text-sm">R$
                <input type="number" step="0.01" title="Mensal" defaultValue={Number(p.price)} className={`${inputCls} w-24`} onBlur={(e) => upd("plans", "id", p.id, { price: +e.target.value })} />
                <input type="number" step="0.01" title="Anual (valor/mês)" defaultValue={Number(p.annual_monthly_price)} className={`${inputCls} w-24`} onBlur={(e) => upd("plans", "id", p.id, { annual_monthly_price: +e.target.value })} />anual
                <input type="number" defaultValue={Number(p.online_fee_pct)} className={`${inputCls} w-16`} onBlur={(e) => upd("plans", "id", p.id, { online_fee_pct: +e.target.value })} />% online
              </div>
            </div>
          ))}
        </div>
        <div className="rounded-xl border bg-card p-6">
          <h3 className="text-2xl">Revendedores</h3>
          {resellers.length === 0 && <p className="mt-3 text-sm text-muted-foreground">Nenhum revendedor ainda.</p>}
          {resellers.map((r) => {
            const vendas = ativos.filter((s) => s.reseller_id === r.user_id);
            const repasse = vendas.reduce((a, s) => a + priceOf(s.plan_id) * Number(r.commission_pct) / 100, 0);
            return (
              <div key={r.user_id} className="mt-3 flex items-center justify-between gap-3 border-t pt-3 text-sm">
                <div><p>{nameOf(r.user_id)}</p><p className="text-xs text-muted-foreground">/r/{r.code} · {vendas.length} salões · {brl(repasse)}/mês</p></div>
                <div className="flex items-center gap-1">
                  <input type="number" defaultValue={Number(r.commission_pct)} className={`${inputCls} w-16`} onBlur={(e) => upd("resellers", "user_id", r.user_id, { commission_pct: +e.target.value })} />%
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-10 grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border bg-card p-6">
          <h3 className="text-2xl">Dados do PIX da empresa</h3>
          <p className="mt-1 text-xs text-muted-foreground">Aparecem na tela de assinatura para quem adquirir o app.</p>
          {data?.pix && (["pix_key:Chave PIX", "pix_holder:Favorecido", "pix_cnpj:CNPJ/CPF", "pix_bank:Banco"] as const).map((x) => {
            const [k, l] = x.split(":") as [string, string];
            return (
              <label key={k} className="mt-3 block text-sm">{l}
                <input defaultValue={(data.pix as Record<string, unknown>)[k] as string} className={`${inputCls} mt-1`} onBlur={(e) => upd("platform_settings", "id", "1", { [k]: e.target.value })} />
              </label>
            );
          })}
        </div>
        <div className="rounded-xl border bg-card p-6">
          <h3 className="text-2xl">Pagamentos PIX recebidos</h3>
          {(data?.reqs.length ?? 0) === 0 && <p className="mt-3 text-sm text-muted-foreground">Nenhum pedido ainda.</p>}
          {data?.reqs.map((q) => (
            <div key={q.id} className="mt-3 flex items-center justify-between gap-3 border-t pt-3 text-sm">
              <div><p>{q.name} · {q.email}</p><p className="text-xs text-muted-foreground">{(q.plans as { name: string } | null)?.name} {q.billing} · {brl(Number(q.amount))}</p></div>
              {q.status === "aguardando"
                ? <button className="text-gold hover:underline" onClick={() => upd("subscription_requests", "id", q.id, { status: "confirmado" })}>Confirmar</button>
                : <StatusBadge s={q.status} />}
            </div>
          ))}
        </div>
      </div>
    </Shell>
  );
}
