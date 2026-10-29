import {createFileRoute} from '@tanstack/react-router';
import {SupportConfig} from '@/components/Support';
import {Shell} from '@/components/Shell';
import {RoleGate} from '@/components/RoleGate';
import {pageHead} from '@/lib/salon-data';
export const Route=createFileRoute('/_authenticated/configuracao-suporte')({head:()=>pageHead('Configuração do suporte','Suporte técnico da plataforma IAxis SalonPRO.'),component:()=> <RoleGate role="super_admin"><Shell role="Super Admin" nav={[{to:'/admin',label:'Painel Master'},{to:'/configuracao-suporte',label:'Configurar suporte'},{to:'/tickets-suporte',label:'Tickets'}]}><SupportConfig/></Shell></RoleGate>});
