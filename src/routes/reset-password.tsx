import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Brand, inputCls } from "@/components/Shell";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [
    { title: "Nova senha — IAxis SalonPRO" },
    { name: "description", content: "Crie uma nova senha para sua conta IAxis SalonPRO." },
    { property: "og:title", content: "Nova senha — IAxis SalonPRO" },
    { property: "og:description", content: "Redefina sua senha com segurança." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ]}),
  component: ResetPassword,
});

function ResetPassword() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => { if (data.session) setReady(true); });
    return () => data.subscription.unsubscribe();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pw !== confirm) return void toast.error("As senhas não são iguais");
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setBusy(false);
    if (error) return void toast.error(/weak|pwned|known/i.test(error.message) ? "Senha muito fácil ou já vazada. Escolha outra mais forte." : "Não foi possível salvar. Abra o link do e-mail novamente.");
    toast.success("Senha nova salva!");
    navigate({ to: "/auth" });
  };

  return (
    <div className="grid min-h-screen place-items-center bg-gradient-navy p-6">
      <div className="w-full max-w-md rounded-2xl border bg-card p-8 shadow-gold">
        <Brand />
        <h1 className="mt-6 text-3xl">Criar nova senha</h1>
        {!ready ? (
          <p className="mt-4 text-sm text-muted-foreground">Abra esta página pelo link enviado ao seu e-mail.</p>
        ) : (
          <form onSubmit={submit} className="mt-6 space-y-3">
            <label className="block text-sm">Nova senha
              <input required type="password" minLength={8} maxLength={128} autoComplete="new-password" className={`${inputCls} mt-1`} value={pw} onChange={(e) => setPw(e.target.value)} /></label>
            <label className="block text-sm">Confirme a nova senha
              <input required type="password" minLength={8} maxLength={128} autoComplete="new-password" className={`${inputCls} mt-1`} value={confirm} onChange={(e) => setConfirm(e.target.value)} /></label>
            <Button disabled={busy} className="w-full" type="submit">{busy ? "Salvando…" : "Salvar nova senha"}</Button>
          </form>
        )}
      </div>
    </div>
  );
}
