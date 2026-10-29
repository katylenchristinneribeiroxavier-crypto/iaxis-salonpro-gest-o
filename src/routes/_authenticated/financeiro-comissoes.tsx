import { createFileRoute } from '@tanstack/react-router';
import { SalonFinance } from '@/components/SalonFinance';
import { Workspace } from '@/components/Workspace';
import { salonContextOptions, pageHead } from '@/lib/salon-data';
export const Route = createFileRoute('/_authenticated/financeiro-comissoes')({
  loader: ({ context }) => context.queryClient.ensureQueryData(salonContextOptions),
  head: () => pageHead('Financeiro e comissões', 'Gestão de financeiro e comissões do seu salão no IAxis SalonPRO.'),
  component: () => <Workspace manager><SalonFinance /></Workspace>,
});
