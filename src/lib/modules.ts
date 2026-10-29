export type Topic = { title: string; desc: string };
export type Folder = { slug: string; title: string; icon: string; desc: string; topics: Topic[] };

export const salaoFolders: Folder[] = [
  { slug: "agendamento", title: "Agendamento", icon: "CalendarDays", desc: "A base do sistema", topics: [
    { title: "Agenda Online", desc: "PC e celular, bloqueio automático de horário sem choque." },
    { title: "Agenda por Profissional", desc: "Calendário próprio com horários, serviços e comissões." },
    { title: "Agendamento 24h", desc: "Link para Instagram, Facebook, Google e site." },
    { title: "Pagamento Online", desc: "Cliente paga 100% no ato do agendamento." },
    { title: "Cobrança de Sinal", desc: "Sinal de 30% retido como garantia contra faltas." },
    { title: "Status de Comandas", desc: "Chegou, em atendimento, finalizado." },
    { title: "Recorrência", desc: "Clientes fixos agendados toda semana." },
    { title: "Site de Agendamento", desc: "Site com o nome do seu salão." },
    { title: "Clube de Assinaturas", desc: "Ex: Clube da Loira R$ 199/mês com 2 hidratações." },
    { title: "Módulo Cashback", desc: "Gastou R$100, ganha R$10 para usar depois." },
    { title: "Backup na Nuvem", desc: "Dados sempre salvos, mesmo se perder o celular." },
  ]},
  { slug: "automacao", title: "Automação e Marketing", icon: "Bot", desc: "Marketing inteligente", topics: [
    { title: "WhatsApp API Oficial", desc: "Robô confirma horário e cancela se não responder." },
    { title: "Lembretes WhatsApp e SMS", desc: "Confirmação automática, reduz faltas." },
    { title: "Campanhas Inteligentes", desc: "Identifica cliente sumido há 60 dias e envia promoção." },
    { title: "IA Avançada", desc: "Responde, recupera clientes e sugere promoções." },
    { title: "Pós-atendimento", desc: "3 dias depois: “amou o resultado?” + pacote de retorno." },
    { title: "CRM no Chrome", desc: "Centraliza conversas do WhatsApp e converte em venda." },
  ]},
  { slug: "operacao", title: "Operação", icon: "Scissors", desc: "O dia a dia do salão", topics: [
    { title: "Comandas Eletrônicas", desc: "Serviço + produto, fecha direto no caixa." },
    { title: "Estoque Fracionado", desc: "1L por R$200, usou 100ml = R$20 de custo." },
    { title: "Alerta de Baixa", desc: "Avisa quando o produto está acabando." },
    { title: "Comissões Automáticas", desc: "Por serviço, produto, auxiliar e escalonada." },
    { title: "Pacotes", desc: "10 depilações: usou 3, faltam 7." },
    { title: "Vendas por Assinatura", desc: "Cobrança recorrente no cartão." },
    { title: "API", desc: "Integração com site, automações e outros sistemas." },
  ]},
  { slug: "financeiro", title: "Financeiro", icon: "Wallet", desc: "O dinheiro não se perde", topics: [
    { title: "Entradas e Saídas", desc: "Lançamento automático a cada agendamento." },
    { title: "Contas a Pagar e Receber", desc: "Vencimentos e previsões." },
    { title: "Fluxo de Caixa", desc: "Diário e mensal: entrou, saiu, a receber." },
    { title: "Fechamento de Caixa", desc: "Abertura, fechamento, sangria, dinheiro/pix/cartão." },
    { title: "Controle de Cartão", desc: "Taxa da maquininha, valor líquido e data de recebimento." },
    { title: "Painel Financeiro", desc: "Gráficos de recebíveis parcelados e taxas." },
    { title: "Importação de XML", desc: "Nota fiscal atualiza estoque e financeiro." },
    { title: "Notas Fiscais", desc: "NFC-e, NFS-e e NF-e conforme a Lei do Salão Parceiro." },
  ]},
  { slug: "clientes", title: "Clientes e Comunicação", icon: "Users", desc: "CRM completo", topics: [
    { title: "CRM e Histórico", desc: "Quando veio, o que fez, quanto pagou, alergias." },
    { title: "Fotos Antes/Depois", desc: "Imagens e arquivos no cadastro do cliente." },
    { title: "Anamneses", desc: "Fichas personalizadas com assinatura digital." },
    { title: "Gerador de Documentos", desc: "Contrato, termo, ficha, promissória." },
    { title: "Envio em Massa", desc: "WhatsApp e SMS para listas segmentadas." },
    { title: "Automações de Mensagens", desc: "Aniversário com cupom, “sentimos sua falta”." },
    { title: "Promoções e Cupons", desc: "Crie cupons de desconto." },
    { title: "Campanhas de Marketing", desc: "Segmentação completa (Premium)." },
  ]},
  { slug: "escala", title: "Escala e Inteligência", icon: "Sparkles", desc: "Cresça com IA", topics: [
    { title: "Assistente de IA", desc: "Atende seu WhatsApp 24h." },
    { title: "Relatórios Visuais", desc: "Financeiro, clientes, comissões, vendas, pacotes." },
    { title: "Insights com IA", desc: "Mostra onde você pode crescer." },
    { title: "Metas de Profissionais", desc: "Defina metas e acompanhe o desempenho." },
    { title: "Marketing em Escala", desc: "Envios sem bloqueio." },
    { title: "Gerente de Contas", desc: "Especialista dedicado (planos maiores)." },
  ]},
  { slug: "mobilidade", title: "Mobilidade e Sucesso", icon: "Smartphone", desc: "Apps e suporte", topics: [
    { title: "App SalonPRO", desc: "Gestor e profissional no celular." },
    { title: "App com Sua Marca", desc: "White-label com logo e cores do salão." },
    { title: "Treinamento de Boas-Vindas", desc: "Onboarding guiado." },
    { title: "Suporte Humanizado", desc: "Gente de verdade para te ajudar." },
  ]},
];

