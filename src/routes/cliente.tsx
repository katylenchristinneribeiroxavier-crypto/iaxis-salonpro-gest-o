import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import QRCode from "qrcode";
import { supabase } from "@/integrations/supabase/client";
import { Brand, StatusBadge, btnGold } from "@/components/Shell";
import { brl, useMe, useSignOut } from "@/lib/auth";
import { buildPixPayload, depositAmount } from "@/lib/salon-rules";

export const Route = createFileRoute("/cliente")({
  validateSearch: (s: Record<string, unknown>): { s?: string | undefined } => ({ s: typeof s["s"] === "string" ? s["s"] : undefined }),
  head: () => ({ meta: [
    { title: "Agende seu horário — IAxis SalonPRO" },
    { name: "description", content: "Escolha salão, serviço, profissional e horário e pague o sinal online." },
    { property: "og:title", content: "Agende seu horário — IAxis SalonPRO" },
    { property: "og:description", content: "Agendamento online 24h." },
  ]}),
  component: Cliente,
});

const horas = ["09:00", "10:00", "11:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00"];
const amanha = () => { const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().slice(0, 10); };

function Cliente() {
  const { s: slug } = Route.useSearch();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const me = useMe();
  const signOut = useSignOut();
  const [svc, setSvc] = useState<string>();
  const [pro, setPro] = useState<string>();
  const [day, setDay] = useState(amanha());
  const [hora, setHora] = useState<string>();
  const [pagamento, setPagamento] = useState<{ payload: string; qr: string; valor: number } | null>(null);

  const salons = useQuery({
    queryKey: ["salons-public"],
    queryFn: async () => (await supabase.from("salons").select("id, name, slug, city, cobrar_sinal, tipo_sinal, valor_sinal, pix_key, pix_holder, pix_city").eq("status", "ativo").order("name")).data ?? [],
  });
  const salon = salons.data?.find((x) => x.slug === slug);

  const catalog = useQuery({
    queryKey: ["catalog", salon?.id],
    enabled: !!salon,
    queryFn: async () => {
      const [sv, pr] = await Promise.all([
        supabase.from("services").select("*").eq("salon_id", salon!.id).order("name"),
        supabase.from("professionals").select("id, name").eq("salon_id", salon!.id).order("name"),
      ]);
      return { services: sv.data ?? [], pros: pr.data ?? [] };
    },
  });

  const booked = useQuery({
    queryKey: ["booked", pro, day],
    enabled: !!pro,
    queryFn: async () => {
      const { data } = await supabase.rpc("booked_slots", { _professional: pro!, _day: day });
      return (data ?? []).map((t: string) => new Date(t).toTimeString().slice(0, 5));
    },
  });

  const mine = useQuery({
    queryKey: ["my-appts", me.data?.user.id],
    enabled: !!me.data,
    queryFn: async () => (await supabase.from("appointments").select("*, salons(name), services(name)").eq("client_id", me.data!.user.id).order("starts_at", { ascending: false })).data ?? [],
  });

  const service = catalog.data?.services.find((x) => x.id === svc);
  const servicePrice = service ? Number(service.price) : 0;
  const wantsDeposit = !!salon?.cobrar_sinal && servicePrice > 0;
  const sinal = wantsDeposit ? depositAmount(servicePrice, salon!.tipo_sinal === "fixo" ? "fixo" : "porcentagem", Number(salon!.valor_sinal)) : 0;
  const opt = (sel: boolean, dis = false) => `rounded-xl border p-3 text-sm transition ${dis ? "opacity-30 line-through" : sel ? "border-primary bg-primary/15 text-gold" : "bg-card hover:border-primary/60"}`;

  const book = async () => {
    if (!me.data) return navigate({ to: "/auth", search: { role: "cliente" } });
    if (!salon || !service || !pro || !hora) return;
    if (wantsDeposit && !salon.pix_key) return toast.error("Este salão ainda não configurou o PIX para receber o sinal.");
    const starts = new Date(`${day}T${hora}:00`);
    const { data: appt, error } = await supabase.from("appointments").insert({
      salon_id: salon.id, client_id: me.data.user.id,
      client_name: (me.data.user.user_metadata?.["full_name"] as string) || me.data.user.email || "Cliente",
      service_id: service.id, professional_id: pro, starts_at: starts.toISOString(),
      price: servicePrice, deposit: sinal,
      valor_sinal_pago: sinal, status_sinal: wantsDeposit ? "pendente" : "isento",
    }).select("id").single();
    if (error) return toast.error(error.code === "23505" ? "Esse horário acabou de ser reservado. Escolha outro." : error.message);
    if (wantsDeposit && appt) {
      const payload = buildPixPayload(salon.pix_key, salon.pix_holder || salon.name, salon.pix_city || salon.city || "BRASIL", sinal, appt.id.replaceAll("-", "").slice(0, 20));
      const qr = await QRCode.toDataURL(payload, { width: 260, margin: 1 });
      setPagamento({ payload, qr, valor: sinal });
      toast.success("Horário reservado! Pague o sinal para confirmar.");
    } else {
      toast.success("Agendado! Você receberá a confirmação.");
    }
    setHora(undefined);
    qc.invalidateQueries({ queryKey: ["booked"] });
    qc.invalidateQueries({ queryKey: ["my-appts"] });
  };

  return (
    <div className="min-h-screen bg-gradient-navy">
      <div className="mx-auto max-w-2xl p-6">
        <div className="flex items-center justify-between">
          <Brand />
          {me.data ? <button onClick={signOut} className="text-sm text-gold">Sair</button> : <Link to="/auth" search={{ role: "cliente" }} className="text-sm text-gold">Entrar</Link>}
        </div>

        {!salon ? (
          <>
            <h1 className="mt-8 text-4xl font-semibold">Escolha o salão</h1>
            {salons.data?.length === 0 && <p className="mt-4 text-muted-foreground">Nenhum salão disponível ainda.</p>}
            <div className="mt-4 grid gap-3">
              {salons.data?.map((x) => (
                <Link key={x.id} to="/cliente" search={{ s: x.slug }} className="rounded-xl border bg-card p-5 hover:border-primary">
                  <p className="text-xl font-semibold">{x.name}</p><p className="text-sm text-muted-foreground">{x.city ?? ""}</p>
                </Link>
              ))}
            </div>
          </>
        ) : (
          <>
            <h1 className="mt-8 text-4xl font-semibold">{salon.name}</h1>
            <h2 className="mt-6 mb-3 text-2xl">1. Serviço</h2>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">{catalog.data?.services.map((x) => <button key={x.id} onClick={() => setSvc(x.id)} className={opt(svc === x.id)}>{x.name}<br /><span className="text-muted-foreground">{brl(Number(x.price))}</span></button>)}</div>
            <h2 className="mt-6 mb-3 text-2xl">2. Profissional</h2>
            <div className="grid grid-cols-3 gap-2">{catalog.data?.pros.map((x) => <button key={x.id} onClick={() => { setPro(x.id); setHora(undefined); }} className={opt(pro === x.id)}>{x.name}</button>)}</div>
            <h2 className="mt-6 mb-3 text-2xl">3. Dia e horário</h2>
            <input type="date" min={new Date().toISOString().slice(0, 10)} value={day} onChange={(e) => { setDay(e.target.value); setHora(undefined); }} className="mb-3 rounded-md border bg-card px-3 py-2 text-sm" />
            <div className="grid grid-cols-3 gap-2">{horas.map((h) => { const dis = !pro || !!booked.data?.includes(h); return <button key={h} disabled={dis} onClick={() => setHora(h)} className={opt(hora === h, dis && !!pro)}>{h}</button>; })}</div>
            {wantsDeposit && service && (
              <p className="mt-6 rounded-lg bg-muted p-3 text-sm text-muted-foreground">
                Para confirmar, pague {brl(sinal)} de sinal. Restante {brl(servicePrice - sinal)} no salão.
              </p>
            )}
            <button disabled={!svc || !pro || !hora} onClick={book} className={`${btnGold} mt-8 w-full p-4`}>
              {!me.data ? "Entrar para agendar" : wantsDeposit ? `Reservar e pagar sinal de ${brl(sinal)}` : "Confirmar agendamento"}
            </button>
            {pagamento && (
              <section className="mt-6 rounded-xl border bg-card p-5 text-center" aria-live="polite">
                <h2 className="text-2xl">Pague o sinal via PIX</h2>
                <p className="mt-1 text-sm text-muted-foreground">Escaneie o QR Code ou copie o código. O salão confirma seu horário assim que o pagamento de {brl(pagamento.valor)} cair.</p>
                <img src={pagamento.qr} alt={`QR Code PIX de ${brl(pagamento.valor)}`} className="mx-auto mt-4 rounded-lg" width={260} height={260} />
                <div className="mt-4 flex gap-2">
                  <input readOnly aria-label="Código PIX copia e cola" className="w-full truncate rounded-md border bg-background px-3 py-2 text-xs" value={pagamento.payload} onFocus={(e) => e.target.select()} />
                  <button className={btnGold} onClick={async () => { await navigator.clipboard.writeText(pagamento.payload); toast.success("Código PIX copiado"); }}>Copiar</button>
                </div>
                <button className="mt-3 text-sm text-muted-foreground underline" onClick={() => setPagamento(null)}>Já paguei, fechar</button>
              </section>
            )}
          </>
        )}

        {me.data && (mine.data?.length ?? 0) > 0 && (
          <>
            <h2 className="mt-10 mb-3 text-2xl">Meus agendamentos</h2>
            <div className="space-y-2">
              {mine.data!.map((a) => (
                <div key={a.id} className="flex items-center justify-between rounded-xl border bg-card p-4 text-sm">
                  <div><p className="font-semibold">{(a.services as { name: string } | null)?.name} · {(a.salons as { name: string } | null)?.name}</p>
                    <p className="text-muted-foreground">{new Date(a.starts_at).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })} · sinal {brl(Number(a.deposit))}</p></div>
                  <StatusBadge s={a.status} />
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
