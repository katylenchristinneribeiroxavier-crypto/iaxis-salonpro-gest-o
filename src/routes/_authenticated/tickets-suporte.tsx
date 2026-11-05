import {createFileRoute} from '@tanstack/react-router';
import {SupportInbox} from '@/components/SupportInbox';
import {supportTicketsOptions} from '@/lib/support-data';
import {Shell} from '@/components/Shell';
import {RoleGate} from '@/components/RoleGate';
import {pageHead} from '@/lib/salon-data';
export const Route=createFileRoute('/_authenticated/tickets-suporte')({loader:({context})=>context.queryClient.ensureQueryData(supportTicketsOptions(true)),head:()=>pageHead('Central de suporte master','Respostas e acompanhamento dos chamados exclusivos da desenvolvedora IAxis SalonPRO.'),component:()=> <RoleGate role="super_admin"><Shell role="Desenvolvedora Master" nav={[{to:'/master-desenvolvedora',label:'Controle de acesso'},{to:'/master-automacoes',label:'Central de automações'},{to:'/configuracao-suporte',label:'Configurar suporte'},{to:'/tickets-suporte',label:'Chamados'}]}><SupportInbox master/></Shell></RoleGate>});
