import { createFileRoute, Outlet } from "@tanstack/react-router";
import { Shell } from "@/components/Shell";
import { RoleGate } from "@/components/RoleGate";
import {SalonAccessGate} from '@/components/SalonAccessGate';

export const Route = createFileRoute("/_authenticated/salao")({
  component: () => (
    <RoleGate role="dono_salao">
      <Shell
        role="Dono do Salão"
        nav={[
          { to: "/salao", label: "Início" },
          { to: "/indique-e-ganhe", label: "Indique e Ganhe" },
          { to: "/configuracao-loja", label: "Meu salão" },
          { to: "/configurar-secretaria", label: "Secretária virtual" },
          { to: "/agenda-do-dia", label: "Agenda do dia" },
          { to: "/funcionarios", label: "Funcionários" },
          { to: "/financeiro-comissoes", label: "Financeiro e comissões" },
          { to: '/app', label: 'Todas as pastas' },
        ]}
      >
        <SalonAccessGate><Outlet /></SalonAccessGate>
      </Shell>
    </RoleGate>
  ),
});
