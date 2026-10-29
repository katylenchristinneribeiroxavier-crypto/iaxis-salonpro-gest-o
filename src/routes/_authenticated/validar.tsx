import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Brand, btnGold, inputCls } from "@/components/Shell";

export const Route = createFileRoute("/_authenticated/validar")({
  head: () => ({ meta: [
    { title: "Validar código do revendedor — IAxis SalonPRO" },
    { name: "description", content: "Informe o código recebido do seu revendedor para confirmar a compra." },
    { property: "og:title", content: "Validar código — IAxis SalonPRO" },
    { property: "og:description", content: "Confirme a compra com o código do revendedor." },
  ]}),
  component: Validar,
});

function Validar() {
  const [code, setCode] = useState("");
  const [ok, setOk] = useState(false);
  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data, error } = await supabase.rpc("redeem_sale_code", { _code: code });
    if (error) return void toast.error(error.message);
    if (data !== "OK") return void toast.error(data);
    setOk(true);
  };
  return (
    <div className="grid min-h-screen place-items-center bg-gradient-navy p-6">
      <div className="w-full max-w-md rounded-2xl border bg-card p-8 shadow-gold">
        <Brand />
        {ok ? (
          <>
            <h1 className="mt-6 text-3xl">Compra confirmada ✦</h1>
            <p className="mt-2 text-sm text-muted-foreground">Sua conta foi vinculada ao revendedor que te atendeu.</p>
            <Link to="/salao" className={`${btnGold} mt-6 inline-block`}>Ir para meu painel</Link>
          </>
        ) : (
          <form onSubmit={enviar}>
            <h1 className="mt-6 text-3xl">Código do revendedor</h1>
            <p className="mt-2 text-sm text-muted-foreground">Digite o código que você recebeu de quem te vendeu o IAxis SalonPRO.</p>
            <input required maxLength={8} placeholder="EX: A1B2C3D4" className={`${inputCls} mt-6 text-center font-display text-2xl uppercase tracking-widest`} value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} />
            <button className={`${btnGold} mt-4 w-full py-3`}>Validar código</button>
          </form>
        )}
      </div>
    </div>
  );
}
