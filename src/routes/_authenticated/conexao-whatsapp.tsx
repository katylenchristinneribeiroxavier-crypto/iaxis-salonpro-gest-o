import { createFileRoute } from '@tanstack/react-router';
import { WhatsappSettings } from '@/components/WhatsappSettings';
import { Workspace } from '@/components/Workspace';
import { salonContextOptions, pageHead } from '@/lib/salon-data';
export const Route = createFileRoute('/_authenticated/conexao-whatsapp')({loader: ({context}) => context.queryClient.ensureQueryData(salonContextOptions),head:()=>pageHead('Conexão WhatsApp','Conexão WhatsApp no IAxis SalonPRO.'),component:()=> <Workspace manager><WhatsappSettings/></Workspace>});
