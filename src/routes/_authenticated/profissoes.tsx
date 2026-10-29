import { createFileRoute } from '@tanstack/react-router';
import { SalonRecords } from '@/components/SalonRecords';
import { Workspace } from '@/components/Workspace';
import { salonContextOptions, pageHead } from '@/lib/salon-data';
export const Route = createFileRoute('/_authenticated/profissoes')({
  loader: ({ context }) => context.queryClient.ensureQueryData(salonContextOptions),
  head: () => pageHead('Profissões', 'Gestão de profissões do seu salão no IAxis SalonPRO.'),
  component: () => <Workspace manager><SalonRecords table="professions"/></Workspace>,
});
