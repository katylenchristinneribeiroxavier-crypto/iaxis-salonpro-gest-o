import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export type Role = "super_admin" | "revendedor" | "dono_salao" | "cliente";

export function useMe() {
  return useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
      return { user, roles: (data ?? []).map((r) => r.role as Role) };
    },
  });
}

export function homeFor(roles: Role[]) {
  if (roles.includes("super_admin")) return "/master-desenvolvedora";
  if (roles.includes("dono_salao")) return "/app";
  if (roles.includes("revendedor")) return "/revendedor";
  return "/cliente";
}

export function useSignOut() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  return async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };
}

export const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
