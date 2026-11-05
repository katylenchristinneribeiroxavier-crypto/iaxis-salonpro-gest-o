import { createFileRoute } from '@tanstack/react-router';
import { SalonDeposits } from '@/components/SalonDeposits';
import { Workspace } from '@/components/Workspace';
import { salonContextOptions, pageHead } from '@/lib/salon-data';
export const Route = createFileRoute('/_authenticated/sinais')({
  loader: ({ context }) => context.queryClient.ensureQueryData(salonContextOptions),
  head: () => pageHead('Sinais de agendamento', 'Totais de sinal pendente, confirmado e saldo a receber do seu salão no IAxis SalonPRO.'),
  component: () => <Workspace><SalonDeposits /></Workspace>,
});
