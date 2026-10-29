import { createFileRoute } from '@tanstack/react-router';
import { SalonFinance } from '@/components/SalonFinance';
import { Workspace } from '@/components/Workspace';
import { salonContextOptions, pageHead } from '@/lib/salon-data';
export const Route = createFileRoute('/_authenticated/minhas-comissoes')({
  loader: ({ context }) => context.queryClient.ensureQueryData(salonContextOptions),
  head: () => pageHead('Minhas comissões', 'Gestão de minhas comissões do seu salão no IAxis SalonPRO.'),
  component: () => <Workspace ><SalonFinance personal/></Workspace>,
});
