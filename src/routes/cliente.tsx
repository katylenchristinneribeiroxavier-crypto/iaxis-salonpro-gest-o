import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Brand } from "@/components/Shell";

export const Route = createFileRoute("/cliente")({
  head: () => ({ meta: [
    { title: "Agende seu horário — Studio Bella" },
    { name: "description", content: "Escolha serviço, profissional, dia e horário e pague o sinal online." },
    { property: "og:title", content: "Agende seu horário — Studio Bella" },
    { property: "og:description", content: "Agendamento online 24h." },
  ]}),
  component: Cliente,
});

const servicos = [{ n: "Corte", p: 90 }, { n: "Escova", p: 60 }, { n: "Luzes", p: 380 }, { n: "Manicure", p: 45 }, { n: "Progressiva", p: 290 }];
const profs = ["Carla", "Paula", "Rita"];
const horas = ["09:00", "10:30", "13:00", "14:30", "16:00", "17:30"];

function Cliente() {
  const [s, setS] = useState<string>();
  const [p, setP] = useState<string>();
  const [h, setH] = useState<string>();
  const [ok, setOk] = useState(false);
  const serv = servicos.find((x) => x.n === s);
  const opt = (sel: boolean) => `rounded-xl border p-3 text-sm transition ${sel ? "border-primary bg-primary/15 text-gold" : "bg-card hover:border-primary/60"}`;
  return (
    <div className="min-h-screen bg-gradient-navy">
      <div className="mx-auto max-w-2xl p-6">
        <Brand />
        <h1 className="mt-8 text-4xl font-semibold">Studio Bella</h1>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-xl border bg-card p-4"><p className="text-xs text-muted-foreground">Meu cashback</p><p className="font-display text-2xl text-gold">R$ 32,00</p></div>
          <div className="rounded-xl border bg-card p-4"><p className="text-xs text-muted-foreground">Pacote 10 escovas</p><p className="font-display text-2xl text-gold">7 restantes</p></div>
        </div>
        {ok ? (
          <div className="mt-8 rounded-2xl border border-primary bg-card p-8 text-center shadow-gold">
            <h2 className="text-3xl">Agendado! ✦</h2>
            <p className="mt-2 text-muted-foreground">{s} com {p} às {h}. Você receberá a confirmação no WhatsApp.</p>
            <button onClick={() => { setOk(false); setS(undefined); setP(undefined); setH(undefined); }} className="mt-6 text-gold hover:underline">Novo agendamento</button>
          </div>
        ) : (
          <>
            <h2 className="mt-8 mb-3 text-2xl">1. Serviço</h2>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">{servicos.map((x) => <button key={x.n} onClick={() => setS(x.n)} className={opt(s === x.n)}>{x.n}<br /><span className="text-muted-foreground">R$ {x.p}</span></button>)}</div>
            <h2 className="mt-6 mb-3 text-2xl">2. Profissional</h2>
            <div className="grid grid-cols-3 gap-2">{profs.map((x) => <button key={x} onClick={() => setP(x)} className={opt(p === x)}>{x}</button>)}</div>
            <h2 className="mt-6 mb-3 text-2xl">3. Horário (amanhã)</h2>
            <div className="grid grid-cols-3 gap-2">{horas.map((x) => <button key={x} onClick={() => setH(x)} className={opt(h === x)}>{x}</button>)}</div>
            <button disabled={!s || !p || !h} onClick={() => setOk(true)} className="mt-8 w-full rounded-xl bg-gradient-gold p-4 font-semibold text-primary-foreground disabled:opacity-40">
              Pagar sinal {serv ? `de R$ ${(serv.p * 0.3).toFixed(2).replace(".", ",")} (30%)` : ""} e agendar
            </button>
          </>
        )}
      </div>
    </div>
  );
}
