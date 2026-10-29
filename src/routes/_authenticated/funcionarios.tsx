import { createFileRoute } from '@tanstack/react-router';
import { SalonRecords } from '@/components/SalonRecords';
import { Workspace } from '@/components/Workspace';
import { salonContextOptions, pageHead } from '@/lib/salon-data';
import { StaffInvite } from '@/components/StaffInvite';
export const Route = createFileRoute('/_authenticated/funcionarios')({
  loader: ({ context }) => context.queryClient.ensureQueryData(salonContextOptions),
  head: () => pageHead('Funcionários', 'Gestão de funcionários do seu salão no IAxis SalonPRO.'),
  component: () => <Workspace manager><SalonRecords table="professionals"/><StaffInvite/></Workspace>,
});
