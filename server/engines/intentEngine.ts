import { IntentContract } from '../../src/types/engrenagem.ts';

export function analyzeIntent(prompt: string, currentContract?: IntentContract): IntentContract {
  const p = prompt.toLowerCase();

  // Detection for Dental / Clinic
  const isDental = p.includes('odonto') || p.includes('dentist') || p.includes('dente') || p.includes('clínica') || p.includes('saúde');
  // Detection for Burger / Restaurant / Food
  const isBurger = p.includes('hamburguer') || p.includes('burger') || p.includes('lanche') || p.includes('restaurante') || p.includes('delivery');
  // Detection for Adega / Drinks
  const isAdega = p.includes('adega') || p.includes('bebida') || p.includes('cerveja') || p.includes('vinho') || p.includes('gelo') || p.includes('carvão');
  // Detection for Gym / Fitness
  const isGym = p.includes('academia') || p.includes('fitness') || p.includes('treino') || p.includes('gym');
  // Detection for SaaS / Software
  const isSaaS = p.includes('saas') || p.includes('crm') || p.includes('dashboard') || p.includes('sistema');
  const isBlog = /\b(blog|artigos|not[ií]cias|conte[uú]do|revista)\b/i.test(p);
  const isLanding = /landing\s*page|p[aá]gina de vendas|p[aá]gina de captura|one\s*page|p[aá]gina comercial/i.test(p);

  let domain = 'general';
  let projectType: IntentContract['projectType'] = 'website';
  let businessType = 'negocio_geral';
  let businessName = 'Minha Empresa';
  let requiredFeatures = ['Seção Hero de Alto Impacto', 'Apresentação de Serviços', 'Formulário de Contato', 'Rodapé Institucional'];
  let visualConcepts = ['moderno', 'responsivo', 'elegante', 'alta conversão'];
  let requiredAssets = ['hero_banner', 'services_icons', 'about_photo'];
  let forbiddenAssets = ['low_quality', 'broken_links'];
  let primaryGoal = 'Converter visitantes em clientes e otimizar operações';
  let colorPalette = {
    primary: '#2563EB',
    secondary: '#1E293B',
    accent: '#38BDF8',
    background: '#0B0F19',
    text: '#F8FAFC'
  };

  // Extract name if provided
  const nameMatch = prompt.match(/(?:chamad[ao]|nome(?:\s+é)?|para a?)\s+["'«]?([A-Za-z0-9\s]{3,30}?)(?:["'»]|\s+com|\s+que|,|\.|$)/i);
  if (nameMatch && nameMatch[1]) {
    businessName = nameMatch[1].trim();
  }

  if (isBlog) {
    domain = 'blog';
    projectType = 'blog';
    businessType = 'publicacao_conteudo';
    businessName = 'Meu Blog';
    requiredFeatures = ['Feed de artigos', 'Busca e filtros por categoria', 'Página de leitura', 'Newsletter', 'Compartilhamento social'];
    visualConcepts = ['editorial', 'legível', 'conteúdo', 'moderno', 'responsivo'];
    requiredAssets = ['editorial_cover', 'author_portrait', 'article_illustration'];
  } else if (isLanding) {
    domain = 'landing_page';
    projectType = 'landing_page';
    businessType = 'pagina_comercial';
    businessName = 'Minha Oferta';
    requiredFeatures = ['Hero com proposta de valor', 'Benefícios e prova social', 'CTA de conversão', 'Formulário de captura', 'FAQ'];
    visualConcepts = ['alta conversão', 'clareza', 'impacto', 'mobile-first', 'velocidade'];
    requiredAssets = ['hero_banner', 'product_mockup', 'social_proof'];
  } else if (isBurger) {
    domain = 'food_delivery';
    projectType = 'delivery';
    businessType = 'hamburgueria_artesanal';
    if (businessName === 'Minha Empresa') businessName = 'Burger House';
    requiredFeatures = [
      'Cardápio Interativo com Categorias',
      'Carrinho de Compras em Tempo Real',
      'Botão de Pedido Direto via WhatsApp',
      'Seleção de Adicionais e Ponto da Carne',
      'Informações de Entrega e Horários'
    ];
    visualConcepts = ['artesanal', 'apetitoso', 'dark_theme', 'hambúrguer suculento', 'fogo e grelha'];
    requiredAssets = ['burgers', 'french_fries', 'craft_soda', 'chef_grill', 'delivery_bag'];
    forbiddenAssets = ['medical', 'hospital', 'dentist', 'clinic', 'pharma', 'gym', 'carvão_industrial'];
    colorPalette = {
      primary: '#F97316',
      secondary: '#1C1917',
      accent: '#EAB308',
      background: '#0C0A09',
      text: '#FAFAF9'
    };
  } else if (isDental) {
    domain = 'healthcare';
    projectType = 'saas';
    businessType = 'clinica_odontologica';
    if (businessName === 'Minha Empresa') businessName = 'DentalCare Pro';
    requiredFeatures = [
      'Painel de Gestão e Dashboard Clínico',
      'Cadastro e Lista de Pacientes',
      'Agenda de Consultas e Procedimentos',
      'Prontuário Odontológico Digital',
      'Histórico de Tratamentos e Orçamentos'
    ];
    visualConcepts = ['saúde', 'confiança', 'limpo', 'tecnológico', 'sorrisos saudáveis'];
    requiredAssets = ['dentist_doctor', 'patient_smile', 'dental_clinic', 'medical_equipment', 'clean_dashboard'];
    forbiddenAssets = ['alcohol', 'beer', 'wine', 'fast_food', 'burger', 'barbecue', 'nightclub'];
    colorPalette = {
      primary: '#0EA5E9',
      secondary: '#0F172A',
      accent: '#14B8A6',
      background: '#04101E',
      text: '#F0F9FF'
    };
  } else if (isAdega) {
    domain = 'beverage_delivery';
    projectType = 'ecommerce';
    businessType = 'adega_conveniencia';
    if (businessName === 'Minha Empresa') businessName = 'Adega Express';
    requiredFeatures = [
      'Catálogo de Bebidas (Cervejas, Vinhos, Destilados)',
      'Seção de Gelo, Carvão e Copos Descartáveis',
      'Carrinho Rápido com Cálculo de Quantidade',
      'Checkout Express para WhatsApp',
      'Entrega Noturna e Áreas de Atendimento'
    ];
    visualConcepts = ['gelada', 'noite', 'conveniência rápida', 'celebração', 'premium'];
    requiredAssets = ['wine_bottles', 'craft_beer', 'ice_bags', 'charcoal_bbq', 'cups_party'];
    forbiddenAssets = ['medical', 'dentist', 'pharma', 'hospital'];
    colorPalette = {
      primary: '#D97706',
      secondary: '#18181B',
      accent: '#8B5CF6',
      background: '#09090B',
      text: '#F4F4F5'
    };
  } else if (isGym) {
    domain = 'fitness';
    projectType = 'website';
    businessType = 'academia_fitness';
    if (businessName === 'Minha Empresa') businessName = 'IronFit Academia';
    requiredFeatures = [
      'Planos de Matrícula (Mensal, Semestral, VIP)',
      'Grade de Horários e Aulas Coletivas',
      'Conheça Nossos Treinadores',
      'Tour Virtual pelo Espaço de Musculação',
      'Agendamento de Aula Experimental Grátis'
    ];
    visualConcepts = ['energia', 'força', 'saúde', 'alta performance', 'motivação'];
    requiredAssets = ['gym_workout', 'dumbbells_weights', 'trainer_coach', 'fitness_athlete'];
    forbiddenAssets = ['beer', 'junk_food', 'hospital_bed', 'dental_drill'];
    colorPalette = {
      primary: '#EF4444',
      secondary: '#18181B',
      accent: '#EAB308',
      background: '#09090B',
      text: '#FAFAFA'
    };
  } else if (isSaaS) {
    domain = 'b2b_saas';
    projectType = 'saas';
    businessType = 'software_plataforma';
    requiredFeatures = [
      'Dashboard com Métricas em Tempo Real',
      'Gestão de Leads e Clientes (CRM)',
      'Tabela de Preços e Planos',
      'Autenticação e Perfis de Usuário',
      'Gráficos de Faturamento e Conversão'
    ];
    visualConcepts = ['saas', 'moderno', 'b2b', 'produtividade', 'alta tecnologia'];
    colorPalette = {
      primary: '#6366F1',
      secondary: '#0F172A',
      accent: '#10B981',
      background: '#030712',
      text: '#F9FAFB'
    };
  }

  // Um pedido explícito de SaaS mantém o nicho visual, mas muda o produto para plataforma.
  // Isso evita que “SaaS para academias” seja reduzido a uma landing page fitness.
  if (isSaaS && domain !== 'general') {
    projectType = 'saas';
    primaryGoal = 'Gerenciar operações do nicho em um painel interativo e converter usuários em clientes';
  }

  return {
    projectType,
    businessType,
    businessName,
    domain,
    targetAudience: 'Clientes exigentes e usuários digitais',
    primaryGoal,
    requiredFeatures,
    visualConcepts,
    requiredAssets,
    forbiddenAssets,
    colorPalette,
    responsiveRequired: true,
    mobileRequired: true,
    desktopRequired: true
  };
}
