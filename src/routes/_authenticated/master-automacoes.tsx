import { createFileRoute } from '@tanstack/react-router';
import { RoleGate } from '@/components/RoleGate';
import { Shell } from '@/components/Shell';
import { PlatformAutomations } from '@/components/PlatformAutomations';
import { pageHead } from '@/lib/salon-data';

export const Route = createFileRoute('/_authenticated/master-automacoes')({
  head: () => pageHead('Central de automações', 'Configuração central da Evolution e acompanhamento das conexões WhatsApp dos salões no IAxis SalonPRO.'),
  component: () => <RoleGate role="super_admin"><Shell role="Desenvolvedora Master" nav={[{ to: '/master-desenvolvedora', label: 'Controle de acesso' }, { to: '/master-automacoes', label: 'Central de automações' }, { to: '/master-financeiro', label: 'Meu caixa master' }, { to: '/assinaturas', label: 'Assinaturas' }, { to: '/admin', label: 'Planos e pagamentos' }]}><PlatformAutomations /></Shell></RoleGate>,
});