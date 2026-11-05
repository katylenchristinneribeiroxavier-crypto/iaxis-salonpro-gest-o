import { createFileRoute } from '@tanstack/react-router';
import { SalonMessages } from '@/components/SalonMessages';
import { Workspace } from '@/components/Workspace';
import { pageHead, salonContextOptions } from '@/lib/salon-data';
export const Route = createFileRoute('/_authenticated/mensagens')({
  loader: ({ context }) => context.queryClient.ensureQueryData(salonContextOptions),
  head: () => pageHead('Mensagens do salão', 'Converse com suas clientes pelo WhatsApp do salão sobre agendamentos e sinais.'),
  component: () => <Workspace manager><SalonMessages /></Workspace>,
});