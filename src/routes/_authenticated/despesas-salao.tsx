import { createFileRoute } from '@tanstack/react-router';
import { SalonExpenses } from '@/components/SalonExpenses';
import { Workspace } from '@/components/Workspace';
import { salonContextOptions, pageHead } from '@/lib/salon-data';
export const Route = createFileRoute('/_authenticated/despesas-salao')({
  loader: ({ context }) => context.queryClient.ensureQueryData(salonContextOptions),
  head: () => pageHead('Despesas do salão', 'Cadastre aluguel, produtos e luz e acompanhe o lucro do mês no IAxis SalonPRO.'),
  component: () => <Workspace manager><SalonExpenses /></Workspace>,
});
