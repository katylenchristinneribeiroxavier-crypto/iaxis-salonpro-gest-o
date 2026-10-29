import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageTitle, Shell, StatusBadge, btnGold, inputCls } from "@/components/Shell";
import { RoleGate } from "@/components/RoleGate";

export const Route = createFileRoute("/_authenticated/revendedor/codigos")({
  head: () => ({ meta: [
    { title: "Códigos de venda — IAxis SalonPRO" },
    { name: "description", content: "Gere códigos de venda e comprove cada venda pelo login do comprador." },
    { property: "og:title", content: "Códigos de venda — IAxis SalonPRO" },
    { property: "og:description", content: "Comprovação de vendas do revendedor." },
  ]}),
  component: () => <RoleGate role="revendedor"><Codigos /></RoleGate>,
});

function Codigos() {
  const qc = useQueryClient();
  const [note, setNote] = useState("");
  const { data: codes } = useQuery({
    queryKey: ["sale-codes"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return (await supabase.from("sale_codes").select("*").eq("reseller_id", user!.id).order("created_at", { ascending: false })).data ?? [];
    },
  });
  const gerar = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase.from("sale_codes").insert({ reseller_id: user!.id, note: note || null }).select().single();
    if (error) return void toast.error(error.message);
    setNote("");
    navigator.clipboard?.writeText(data.code);
    toast.success(`Código ${data.code} gerado e copiado`);
    qc.invalidateQueries({ queryKey: ["sale-codes"] });
  };
  const validarUrl = `${window.location.origin}/validar`;

  return (
    <Shell role="Sócio Revendedor" nav={[{ to: "/revendedor", label: "Meu Painel" }, { to: "/revendedor/codigos", label: "Códigos de venda" }]}>
      <PageTitle title="Códigos de venda" sub="Gere um código para cada venda. O comprador valida com o login dele e a venda fica comprovada no seu nome." />
      <div className="flex flex-wrap gap-3 rounded-xl border bg-card p-5">
        <input placeholder="Observação (ex: Salão da Ana)" className={`${inputCls} max-w-sm`} value={note} onChange={(e) => setNote(e.target.value)} />
        <button onClick={gerar} className={btnGold}>Gerar código</button>
      </div>
      <p className="mt-3 text-sm text-muted-foreground">Envie ao comprador o código e o link: <code className="text-gold">{validarUrl}</code></p>
      <div className="mt-6 space-y-2">
        {codes?.length === 0 && <p className="text-muted-foreground">Nenhum código gerado ainda.</p>}
        {codes?.map((c) => (
          <div key={c.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-4">
            <div>
              <code className="font-display text-2xl tracking-widest text-gold">{c.code}</code>
              <p className="text-xs text-muted-foreground">{c.note ?? "—"} · gerado em {new Date(c.created_at).toLocaleDateString("pt-BR")}</p>
            </div>
            {c.used_by
              ? <div className="text-right text-sm"><StatusBadge s="Ativo" /><p className="mt-1">Comprovado por <b>{c.used_by_name}</b></p><p className="text-xs text-muted-foreground">{new Date(c.used_at!).toLocaleString("pt-BR")}</p></div>
              : <StatusBadge s="aguardando" />}
          </div>
        ))}
      </div>
    </Shell>
  );
}
