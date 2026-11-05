import { createFileRoute } from '@tanstack/react-router';
import { ClientsDeposits } from '@/components/ClientsDeposits';
import { Workspace } from '@/components/Workspace';
import { salonContextOptions, pageHead } from '@/lib/salon-data';
export const Route = createFileRoute('/_authenticated/clientes-sinais')({
  loader: ({ context }) => context.queryClient.ensureQueryData(salonContextOptions),
  head: () => pageHead('Clientes e sinais', 'Lista de clientes com data de agendamento, valor do sinal e status de confirmação.'),
  component: () => <Workspace><ClientsDeposits /></Workspace>,
});
