import {createFileRoute} from '@tanstack/react-router';
import {ReferralSales} from '@/components/Referrals';
import {Shell} from '@/components/Shell';
import {RoleGate} from '@/components/RoleGate';
import {pageHead} from '@/lib/salon-data';
export const Route=createFileRoute('/_authenticated/area-revendedor')({head:()=>pageHead('Minha área de revendedor','Vendas confirmadas e comissões do revendedor.'),component:()=> <RoleGate role="revendedor"><Shell role="Revendedor" nav={[{to:'/area-revendedor',label:'Vendas e comissões'},{to:'/revendedor/codigos',label:'Códigos de venda'},{to:'/suporte',label:'Suporte técnico'}]}><ReferralSales reseller/></Shell></RoleGate>});