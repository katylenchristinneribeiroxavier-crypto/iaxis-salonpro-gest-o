import { createFileRoute, Outlet } from "@tanstack/react-router";
import { Shell } from "@/components/Shell";
import { RoleGate } from "@/components/RoleGate";
import { salaoFolders } from "@/lib/modules";
import {SalonAccessGate} from '@/components/SalonAccessGate';

export const Route = createFileRoute("/_authenticated/salao")({
  component: () => (
    <RoleGate role="dono_salao">
      <Shell
        role="Dono do Salão"
        nav={[
          { to: "/salao", label: "Início" },
          { to: "/validar", label: "Código do revendedor" },
          { to: "/configuracao-loja", label: "Meu salão" },
          { to: "/configurar-secretaria", label: "Secretária virtual" },
          { to: "/agenda-do-dia", label: "Agenda do dia" },
          { to: "/funcionarios", label: "Funcionários" },
          { to: "/financeiro-comissoes", label: "Financeiro e comissões" },
          ...salaoFolders.map((f) => ({ to: "/salao/$pasta", label: f.title, params: { pasta: f.slug } })),
        ]}
      >
        <SalonAccessGate><Outlet /></SalonAccessGate>
      </Shell>
    </RoleGate>
  ),
});
