# IAxis SalonPRO — módulos completos e nomes dinâmicos

## Resultado
Transformar os quatro documentos em áreas funcionais de gestão, mantendo as contas, salões, planos, pagamento PIX e códigos de venda existentes. Tudo em PT-BR, com preto, azul-marinho e dourado na plataforma; a área pública do salão usa sua marca cadastrada.

## 1. Marca e secretária virtual
- Criar `/configuracao-loja` e `/configurar-secretaria`, com nome do salão, logo, cor, nome do agente, gênero e pronomes.
- Novos campos de nome começam vazios; preservar nomes reais já cadastrados.
- A prévia acompanha o que a dona digita. Vazia: “Oi, eu sou o/a [NOME QUE VOCÊ DIGITAR], eu sou o/a secretário(a) da [NOME DO SEU SALÃO]”.
- Apresentação gerada com dados salvos, nunca nomes didáticos: “Oi, eu sou o Júlio, eu sou o secretário do Studio Ana” e “Oi, eu sou a Júlia, eu sou a secretária do Espaço Jéssica”. O tratamento do salão será configurável para não adivinhar seu gênero pelo nome.
- Impedir atendimento automático antes de preencher os nomes. A identidade será de assistente virtual, sem fingir ser uma pessoa real.

## 2. Equipe, agenda e comissões
- Criar `/profissoes`, `/funcionarios` e `/servicos-precos`, com cadastros ilimitados e fotos.
- Conta de profissional criada ou convidada pela dona; acesso administrativo limitado ao salão, sem poder elevar alguém a Super Admin.
- Comissão individual obrigatória, entre 0 e 100%, sem percentual pré-preenchido.
- `/agenda-do-dia`: dona vê seu salão; profissional vê e modifica apenas seus próprios atendimentos. Chegada avisa o profissional no `/chat-equipe` em tempo real.
- Ao concluir, salvar total, percentual aplicado, comissão e parcela do salão. Repetir a conclusão não duplica valores; mudanças posteriores no percentual não reescrevem o histórico.
- `/minhas-comissoes` e `/financeiro-comissoes`: filtros mensais, totais, ranking e fechamento com relatório exportável.

## 3. Clientes e fornecedores
- `/clientes-categorias`: cadastro, histórico, aniversário, visitas, categorias, contadores e gráfico; VIP acima de 10 visitas.
- Até 30 dias sem visita: assídua; 31–60: pouco frequente; acima de 60: afastada.
- `/fornecedores-parceiros`: marcas, responsáveis, contatos, produtos e pedidos com quantidade/unidade, histórico e envio ao fornecedor.
- `/conexao-whatsapp`: configuração protegida, QR e status real, sem expor credenciais nas páginas públicas.

## 4. Agendamento público e automações
- `/agendar/$salao_id`: marca do salão, serviços, disponibilidade e conversa com a secretária; sem login obrigatório para o cliente.
- Secretária consulta horários e agenda, remarca ou cancela apenas depois de identificar o cliente e verificar sua autorização. Não disponibilizar dados de outros clientes pelo chat.
- Guardar conversas, correções da dona e histórico por salão. Incluir envio de áudio, transcrição e resposta conforme suporte disponível do provedor.
- Bloquear conflitos de horário também no armazenamento, não apenas na tela.
- Fila de mensagens com prevenção de duplicação, histórico de envio e falhas: aniversários às 07:00, retorno às 09:00 e lembrete uma hora antes, considerando horário do salão e consentimento do cliente.

## 5. Suporte da desenvolvedora
- `/configuracao-suporte`: Super Admin preenche uma vez WhatsApp, e-mail e nome do suporte; contatos começam vazios.
- `/suporte` e botão de suporte nas áreas do salão, profissional e cliente: nome opcional, contato e mensagem.
- Salvar ticket mesmo quando um envio externo falhar; informar separadamente recebimento do chamado e confirmação do encaminhamento.
- `/tickets-suporte`: Super Admin acompanha todos os salões, filtra e resolve chamados.

## 6. Revendedores e pagamentos
- Preservar códigos de venda atuais e ampliar `/area-revendedor`, `/tornar-se-revendedor` e `/gestao-revendedores` com link individual, compartilhamento, histórico e totais.
- Comissão padrão de 20%; usar percentual vigente na venda e guardar o valor calculado.
- Cadastro/validação de código comprova indicação, mas comissão financeira nasce apenas de venda/pagamento confirmado, sem duplicação ou autoindicação.
- Notificações imediatas na tela, com nomes reais; WhatsApp/e-mail quando configurados. Marcar comissão paga atualiza o histórico sem apagar a venda.
- Manter PIX e preços atuais. Adicionar `/pagamento` para cartão via Stripe sem substituir o PIX; confirmação confiável ativa a assinatura, e status pendente/cancelado limita o acesso sem impedir pagamento e suporte.

## Detalhes técnicos
- Reutilizar as entidades atuais, com alterações aditivas e compatibilidade para URLs antigas, em vez de recriar salões e perder vínculos. Os nomes técnicos dos documentos serão mapeados para a estrutura existente quando equivalente.
- Acrescentar configuração da secretária por salão com nomes vazios por padrão; nenhuma menção fixa a nomes de exemplo nos prompts ou mensagens.
- Usar funções de servidor do TanStack para lógica interna e endpoints autenticados/verificados para callbacks; não criar novas Edge Functions neste projeto.
- Aplicar permissões no armazenamento e servidor: Super Admin, revendedor, dona, administrador local, profissional e cliente com escopo correto. Uma seleção na tela nunca concede privilégios.
- Proteger dados pessoais, contatos e configuração WhatsApp; publicar somente nome, logo, serviços e informações seguras necessárias ao agendamento.
- Alterações de conclusão, comissões e indicação serão transacionais e idempotentes. Atualizações ao vivo terão assinatura única e encerramento ao sair da tela.
- Testar regras financeiras, limites de acesso, categorias, nomes/gêneros, ocupação de horários e duplicação; verificar fluxos com contas reais e telas em tamanhos diferentes.

## Dependências externas
WhatsApp exige uma instância Evolution acessível e autorizada; envio de e-mail de suporte exige serviço remetente configurado; cartão exige conexão Stripe. Configuração e credenciais serão solicitadas de forma segura quando necessárias. Sem elas, cadastros, tickets e histórico funcionam, mas envios externos e cobrança não serão apresentados como concluídos. Uso de IA e envios externos podem gerar custos de serviço.

## Ordem de entrega
1. Identidade, secretária e base segura da equipe.
2. Cadastros, agenda, chat e comissões.
3. Clientes, fornecedores, suporte e revendedores.
4. Agendamento público, IA, pagamentos e mensagens automáticas.
5. Testes dos fluxos e revisão final de permissões e nomes dinâmicos.