import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Brand, btnGold, inputCls } from "@/components/Shell";
import { homeFor, type Role } from "@/lib/auth";
import { BRANDING } from "@/constants/branding";

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
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ]}),
  component: Auth,
});

function Auth() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"in" | "up">(search.role === 'dono_salao' ? "up" : "in");
  const [f, setF] = useState({ name: "", email: "", password: "", confirm: "", salon: "", city: "" });
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
    if (mode === "up" && f.password !== f.confirm) return void toast.error("As senhas não são iguais");
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
        data: { full_name: f.name, role: 'dono_salao', salon_name: f.salon, city: f.city },
      },
    });
    if (error) { setBusy(false); return toast.error(error.message.includes("registered") ? "Este e-mail já tem conta. Use Entrar." : /weak|pwned|known/i.test(error.message) ? "Senha muito fácil ou já vazada na internet. Crie outra senha mais forte." : error.message); }
    if (!data.session) {
      setBusy(false);
      return toast.success('Conta criada! Confira seu e-mail para confirmar o cadastro.');
    }
    setBusy(false);
    toast.success("Conta criada! Abrindo seu aplicativo…");
    goHome();
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
        <h1 className="mt-6 text-3xl">{mode === "in" ? "Entrar como Dono do Salão" : "Criar conta de Dono do Salão"}</h1>
        <form onSubmit={submit} className="mt-6 space-y-3">
          {mode === "up" && (
            <>
                <label className="block text-sm">Nome do Salão
                  <input required maxLength={100} placeholder="Nome do seu salão" className={`${inputCls} mt-1`} value={f.salon} onChange={(e) => setF({ ...f, salon: e.target.value })} /></label>
              <label className="block text-sm">Nome da Dona
                <input required maxLength={100} placeholder="Seu nome" className={`${inputCls} mt-1`} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></label>
            </>
          )}
          <label className="block text-sm">Email
            <input required type="email" placeholder="seu@email.com" className={`${inputCls} mt-1`} value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></label>
          <label className="block text-sm">{mode === "up" ? "Crie sua senha" : "Senha"}
            <input required type="password" minLength={6} autoComplete={mode === "up" ? "new-password" : "current-password"}
              placeholder={mode === "up" ? "Crie uma senha nova (não precisa ser do seu email)" : "Sua senha do app"} className={`${inputCls} mt-1`} value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} /></label>
          {mode === "up" && (
            <label className="block text-sm">Confirme sua senha
              <input required type="password" minLength={6} autoComplete="new-password" placeholder="Digite a mesma senha de novo" className={`${inputCls} mt-1`} value={f.confirm} onChange={(e) => setF({ ...f, confirm: e.target.value })} />
              {f.confirm && f.confirm !== f.password && <span className="mt-1 block text-xs text-destructive">As senhas não são iguais</span>}
            </label>
          )}
          {mode === "up" && <p className="text-xs text-muted-foreground">Mínimo 6 caracteres. É uma senha só deste app, não a do seu email.</p>}
          <button disabled={busy} className={`${btnGold} w-full py-3`}>{mode === "in" ? "Entrar" : busy ? "Criando…" : "Criar conta"}</button>
        </form>
        <button onClick={google} className="mt-3 w-full rounded-md border py-3 text-sm hover:border-primary">Continuar com Google</button>
        <button onClick={() => setMode(mode === "in" ? "up" : "in")} className="mt-4 w-full text-sm text-gold hover:underline">
          {mode === "in" ? "Não tem conta? Cadastre-se" : "Já tenho conta"}
        </button>
        <p className="mt-6 text-center text-xs text-muted-foreground">
          Desenvolvido por <span className="font-semibold text-foreground">{BRANDING.devName}</span>
        </p>
      </div>
    </div>
  );
}
