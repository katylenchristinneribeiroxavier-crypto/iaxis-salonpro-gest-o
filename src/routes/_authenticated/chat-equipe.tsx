import { createFileRoute } from '@tanstack/react-router';
import { TeamChat } from '@/components/TeamChat';
import { Workspace } from '@/components/Workspace';
import { salonContextOptions, pageHead } from '@/lib/salon-data';
export const Route = createFileRoute('/_authenticated/chat-equipe')({
  loader: ({ context }) => context.queryClient.ensureQueryData(salonContextOptions),
  head: () => pageHead('Chat da equipe', 'Gestão de chat da equipe do seu salão no IAxis SalonPRO.'),
  component: () => <Workspace ><TeamChat /></Workspace>,
});
