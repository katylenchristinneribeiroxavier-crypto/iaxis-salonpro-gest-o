import { createFileRoute } from '@tanstack/react-router';
import { SalonExpenses } from '@/components/SalonExpenses';
import { Workspace } from '@/components/Workspace';
import { salonContextOptions, pageHead } from '@/lib/salon-data';
export const Route = createFileRoute('/_authenticated/despesas-salao')({
  loader: ({ context }) => context.queryClient.ensureQueryData(salonContextOptions),
  head: () => pageHead('Despesas do salão', 'Despesas por foto, faturamento pago e resumo automático mensal do seu salão.'),
  component: () => <Workspace manager><SalonExpenses /></Workspace>,
});
