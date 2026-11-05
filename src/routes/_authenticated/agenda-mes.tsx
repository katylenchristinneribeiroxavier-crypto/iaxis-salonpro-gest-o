import { createFileRoute } from '@tanstack/react-router';
import { SalonMonthCalendar } from '@/components/SalonMonthCalendar';
import { Workspace } from '@/components/Workspace';
import { salonContextOptions, pageHead } from '@/lib/salon-data';
export const Route = createFileRoute('/_authenticated/agenda-mes')({
  loader: ({ context }) => context.queryClient.ensureQueryData(salonContextOptions),
  head: () => pageHead('Agendamentos por mês', 'Visão mensal da agenda do salão com gráfico de ocupação e horários livres no IAxis SalonPRO.'),
  component: () => <Workspace><SalonMonthCalendar /></Workspace>,
});
