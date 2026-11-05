import { createFileRoute } from '@tanstack/react-router';
import { RoleGate } from '@/components/RoleGate';
import { Shell } from '@/components/Shell';
import { MasterFinance } from '@/components/MasterFinance';
import { pageHead } from '@/lib/salon-data';
export const Route = createFileRoute('/_authenticated/master-financeiro')({
  head: () => pageHead('Caixa master', 'Faturamento de assinaturas de todos os salões, separado do caixa de cada salão.'),
  component: () => <RoleGate role="super_admin"><Shell role="Desenvolvedora Master" nav={[{ to: '/master-desenvolvedora', label: 'Controle de acesso' }, { to: '/master-financeiro', label: 'Meu caixa master' }, { to: '/assinaturas', label: 'Assinaturas' }, { to: '/admin', label: 'Planos e pagamentos' }, { to: '/configuracao-suporte', label: 'Suporte master' }]}><MasterFinance /></Shell></RoleGate>,
});
