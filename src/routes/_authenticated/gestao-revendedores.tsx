import { createFileRoute } from '@tanstack/react-router';
import { ReferralSales } from '@/components/Referrals';
import { Workspace } from '@/components/Workspace';
import { salonContextOptions, pageHead } from '@/lib/salon-data';
export const Route = createFileRoute('/_authenticated/gestao-revendedores')({loader: ({context}) => context.queryClient.ensureQueryData(salonContextOptions),head:()=>pageHead('Gestão de revendedores','Gestão de revendedores no IAxis SalonPRO.'),component:()=> <Workspace manager><ReferralSales/></Workspace>});
