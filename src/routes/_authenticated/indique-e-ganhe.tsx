import { createFileRoute } from '@tanstack/react-router';
import { OwnerPartnership } from '@/components/OwnerPartnership';
import { Workspace } from '@/components/Workspace';
import { pageHead, salonContextOptions } from '@/lib/salon-data';
export const Route = createFileRoute('/_authenticated/indique-e-ganhe')({
  loader: ({ context }) => context.queryClient.ensureQueryData(salonContextOptions),
  head: () => pageHead('Indique e Ganhe', 'Indicações, saldo de comissões e histórico de repasses do seu salão.'),
  component: () => <Workspace manager><OwnerPartnership /></Workspace>,
});