import { createFileRoute } from '@tanstack/react-router';
import { Suppliers } from '@/components/Suppliers';
import { Workspace } from '@/components/Workspace';
import { salonContextOptions, pageHead } from '@/lib/salon-data';
export const Route = createFileRoute('/_authenticated/fornecedores-parceiros')({
  loader: ({ context }) => context.queryClient.ensureQueryData(salonContextOptions),
  head: () => pageHead('Fornecedores parceiros', 'Gestão de fornecedores parceiros do seu salão no IAxis SalonPRO.'),
  component: () => <Workspace manager><Suppliers /></Workspace>,
});
