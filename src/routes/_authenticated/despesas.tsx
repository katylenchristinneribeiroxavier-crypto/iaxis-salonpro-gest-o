import { createFileRoute } from '@tanstack/react-router';
import { SalonExpenses } from '@/components/SalonExpenses';
import { Workspace } from '@/components/Workspace';
import { pageHead, salonContextOptions } from '@/lib/salon-data';
export const Route = createFileRoute('/_authenticated/despesas')({
  loader: ({ context }) => context.queryClient.ensureQueryData(salonContextOptions),
  head: () => pageHead('Notas e despesas automáticas', 'Comprovantes classificados por categoria, faturamento pago e resumo mensal do salão.'),
  component: () => <Workspace manager><SalonExpenses /></Workspace>,
});