export const planos = [
  { nome: "Básico", preco: 97, recursos: ["Agenda", "Financeiro", "Clientes"] },
  { nome: "Pro", preco: 197, recursos: ["Tudo do Básico", "Estoque", "Comissões", "Pacotes", "NF"] },
  { nome: "Premium", preco: 297, recursos: ["Tudo do Pro", "WhatsApp API", "IA", "Campanhas", "Gerente"] },
];

export const saloes = [
  { nome: "Studio Bella", cidade: "São Paulo/SP", plano: "Premium", status: "Ativo", revendedor: "João Salvador" },
  { nome: "Espaço Glamour", cidade: "Salvador/BA", plano: "Pro", status: "Ativo", revendedor: "João Salvador" },
  { nome: "Salão Diva", cidade: "Recife/PE", plano: "Básico", status: "Inadimplente", revendedor: "—" },
  { nome: "Beauty Lounge", cidade: "Curitiba/PR", plano: "Pro", status: "Ativo", revendedor: "Maria Sul" },
  { nome: "Charme Hair", cidade: "BH/MG", plano: "Premium", status: "Bloqueado", revendedor: "—" },
];

export const agendaHoje = [
  { hora: "09:00", cliente: "Ana Souza", servico: "Escova", prof: "Carla", status: "Finalizado" },
  { hora: "10:30", cliente: "Bruna Lima", servico: "Luzes", prof: "Carla", status: "Em atendimento" },
  { hora: "11:00", cliente: "Júlia Reis", servico: "Manicure", prof: "Paula", status: "Chegou" },
  { hora: "14:00", cliente: "Fernanda Alves", servico: "Progressiva", prof: "Carla", status: "Confirmado" },
  { hora: "16:00", cliente: "Larissa Melo", servico: "Design de sobrancelha", prof: "Rita", status: "Aguardando" },
];
