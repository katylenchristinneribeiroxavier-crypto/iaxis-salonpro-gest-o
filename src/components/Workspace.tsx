import { useSuspenseQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import type { ReactNode } from 'react';
import { salonContextOptions } from '@/lib/salon-data';
import { Shell } from './Shell';
import { SalonAccessGate } from './SalonAccessGate';
import { Button } from './ui/button';
export const workspaceNav = [
  { to: '/assistente-agendamento', label: 'Assistente de agendamento' }, { to: '/lembretes', label: 'Lembretes e atendimento' },
  { to: '/agenda-do-dia', label: 'Agenda do dia' }, { to: '/agenda-mes', label: 'Agenda do mês' },
  { to: '/chat-equipe', label: 'Chat da equipe' },
  { to: '/gestao-salao', label: 'Gestão integrada' },
  { to: '/mensagens', label: 'Mensagens WhatsApp' },
  { to: '/minhas-comissoes', label: 'Minhas comissões' },
  { to: '/configuracao-loja', label: 'Meu salão' }, { to: '/configurar-secretaria', label: 'Secretária virtual' },
  { to: '/profissoes', label: 'Profissões' }, { to: '/funcionarios', label: 'Funcionários' },
  { to: '/servicos-precos', label: 'Serviços e preços' }, { to: '/financeiro-comissoes', label: 'Financeiro e comissões' }, { to: '/despesas-salao', label: 'Despesas do salão' },
  { to: '/sinais', label: 'Sinais' }, { to: '/clientes-sinais', label: 'Clientes e sinais' },
  { to: '/clientes-categorias', label: 'Clientes' }, { to: '/fornecedores', label: 'Fornecedores' }, { to: '/produtos', label: 'Produtos e estoque' },
  { to: '/configuracoes', label: 'Configurações e WhatsApp' }, { to: '/minha-licenca', label: 'Minha Licença' }, { to: '/despesas', label: 'Despesas' }, { to: '/gestao-revendedores', label: 'Revendas' },
  { to: '/suporte', label: 'Suporte técnico' }, { to: '/meus-chamados', label: 'Meus chamados' }, { to: '/salao', label: 'Todas as pastas' },
];
export function Workspace({ children, manager = false }: { children: ReactNode; manager?: boolean }) {
  const { data } = useSuspenseQuery(salonContextOptions);
  const nav = data.manager ? workspaceNav : workspaceNav.filter(n=>['/agenda-do-dia','/agenda-mes','/chat-equipe','/minhas-comissoes','/suporte','/meus-chamados'].includes(n.to));
  return <Shell role={data.salon?.name || 'Meu salão'} nav={nav}>
    <SalonAccessGate>{!data.salon ? <div><h1 className="text-3xl">Aguardando sua compra</h1><p className="my-4 text-muted-foreground">Seu salão será criado após a confirmação da compra do app.</p><Button asChild><Link to="/assinar">Adquirir o app</Link></Button></div> : manager && !data.manager ? <h1 className="text-3xl">Acesso restrito à administração do salão</h1> : children}</SalonAccessGate>
  </Shell>;
}