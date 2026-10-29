import { createFileRoute } from '@tanstack/react-router';
import { ClientCategories } from '@/components/ClientCategories';
import { Workspace } from '@/components/Workspace';
import { salonContextOptions, pageHead } from '@/lib/salon-data';
export const Route = createFileRoute('/_authenticated/clientes-categorias')({
  loader: ({ context }) => context.queryClient.ensureQueryData(salonContextOptions),
  head: () => pageHead('Clientes e categorias', 'Gestão de clientes e categorias do seu salão no IAxis SalonPRO.'),
  component: () => <Workspace manager><ClientCategories /></Workspace>,
});
