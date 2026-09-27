export interface FunctionalFeature {
  id: string;
  name: string;
  description: string;
  trigger: string;
  action: string;
  expectedResult: string;
}

const FEATURE_CATALOG: Record<string, FunctionalFeature[]> = {
  blog: [
    { id: 'post-filter', name: 'Busca de artigos', description: 'Filtra artigos por texto e categoria.', trigger: 'Digite uma busca', action: 'Atualiza o feed sem recarregar', expectedResult: 'Artigos correspondentes aparecem' },
    { id: 'newsletter', name: 'Newsletter', description: 'Valida e registra o e-mail do leitor.', trigger: 'Envie o formulário', action: 'Mostra confirmação de inscrição', expectedResult: 'Leitor recebe feedback de sucesso' },
    { id: 'article-view', name: 'Leitura de artigo', description: 'Abre o conteúdo completo de um artigo.', trigger: 'Clique em ler artigo', action: 'Expande a leitura selecionada', expectedResult: 'Conteúdo completo fica disponível' }
  ],
  landing_page: [
    { id: 'landing-cta', name: 'CTA de conversão', description: 'Leva o visitante à ação principal.', trigger: 'Clique no CTA', action: 'Abre formulário ou checkout', expectedResult: 'Fluxo de conversão iniciado' },
    { id: 'lead-capture', name: 'Captura de lead', description: 'Valida contato e confirma envio.', trigger: 'Envie o formulário', action: 'Mostra sucesso e salva o contato', expectedResult: 'Lead capturado com feedback' },
    { id: 'faq-toggle', name: 'FAQ expansível', description: 'Exibe respostas sem navegação extra.', trigger: 'Clique em uma pergunta', action: 'Expande ou recolhe resposta', expectedResult: 'Dúvidas respondidas na página' }
  ],
  food_delivery: [
    { id: 'menu-filter', name: 'Filtro de categorias', description: 'Filtra itens do cardápio por categoria.', trigger: 'Clique em uma categoria', action: 'Atualiza a lista visível sem recarregar', expectedResult: 'Somente itens da categoria aparecem' },
    { id: 'cart', name: 'Carrinho reativo', description: 'Adiciona e remove produtos e recalcula o total.', trigger: 'Clique em adicionar/remover', action: 'Atualiza itens, contador e total', expectedResult: 'Carrinho reflete o pedido atual' },
    { id: 'checkout', name: 'Checkout WhatsApp', description: 'Monta uma mensagem com itens e total.', trigger: 'Clique em finalizar pedido', action: 'Abre o WhatsApp com o resumo', expectedResult: 'Pedido pronto para envio' }
  ],
  healthcare: [
    { id: 'patients', name: 'Gestão de pacientes', description: 'Exibe pacientes e permite iniciar um novo cadastro.', trigger: 'Clique em novo paciente', action: 'Abre o formulário de cadastro', expectedResult: 'Novo paciente pode ser registrado' },
    { id: 'schedule', name: 'Agenda clínica', description: 'Mostra consultas e estados de atendimento.', trigger: 'Clique em agenda', action: 'Alterna para a agenda do dia', expectedResult: 'Consultas ficam visíveis e filtráveis' },
    { id: 'records', name: 'Prontuário digital', description: 'Permite acessar o histórico do paciente.', trigger: 'Clique em ver prontuário', action: 'Abre o histórico clínico', expectedResult: 'Histórico do paciente é exibido' }
  ],
  fitness: [
    { id: 'workout-timer', name: 'Cronômetro de treino', description: 'Inicia, pausa e zera o cronômetro da sessão.', trigger: 'Clique em iniciar/pausar/zerar', action: 'Atualiza o tempo em tempo real', expectedResult: 'Tempo da sessão permanece consistente' },
    { id: 'exercise-log', name: 'Histórico de séries', description: 'Registra exercícios, séries, repetições e carga.', trigger: 'Clique em registrar série', action: 'Adiciona a série ao histórico', expectedResult: 'Histórico atualizado sem recarregar' },
    { id: 'workout-plan', name: 'Ficha de exercícios', description: 'Organiza a ficha por grupos musculares.', trigger: 'Selecione um grupo muscular', action: 'Filtra exercícios da ficha', expectedResult: 'Exercícios relevantes aparecem' }
  ],
  beverage_delivery: [
    { id: 'catalog', name: 'Catálogo de bebidas', description: 'Exibe produtos por categoria.', trigger: 'Selecione uma categoria', action: 'Filtra produtos', expectedResult: 'Catálogo atualizado' },
    { id: 'quick-cart', name: 'Carrinho rápido', description: 'Calcula quantidades e total do pedido.', trigger: 'Adicione um produto', action: 'Atualiza carrinho e total', expectedResult: 'Pedido pronto para checkout' },
    { id: 'delivery-checkout', name: 'Checkout expresso', description: 'Envia o pedido para o canal de atendimento.', trigger: 'Finalize o pedido', action: 'Gera o resumo do pedido', expectedResult: 'Pedido encaminhado' }
  ],
  b2b_saas: [
    { id: 'dashboard', name: 'Dashboard de métricas', description: 'Apresenta indicadores operacionais.', trigger: 'Abra o dashboard', action: 'Calcula e exibe métricas', expectedResult: 'KPIs visíveis e atualizados' },
    { id: 'records', name: 'Gestão de registros', description: 'Lista e pesquisa registros do sistema.', trigger: 'Digite uma busca', action: 'Filtra registros em tempo real', expectedResult: 'Resultados correspondentes aparecem' },
    { id: 'profile', name: 'Perfis de usuário', description: 'Controla dados do perfil ativo.', trigger: 'Abra o perfil', action: 'Exibe dados e preferências', expectedResult: 'Perfil pode ser consultado' }
  ]
};

const GENERIC_FEATURES: FunctionalFeature[] = [
  { id: 'primary-action', name: 'Ação principal', description: 'Executa a ação principal do produto.', trigger: 'Clique no CTA principal', action: 'Atualiza o estado da aplicação', expectedResult: 'Usuário recebe feedback visual' },
  { id: 'contact', name: 'Contato', description: 'Permite iniciar uma conversa comercial.', trigger: 'Envio do formulário', action: 'Valida os campos e confirma o envio', expectedResult: 'Mensagem de sucesso aparece' },
  { id: 'responsive-navigation', name: 'Navegação responsiva', description: 'Adapta a navegação a telas pequenas.', trigger: 'Redimensione a janela', action: 'Reorganiza menus e conteúdo', expectedResult: 'Não existe rolagem horizontal' }
];

export class FunctionalFeaturePlanner {
  public planFeatures(domain: string): FunctionalFeature[] {
    return (FEATURE_CATALOG[domain] || GENERIC_FEATURES).map(feature => ({ ...feature }));
  }
}
