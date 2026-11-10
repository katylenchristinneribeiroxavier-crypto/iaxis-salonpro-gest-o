import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { toast } from "sonner";
import { homeFor, useMe, type Role } from "@/lib/auth";

export function RoleGate({ role, children }: { role: Role; children: ReactNode }) {
  const { data, isLoading } = useMe();
  const navigate = useNavigate();
  const allowed = !!data && (data.roles.includes(role) || data.roles.includes("super_admin"));
  useEffect(() => {
    if (isLoading || allowed) return;
    toast.error("Acesso negado");
    navigate({ to: homeFor(data?.roles ?? []), replace: true });
  }, [isLoading, allowed, data, navigate]);
  if (isLoading) return <div className="grid min-h-screen place-items-center text-muted-foreground">Carregando…</div>;
  if (!allowed) {
    return (
      <div className="grid min-h-screen place-items-center p-6 text-center">
        <div>
          <h1 className="text-3xl">Acesso negado</h1>
          <p className="mt-2 text-muted-foreground">Sua conta não tem permissão para este painel.</p>
          <Link to={homeFor(data?.roles ?? [])} className="mt-4 inline-block text-gold hover:underline">Ir para meu painel</Link>
        </div>
      </div>
    );
  }
  return <>{children}</>;
}
