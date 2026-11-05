import { createFileRoute } from '@tanstack/react-router';
import { IdentitySettings } from '@/components/IdentitySettings';
import { ConfigSinalAgendamento } from '@/components/ConfigSinalAgendamento';
import { ConfigHorario } from '@/components/ConfigHorario';
import { AboutSystem } from '@/components/AboutSystem';
import { Workspace } from '@/components/Workspace';
import { salonContextOptions, pageHead } from '@/lib/salon-data';
export const Route = createFileRoute('/_authenticated/configuracao-loja')({
  loader: ({ context }) => context.queryClient.ensureQueryData(salonContextOptions),
  head: () => pageHead('Configuração do salão', 'Gestão de configuração do salão do seu salão no IAxis SalonPRO.'),
  component: () => <Workspace manager><IdentitySettings /><ConfigHorario /><ConfigSinalAgendamento /><AboutSystem /></Workspace>,
});
