import { createFileRoute } from '@tanstack/react-router';
import { SalonReminders } from '@/components/SalonReminders';
import { Workspace } from '@/components/Workspace';
import { salonContextOptions, pageHead } from '@/lib/salon-data';
export const Route=createFileRoute('/_authenticated/lembretes')({loader:({context})=>context.queryClient.ensureQueryData(salonContextOptions),head:()=>pageHead('Lembretes e atendimento','Preferências, mensagens programadas e solicitações de atendimento do seu salão.'),component:()=> <Workspace manager><SalonReminders/></Workspace>});