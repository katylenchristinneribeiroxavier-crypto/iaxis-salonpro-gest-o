import { createFileRoute } from '@tanstack/react-router';
import { SuppliersModule } from '@/components/StockModules';
import { Workspace } from '@/components/Workspace';
import { salonContextOptions, pageHead } from '@/lib/salon-data';
export const Route = createFileRoute('/_authenticated/fornecedores')({
  loader: ({ context }) => context.queryClient.ensureQueryData(salonContextOptions),
  head: () => pageHead('Fornecedores', 'Cadastro de fornecedores do salão e pedidos de reposição pelo WhatsApp.'),
  component: () => <Workspace manager><SuppliersModule /></Workspace>,
});
