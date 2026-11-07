import { createFileRoute } from '@tanstack/react-router';
import { SalonFinance } from '@/components/SalonFinance';
import { Workspace } from '@/components/Workspace';
import { salonContextOptions, pageHead } from '@/lib/salon-data';
export const Route = createFileRoute('/_authenticated/fechamento-mensal')({
  loader: ({ context }) => context.queryClient.ensureQueryData(salonContextOptions),
  head: () => pageHead('Fechamento mensal', 'Faturamento pago, lucro e comissões individuais com calendário brasileiro anual no IAxis SalonPRO.'),
  component: () => <Workspace manager><SalonFinance closure /></Workspace>,
});