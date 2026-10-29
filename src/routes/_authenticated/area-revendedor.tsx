import {createFileRoute} from '@tanstack/react-router';
import {ReferralSales} from '@/components/Referrals';
import {Shell} from '@/components/Shell';
import {RoleGate} from '@/components/RoleGate';
import {pageHead} from '@/lib/salon-data';
import {ResellerGrowth} from '@/components/ResellerGrowth';
export const Route=createFileRoute('/_authenticated/area-revendedor')({head:()=>pageHead('Minha área de revendedor','Vendas validadas, comissões e planos de ação com IA para conquistar novos salões.'),component:()=> <RoleGate role="revendedor"><Shell role="Revendedor" nav={[{to:'/area-revendedor',label:'Vendas, metas e leads'},{to:'/revendedor/codigos',label:'Códigos de venda'},{to:'/suporte',label:'Suporte técnico'}]}><ReferralSales reseller/><ResellerGrowth/></Shell></RoleGate>});