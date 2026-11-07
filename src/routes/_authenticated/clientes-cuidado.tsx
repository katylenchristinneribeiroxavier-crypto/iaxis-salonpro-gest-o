import { createFileRoute } from '@tanstack/react-router';
import { ClientCare } from '@/components/ClientCare';
import { Workspace } from '@/components/Workspace';
import { salonContextOptions, pageHead } from '@/lib/salon-data';
export const Route = createFileRoute('/_authenticated/clientes-cuidado')({ loader: ({ context }) => context.queryClient.ensureQueryData(salonContextOptions), head: () => pageHead('Cuidado inteligente das clientes', 'Serviços preferidos, frequência real de retorno e cuidado personalizado no IAxis SalonPRO.'), component: () => <Workspace manager><ClientCare /></Workspace> });