import { createFileRoute, Outlet } from "@tanstack/react-router";
import { Shell } from "@/components/Shell";
import { salaoFolders } from "@/lib/modules";

export const Route = createFileRoute("/_authenticated/salao")({
  component: () => (
    <Shell
      role="Dono do Salão · Studio Bella"
      nav={[
        { to: "/salao", label: "Início" },
        ...salaoFolders.map((f) => ({ to: "/salao/$pasta", label: f.title, params: { pasta: f.slug } })),
        { to: "/", label: "Sair" },
      ]}
    >
      <Outlet />
    </Shell>
  ),
});
