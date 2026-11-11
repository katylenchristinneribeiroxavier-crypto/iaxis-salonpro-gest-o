export type OwnerLink = { to: string; title: string; desc: string };
export type OwnerBlock = { slug: string; title: string; desc: string; icon: string; links: OwnerLink[] };

export const ownerBlocks: OwnerBlock[] = [
  { slug: "funcionarias", title: "Funcionárias", desc: "Equipe, comissão e link pessoal", icon: "Users", links: [
    { to: "/funcionarios", title: "Equipe e link pessoal", desc: "Lista, adicionar funcionária e Enviar Acesso WhatsApp" },
    { to: "/profissoes", title: "Profissões", desc: "Cargos da equipe" },
  ]},
  { slug: "administracao", title: "Administração", desc: "Agenda, clientes e horários", icon: "CalendarDays", links: [
    { to: "/agenda-do-dia", title: "Agenda do dia", desc: "Atendimentos de hoje" },
    { to: "/agenda-mes", title: "Agenda do mês", desc: "Visão mensal" },
    { to: "/clientes-categorias", title: "Clientes", desc: "Cadastro e categorias" },
    { to: "/lembretes", title: "Lembretes", desc: "Avisos automáticos" },
  ]},
  { slug: "estoque", title: "Estoque", desc: "Produtos e controle", icon: "Package", links: [
    { to: "/produtos", title: "Produtos e estoque", desc: "Semáforo, usos restantes e baixa automática" },
    { to: "/fornecedores", title: "Fornecedores", desc: "Cadastro e pedido via WhatsApp" },
    { to: "/fornecedores-parceiros", title: "Pedidos por marca", desc: "Histórico de pedidos de reposição" },
  ]},
  { slug: "pedidos", title: "Pedidos", desc: "Agendamentos e lista de espera", icon: "ClipboardList", links: [
    { to: "/clientes-sinais", title: "Sinais", desc: "Pagamentos antecipados" },
  ]},
  { slug: "financeiro", title: "Financeiro", desc: "Faturamento, comissões e relatórios", icon: "Wallet", links: [
    { to: "/financeiro-comissoes", title: "Faturamento e comissões", desc: "Relatórios do salão" },
    { to: "/despesas-salao", title: "Despesas e lucro", desc: "Gastos do mês e lucro" },
  ]},
  { slug: "servicos", title: "Serviços", desc: "Cadastrar serviços e preços", icon: "Scissors", links: [
    { to: "/servicos-precos", title: "Serviços e preços", desc: "Cadastrar, editar e definir duração" },
  ]},
  { slug: "configuracoes", title: "Configurações", desc: "Dados do salão e logo", icon: "Settings", links: [
    { to: "/configuracao-loja", title: "Dados do salão e logo", desc: "Nome, cor e logotipo" },
    { to: "/configuracoes", title: "Configurações gerais", desc: "WhatsApp e preferências" },
    { to: "/minha-licenca", title: "Minha Licença", desc: "Plano, vencimento e renovação" },
    { to: "/indique-e-ganhe", title: "Indique e Ganhe", desc: "Indicações e comissões" },
  ]},
];
