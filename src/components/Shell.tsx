import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Crown, LogOut, Headset } from "lucide-react";
import { Button } from './ui/button';
import { useMe, useSignOut } from "@/lib/auth";
import { BRANDING } from "@/constants/branding";

export type NavItem = { to: string; label: string; params?: Record<string, string> };

export function Brand() {
  return (
    <Link to="/" className="flex items-center gap-2">
      <span className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-gold text-primary-foreground shadow-gold">
        <Crown className="h-5 w-5" />
      </span>
      <span className="font-display text-xl font-semibold">
        IAxis <span className="text-gradient-gold">SalonPRO</span>
      </span>
    </Link>
  );
}

export function Shell({ role, nav, children }: { role: string; nav: NavItem[]; children: ReactNode }) {
  const signOut = useSignOut();
  const me = useMe();
  return (
    <div className="min-h-screen md:flex">
      <aside className="border-b bg-sidebar p-5 md:flex md:min-h-screen md:w-64 md:shrink-0 md:flex-col md:border-b-0 md:border-r">
        <Brand />
        <p className="mt-3 text-xs uppercase tracking-widest text-gold">{role}</p>
        <nav className="mt-6 flex gap-1 overflow-x-auto md:flex-col">
          {nav.map((n) => (
            <Link
              key={n.to + (n.params ? JSON.stringify(n.params) : "")}
              to={n.to}
              params={n.params as never}
              activeOptions={{ exact: true }}
              className="whitespace-nowrap rounded-md px-3 py-2 text-sm text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              activeProps={{ className: "bg-sidebar-accent text-sidebar-accent-foreground" }}
            >
              {n.label}
            </Link>
          ))}
          <Button variant="ghost" onClick={signOut} className="justify-start text-sidebar-foreground/80">
            <LogOut className="h-4 w-4" /> Sair
          </Button>
        </nav>
        <div className="mt-6 border-t pt-4 md:mt-auto">
          <p className="text-center text-[11px] text-muted-foreground">
            Desenvolvido por<br />
            <span className="text-sm font-bold text-foreground">{BRANDING.devName}</span>
          </p>
        </div>
      </aside>
      <main className="min-w-0 flex-1 bg-gradient-navy p-6 pb-24 md:p-10">
        {me.data?.roles.includes('super_admin') && <header className="mb-6 flex items-center justify-end gap-3 border-b pb-4">
          <Crown aria-hidden="true" className="h-6 w-6 shrink-0 text-gold" />
          <div>
            <p className="text-sm font-bold text-gold">Desenvolvedora {BRANDING.devName}</p>
            <p className="text-xs italic text-foreground/80">Idealizador {BRANDING.devName}</p>
          </div>
        </header>}
        {children}
        <footer className="mt-10 w-full border-t py-3 text-center text-xs text-muted-foreground">
          {BRANDING.copyright} | Todos os direitos reservados
        </footer>
      </main>
      <Button asChild className="fixed right-5 bottom-5 shadow-gold"><Link to="/suporte"><Headset/>Suporte técnico</Link></Button>
    </div>
  );
}

export function PageTitle({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="mb-8">
      <h1 className="text-4xl font-semibold">{title}</h1>
      {sub && <p className="mt-1 text-muted-foreground">{sub}</p>}
    </div>
  );
}

export function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl border bg-card p-5">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-2 font-display text-3xl text-gold">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function StatusBadge({ s }: { s: string }) {
  const v = s.toLowerCase();
  const tone =
    v === "ativo" || v === "finalizado" ? "bg-success/15 text-success" :
    v === "bloqueado" || v === "inadimplente" || v === "cancelado" ? "bg-destructive/15 text-destructive" :
    "bg-primary/15 text-gold";
  return <span className={`rounded-full px-2.5 py-0.5 text-xs capitalize ${tone}`}>{s}</span>;
}

export const inputCls = "w-full rounded-md border bg-input/10 px-3 py-2 text-sm outline-none focus:border-primary";
export const btnGold = "rounded-md bg-gradient-gold px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-40";
