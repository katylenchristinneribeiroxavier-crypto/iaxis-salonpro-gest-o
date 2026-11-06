import { createFileRoute } from '@tanstack/react-router';
import { RoleGate } from '@/components/RoleGate';
import { Shell } from '@/components/Shell';
import { MasterSubscriptions } from '@/components/MasterSubscriptions';
import { pageHead } from '@/lib/salon-data';
export const Route = createFileRoute('/_authenticated/assinaturas')({
  head: () => pageHead('Assinaturas por salão', 'Veja o que cada cliente paga e o status de cada plano no IAxis SalonPRO.'),
  component: () => <RoleGate role="super_admin"><Shell role="Desenvolvedora Master" nav={[{ to: '/master-desenvolvedora', label: 'Controle de acesso' }, { to: '/master-financeiro', label: 'Meu caixa master' }, { to: '/despesas', label: 'Despesas' }, { to: '/assinaturas', label: 'Assinaturas' }, { to: '/admin', label: 'Planos e pagamentos' }, { to: '/configuracao-suporte', label: 'Suporte master' }]}><MasterSubscriptions /></Shell></RoleGate>,
});
