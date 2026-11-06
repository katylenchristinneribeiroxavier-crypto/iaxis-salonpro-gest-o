import { createFileRoute } from '@tanstack/react-router';
import { ProductsModule } from '@/components/StockModules';
import { Workspace } from '@/components/Workspace';
import { salonContextOptions, pageHead } from '@/lib/salon-data';
export const Route = createFileRoute('/_authenticated/produtos')({
  loader: ({ context }) => context.queryClient.ensureQueryData(salonContextOptions),
  head: () => pageHead('Produtos e estoque', 'Controle de estoque inteligente com semáforo e baixa automática por atendimento.'),
  component: () => <Workspace manager><ProductsModule /></Workspace>,
});
