import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Brand, btnGold, inputCls } from "@/components/Shell";
import { homeFor, type Role } from "@/lib/auth";

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>): { ref?: string | undefined; role?: string | undefined } => ({
    ref: typeof s["ref"] === "string" ? s["ref"] : undefined,
    role: typeof s["role"] === "string" ? s["role"] : undefined,
  }),
  head: () => ({ meta: [
    { title: "Entrar — IAxis SalonPRO" },
    { name: "description", content: "Acesse ou crie sua conta no IAxis SalonPRO." },
    { property: "og:title", content: "Entrar — IAxis SalonPRO" },
    { property: "og:description", content: "Acesse sua conta." },
  ]}),
  component: Auth,
});

const roles: { v: Role; l: string }[] = [
  { v: "dono_salao", l: "Dono de Salão" },
  { v: "revendedor", l: "Revendedor" },
  { v: "cliente", l: "Cliente" },
];

function Auth() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"in" | "up">(search.ref || search.role ? "up" : "in");
  const [role, setRole] = useState<Role>((search.role as Role) ?? (search.ref ? "dono_salao" : "cliente"));
  const [f, setF] = useState({ name: "", email: "", password: "", salon: "", city: "" });
  const [busy, setBusy] = useState(false);

  const goHome = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
    navigate({ to: homeFor((data ?? []).map((r) => r.role as Role)) });
  };
  useEffect(() => { goHome(); }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    if (mode === "in") {
      const { error } = await supabase.auth.signInWithPassword({ email: f.email, password: f.password });
      setBusy(false);
      if (error) return toast.error("E-mail ou senha inválidos");
      return goHome();
    }
    const { data, error } = await supabase.auth.signUp({
      email: f.email, password: f.password,
      options: {
        emailRedirectTo: window.location.origin + "/auth",
        data: { full_name: f.name, role, salon_name: f.salon, city: f.city, ref: search.ref },
      },
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    if (!data.session) toast.success("Conta criada! Confirme pelo link enviado ao seu e-mail.");
    else goHome();
  };

  const google = async () => {
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/auth" });
    if (r.error) toast.error("Não foi possível entrar com Google");
    else if (!r.redirected) goHome();
  };

  return (
    <div className="grid min-h-screen place-items-center bg-gradient-navy p-6">
      <div className="w-full max-w-md rounded-2xl border bg-card p-8 shadow-gold">
        <Brand />
        <h1 className="mt-6 text-3xl">{mode === "in" ? "Entrar" : "Criar conta"}</h1>
        {search.ref && <p className="mt-1 text-xs text-gold">Indicação de parceiro: {search.ref}</p>}
        <form onSubmit={submit} className="mt-6 space-y-3">
          {mode === "up" && (
            <>
              <div className="grid grid-cols-3 gap-2">
                {roles.map((r) => (
                  <button type="button" key={r.v} onClick={() => setRole(r.v)}
                    className={`rounded-md border p-2 text-xs ${role === r.v ? "border-primary bg-primary/15 text-gold" : ""}`}>{r.l}</button>
                ))}
              </div>
              <input required placeholder="Seu nome" className={inputCls} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
              {role === "dono_salao" && (
                <>
                  <input required placeholder="Nome do salão" className={inputCls} value={f.salon} onChange={(e) => setF({ ...f, salon: e.target.value })} />
                  <input placeholder="Cidade/UF" className={inputCls} value={f.city} onChange={(e) => setF({ ...f, city: e.target.value })} />
                </>
              )}
            </>
          )}
          <input required type="email" placeholder="E-mail" className={inputCls} value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
          <input required type="password" minLength={6} placeholder="Senha" className={inputCls} value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} />
          <button disabled={busy} className={`${btnGold} w-full py-3`}>{mode === "in" ? "Entrar" : "Cadastrar"}</button>
        </form>
        <button onClick={google} className="mt-3 w-full rounded-md border py-3 text-sm hover:border-primary">Continuar com Google</button>
        <button onClick={() => setMode(mode === "in" ? "up" : "in")} className="mt-4 w-full text-sm text-gold hover:underline">
          {mode === "in" ? "Não tem conta? Cadastre-se" : "Já tenho conta"}
        </button>
      </div>
    </div>
  );
}
