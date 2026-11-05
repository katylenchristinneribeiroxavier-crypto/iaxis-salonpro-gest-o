import { createFileRoute } from '@tanstack/react-router';
import { Shell } from '@/components/Shell';
import { SupportInbox } from '@/components/SupportInbox';
import { supportTicketsOptions } from '@/lib/support-data';
import { pageHead } from '@/lib/salon-data';

export const Route = createFileRoute('/_authenticated/meus-chamados')({
  loader: ({ context }) => context.queryClient.ensureQueryData(supportTicketsOptions()),
  head: () => pageHead('Meus chamados', 'Acompanhe seus chamados e as respostas do suporte da desenvolvedora no IAxis SalonPRO.'),
  component: () => <Shell role="Suporte técnico" nav={[{ to: '/meus-chamados', label: 'Meus chamados' }, { to: '/suporte', label: 'Novo chamado' }, { to: '/', label: 'Início' }]}><SupportInbox /></Shell>,
});