import { createFileRoute } from '@tanstack/react-router';
import { useSuspenseQuery } from '@tanstack/react-query';
import { BookingAssistant } from '@/components/BookingAssistant';
import { Workspace } from '@/components/Workspace';
import { salonContextOptions, pageHead } from '@/lib/salon-data';
export const Route=createFileRoute('/_authenticated/assistente-agendamento')({loader:({context})=>context.queryClient.ensureQueryData(salonContextOptions),head:()=>pageHead('Assistente de agendamento','Reserve atendimentos com preços cadastrados, horários disponíveis e sinal do salão.'),component:Page});
function Page(){const{data}=useSuspenseQuery(salonContextOptions);return <Workspace manager>{data.salon&&<BookingAssistant salonId={data.salon.id} manager/>}</Workspace>;}