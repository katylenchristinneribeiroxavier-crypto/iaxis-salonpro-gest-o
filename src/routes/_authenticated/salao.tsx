import { createFileRoute, Outlet } from "@tanstack/react-router";
import { Shell } from "@/components/Shell";
import { RoleGate } from "@/components/RoleGate";
import { salaoFolders } from "@/lib/modules";

export const Route = createFileRoute("/_authenticated/salao")({
  component: () => (
    <RoleGate role="dono_salao">
      <Shell
        role="Dono do Salão"
        nav={[
          { to: "/salao", label: "Início" },
          ...salaoFolders.map((f) => ({ to: "/salao/$pasta", label: f.title, params: { pasta: f.slug } })),
        ]}
      >
        <Outlet />
      </Shell>
    </RoleGate>
  ),
});
