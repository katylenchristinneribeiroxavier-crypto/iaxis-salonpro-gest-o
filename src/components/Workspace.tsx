import { useSuspenseQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import type { ReactNode } from 'react';
import { salonContextOptions } from '@/lib/salon-data';
import { Shell } from './Shell';
import { SalonAccessGate } from './SalonAccessGate';
export const workspaceNav = [
  { to: '/agenda-do-dia', label: 'Agenda do dia' }, { to: '/agenda-mes', label: 'Agenda do mês' },
  { to: '/chat-equipe', label: 'Chat da equipe' },
  { to: '/gestao-salao', label: 'Gestão integrada' },
  { to: '/mensagens', label: 'Mensagens WhatsApp' },
  { to: '/minhas-comissoes', label: 'Minhas comissões' },
  { to: '/configuracao-loja', label: 'Meu salão' }, { to: '/configurar-secretaria', label: 'Secretária virtual' },
  { to: '/profissoes', label: 'Profissões' }, { to: '/funcionarios', label: 'Funcionários' },
  { to: '/servicos-precos', label: 'Serviços e preços' }, { to: '/financeiro-comissoes', label: 'Financeiro e comissões' },
  { to: '/sinais', label: 'Sinais' }, { to: '/clientes-sinais', label: 'Clientes e sinais' },
  { to: '/clientes-categorias', label: 'Clientes' }, { to: '/fornecedores-parceiros', label: 'Fornecedores' },
  { to: '/configuracoes', label: 'Configurações e WhatsApp' }, { to: '/gestao-revendedores', label: 'Revendas' },
  { to: '/suporte', label: 'Suporte técnico' }, { to: '/meus-chamados', label: 'Meus chamados' }, { to: '/salao', label: 'Todas as pastas' },
];
export function Workspace({ children, manager = false }: { children: ReactNode; manager?: boolean }) {
  const { data } = useSuspenseQuery(salonContextOptions);
  const nav = data.manager ? workspaceNav : workspaceNav.slice(0, 3).concat({ to: '/suporte', label: 'Suporte técnico' }, { to: '/meus-chamados', label: 'Meus chamados' });
  return <Shell role={data.salon?.name || 'Meu salão'} nav={nav}>
    <SalonAccessGate>{!data.salon ? <div><h1 className="text-3xl">Nenhum salão vinculado</h1><Link to="/auth" className="text-gold">Acessar outra conta</Link></div> : manager && !data.manager ? <h1 className="text-3xl">Acesso restrito à administração do salão</h1> : children}</SalonAccessGate>
  </Shell>;
}