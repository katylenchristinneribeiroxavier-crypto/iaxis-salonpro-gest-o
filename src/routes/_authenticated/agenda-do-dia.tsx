import { createFileRoute } from '@tanstack/react-router';
import { SalonAgenda } from '@/components/SalonAgenda';
import { Workspace } from '@/components/Workspace';
import { salonContextOptions, pageHead } from '@/lib/salon-data';
export const Route = createFileRoute('/_authenticated/agenda-do-dia')({
  loader: ({ context }) => context.queryClient.ensureQueryData(salonContextOptions),
  head: () => pageHead('Agenda do dia', 'Gestão de agenda do dia do seu salão no IAxis SalonPRO.'),
  component: () => <Workspace ><SalonAgenda /></Workspace>,
});
