import { createFileRoute } from '@tanstack/react-router';
import { WhatsappSettings } from '@/components/WhatsappSettings';
import { Workspace } from '@/components/Workspace';
import { salonContextOptions, pageHead } from '@/lib/salon-data';
export const Route = createFileRoute('/_authenticated/configuracoes/whatsapp')({
  loader: ({ context }) => context.queryClient.ensureQueryData(salonContextOptions),
  head: () => pageHead('WhatsApp do meu salão', 'Conecte seu número de WhatsApp e acompanhe as mensagens do seu salão no IAxis SalonPRO.'),
  component: () => <Workspace manager><WhatsappSettings /></Workspace>,
});
