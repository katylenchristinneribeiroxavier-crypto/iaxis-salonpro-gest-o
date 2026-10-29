import {createFileRoute} from '@tanstack/react-router';
import {SupportTickets} from '@/components/Support';
import {Shell} from '@/components/Shell';
import {RoleGate} from '@/components/RoleGate';
import {pageHead} from '@/lib/salon-data';
export const Route=createFileRoute('/_authenticated/tickets-suporte')({head:()=>pageHead('Tickets de suporte','Suporte técnico da plataforma IAxis SalonPRO.'),component:()=> <RoleGate role="super_admin"><Shell role="Super Admin" nav={[{to:'/admin',label:'Painel Master'},{to:'/configuracao-suporte',label:'Configurar suporte'},{to:'/tickets-suporte',label:'Tickets'}]}><SupportTickets/></Shell></RoleGate>});
