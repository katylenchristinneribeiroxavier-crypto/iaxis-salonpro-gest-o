import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import * as Icons from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageTitle, Stat, btnGold } from "@/components/Shell";
import { salaoFolders } from "@/lib/modules";
import { brl } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/salao/")({
  head: () => ({ meta: [
    { title: "Painel do Salão — IAxis SalonPRO" },
    { name: "description", content: "Agenda do dia, faturamento e todas as pastas de gestão do salão." },
    { property: "og:title", content: "Painel do Salão — IAxis SalonPRO" },
    { property: "og:description", content: "Gestão completa do seu salão." },
  ]}),
  component: Painel,
});

const statuses = ["confirmado", "chegou", "em atendimento", "finalizado", "cancelado"];

function Painel() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["salao"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data: salon } = await supabase.from("salons").select("*").eq("owner_id", user.id).maybeSingle();
      if (!salon) return null;
      const start = new Date(); start.setHours(0, 0, 0, 0);
      const end = new Date(start); end.setDate(end.getDate() + 1);
      const [a, sv, pr] = await Promise.all([
        supabase.from("appointments").select("*").eq("salon_id", salon.id).gte("starts_at", start.toISOString()).lt("starts_at", end.toISOString()).order("starts_at"),
        supabase.from("services").select("*").eq("salon_id", salon.id),
        supabase.from("professionals").select("*").eq("salon_id", salon.id),
      ]);
      return { salon, appts: a.data ?? [], services: sv.data ?? [], pros: pr.data ?? [] };
    },
  });
  if (data === undefined) return null;
  if (data === null) return <CreateSalon onDone={() => qc.invalidateQueries()} />;
  const { salon, appts, services, pros } = data;
  const validos = appts.filter((a) => a.status !== "cancelado");
  const fat = appts.filter((a) => a.status === "finalizado").reduce((s, a) => s + Number(a.price), 0);
  const com = appts.filter((a) => a.status === "finalizado").reduce((s, a) => {
    return s + Number(a.commission_amount ?? 0);
  }, 0);
  const link = `${window.location.origin}/cliente?s=${salon.slug}`;

  const setStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("appointments").update({ status }).eq("id", id);
    if (error) toast.error(error.message); else qc.invalidateQueries({ queryKey: ["salao"] });
  };

  return (
    <>
      <PageTitle title={salon.name} sub={new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })} />
      {salon.status !== "ativo" && <div className="mb-6 rounded-xl border border-destructive bg-destructive/10 p-4 text-sm">Seu salão está <b>{salon.status}</b>. O agendamento online está desativado até a regularização.</div>}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Faturamento hoje" value={brl(fat)} hint="Atendimentos finalizados" />
        <Stat label="Agendamentos hoje" value={String(validos.length)} />
        <Stat label="Comissões do dia" value={brl(com)} />
        <Stat label="Sinais recebidos" value={brl(validos.reduce((s, a) => s + Number(a.deposit), 0))} />
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3 rounded-xl border bg-card p-4 text-sm">
        <span className="text-muted-foreground">Link de agendamento online:</span>
        <code className="text-gold">{link}</code>
        <button className={btnGold} onClick={() => { navigator.clipboard?.writeText(link); toast.success("Link copiado"); }}>Copiar</button>
      </div>

      <h2 className="mt-10 mb-4 text-2xl">Agenda de hoje</h2>
      {appts.length === 0 && <p className="text-muted-foreground">Nenhum agendamento para hoje.</p>}
      <div className="space-y-2">
        {appts.map((a) => (
          <div key={a.id} className="flex flex-wrap items-center gap-4 rounded-xl border bg-card p-4">
            <span className="font-display text-2xl text-gold">{new Date(a.starts_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>
            <div className="flex-1">
              <p className="font-semibold">{a.client_name}</p>
              <p className="text-sm text-muted-foreground">{services.find((s) => s.id === a.service_id)?.name} · {pros.find((p) => p.id === a.professional_id)?.name} · {brl(Number(a.price))}</p>
            </div>
            <select value={a.status} onChange={(e) => setStatus(a.id, e.target.value)} className="rounded border bg-card px-2 py-1 text-sm capitalize">
              {statuses.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
        ))}
      </div>

      <h2 className="mt-10 mb-4 text-2xl">Pastas</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {salaoFolders.map((f) => {
          const Icon = (Icons as unknown as Record<string, Icons.LucideIcon>)[f.icon] ?? Icons.Sparkles;
          return (
            <Link key={f.slug} to="/salao/$pasta" params={{ pasta: f.slug }} className="rounded-2xl border bg-card p-5 transition hover:-translate-y-1 hover:shadow-gold">
              <Icon className="h-7 w-7 text-gold" />
              <h3 className="mt-3 text-xl font-semibold">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.topics.length} tópicos · {f.desc}</p>
            </Link>
          );
        })}
      </div>
    </>
  );
}

function CreateSalon({ onDone }: { onDone: () => void }) {
  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from("salons").insert({ owner_id: user.id, name: String(f.get("name") ?? "").trim(), city: String(f.get("city") ?? "").trim() || null, slug: "auto" });
    if (error) return void toast.error(error.code === "42501" ? "Seu salão é liberado após a compra confirmada (ou você já tem um salão)." : error.message);
    toast.success("Salão criado"); onDone();
  };
  return (
    <form onSubmit={submit} className="max-w-md space-y-4 rounded-xl border bg-card p-6">
      <h2 className="text-2xl">Criar meu salão</h2>
      <label className="block text-sm">Nome do salão<input name="name" required maxLength={100} className="mt-2 w-full rounded-md border bg-background p-2" /></label>
      <label className="block text-sm">Cidade<input name="city" maxLength={100} className="mt-2 w-full rounded-md border bg-background p-2" /></label>
      <button type="submit" className={btnGold}>Criar salão</button>
    </form>
  );
}
