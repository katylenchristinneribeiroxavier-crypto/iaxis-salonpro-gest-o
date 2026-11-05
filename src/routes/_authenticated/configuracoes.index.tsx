import { createFileRoute } from '@tanstack/react-router';
import { SalonContactSettings } from '@/components/SalonContactSettings';
import { Workspace } from '@/components/Workspace';
import { salonContextOptions, pageHead } from '@/lib/salon-data';
export const Route = createFileRoute('/_authenticated/configuracoes/')({
  loader: ({ context }) => context.queryClient.ensureQueryData(salonContextOptions),
  head: () => pageHead('Configurações do salão', 'Configure o nome e o WhatsApp exclusivo do seu salão para receber agendamentos.'),
  component: () => <Workspace manager><SalonContactSettings /></Workspace>,
});