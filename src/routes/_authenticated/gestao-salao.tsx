import { createFileRoute } from '@tanstack/react-router';
import { SalonOverview } from '@/components/SalonOverview';
import { Workspace } from '@/components/Workspace';
import { pageHead, salonContextOptions } from '@/lib/salon-data';

export const Route = createFileRoute('/_authenticated/gestao-salao')({
  loader: ({ context }) => context.queryClient.ensureQueryData(salonContextOptions),
  head: () => pageHead('Gestão integrada do salão', 'Agendamentos, sinais, clientes e assinatura do salão em uma única página.'),
  component: () => <Workspace manager><SalonOverview /></Workspace>,
});