import { createFileRoute } from '@tanstack/react-router';
import { IdentitySettings } from '@/components/IdentitySettings';
import { Workspace } from '@/components/Workspace';
import { salonContextOptions, pageHead } from '@/lib/salon-data';
export const Route = createFileRoute('/_authenticated/configurar-secretaria')({
  loader: ({ context }) => context.queryClient.ensureQueryData(salonContextOptions),
  head: () => pageHead('Minha secretária virtual', 'Gestão de minha secretária virtual do seu salão no IAxis SalonPRO.'),
  component: () => <Workspace manager><IdentitySettings secretary/></Workspace>,
});
