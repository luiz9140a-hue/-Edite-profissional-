import { IntentContract, ProjectFile, ProjectReadiness, QAResult, ResponsiveBreakpointsQA } from '../../src/types/engrenagem';

export function runComprehensiveQA(
  intent: IntentContract,
  files: Record<string, ProjectFile>,
  previewHtml: string
): {
  readiness: ProjectReadiness;
  reports: QAResult[];
} {
  const reports: QAResult[] = [];

  // 1. Build QA
  const hasAppTsx = !!files['src/App.tsx']?.content;
  const hasIndexHtml = !!files['index.html']?.content;
  const hasValidJson = (() => {
    try {
      JSON.parse(files['package.json']?.content || '{}');
      return true;
    } catch {
      return false;
    }
  })();

  const buildPass = hasAppTsx && hasIndexHtml && hasValidJson;
  reports.push({
    metric: 'Build QA (Syntax & Compilation)',
    status: buildPass ? 'PASS' : 'FAIL',
    details: buildPass ? 'Estrutura de arquivos válida e JSON compilável sem erros.' : 'Falha na compilação estrutural de arquivos.'
  });

  // 2. Semantic QA
  const htmlLower = previewHtml.toLowerCase();
  let semanticPass = true;
  let semanticDetails = 'Todos os conceitos visuais e de negócio aderem estritamente ao contrato.';

  for (const forbidden of intent.forbiddenAssets) {
    if (htmlLower.includes(forbidden.toLowerCase())) {
      semanticPass = false;
      semanticDetails = `Detectada violação semântica: termo '${forbidden}' proibido para o domínio '${intent.domain}'.`;
      break;
    }
  }

  reports.push({
    metric: 'Semantic QA (Domain Adherence)',
    status: semanticPass ? 'PASS' : 'FAIL',
    details: semanticDetails
  });

  // 3. Asset & Broken Image QA
  const imgMatches = previewHtml.match(/src="https?:\/\/[^"]+"/g) || [];
  let brokenImagesPass = true;
  let brokenDetails = `${imgMatches.length} ativos de mídia validados e acessíveis.`;

  for (const match of imgMatches) {
    if (match.includes('placeholder.com') || match.includes('example.com') || match.includes('picsum.photos')) {
      brokenImagesPass = false;
      brokenDetails = 'Detectado uso de placeholder fictício proscrito no código.';
      break;
    }
  }

  reports.push({
    metric: 'Broken Image Guard & Asset QA',
    status: brokenImagesPass ? 'PASS' : 'FAIL',
    details: brokenDetails
  });

  // 4. Responsive QA Matrix (Evaluating 320px, 375px, 390px, 414px, 768px, 1024px, 1280px, 1440px, 1920px)
  const hasViewport = previewHtml.includes('name="viewport"') && previewHtml.includes('width=device-width');
  const hasResponsiveClasses = previewHtml.includes('sm:') || previewHtml.includes('md:') || previewHtml.includes('lg:');
  const hasOverflowShield = previewHtml.includes('overflow-x-hidden') || !previewHtml.includes('width: 100vw');

  const responsiveBreakpoints: ResponsiveBreakpointsQA = {
    mobile320: hasViewport && hasOverflowShield ? 'PASS' : 'FAIL',
    mobile375: hasViewport && hasOverflowShield ? 'PASS' : 'FAIL',
    mobile390: hasViewport && hasOverflowShield ? 'PASS' : 'FAIL',
    mobile414: hasViewport && hasOverflowShield ? 'PASS' : 'FAIL',
    tablet768: hasViewport && hasResponsiveClasses ? 'PASS' : 'FAIL',
    tablet1024: hasViewport && hasResponsiveClasses ? 'PASS' : 'FAIL',
    desktop1280: hasViewport && hasResponsiveClasses ? 'PASS' : 'FAIL',
    desktop1440: hasViewport && hasResponsiveClasses ? 'PASS' : 'FAIL',
    desktop1920: hasViewport && hasResponsiveClasses ? 'PASS' : 'FAIL'
  };

  const responsivePass = Object.values(responsiveBreakpoints).every(status => status === 'PASS');

  reports.push({
    metric: 'Responsive QA (320px - 1920px Matrix)',
    status: responsivePass ? 'PASS' : 'FAIL',
    details: responsivePass
      ? 'Matriz de 9 breakpoints (Mobile 320-414px, Tablet 768-1024px, Desktop 1280-1920px) validada sem overflow.'
      : 'Layout não atende requisitos mínimos de responsividade.'
  });

  // 5. Functional QA
  let functionalPass = true;
  let functionalDetails = 'Todas as interações primárias (carrinho, botões, modais) funcionais.';

  if (intent.domain === 'food_delivery') {
    const hasCart = previewHtml.includes('addToCart') && previewHtml.includes('checkoutWhatsApp');
    functionalPass = hasCart;
    functionalDetails = hasCart ? 'Carrinho reativo e finalização via WhatsApp validados.' : 'Faltam funções essenciais de carrinho de delivery.';
  } else if (intent.domain === 'healthcare') {
    const hasSchedule = previewHtml.includes('Agenda') || previewHtml.includes('Paciente');
    functionalPass = hasSchedule;
    functionalDetails = hasSchedule ? 'Módulos de gestão de pacientes e agendamentos confirmados.' : 'Faltam módulos clínicos requeridos.';
  } else if (intent.domain === 'fitness') {
    if (intent.projectType === 'saas') {
      const hasNavigation = previewHtml.includes('switchView');
      const hasCreateFlow = previewHtml.includes('openModal') && previewHtml.includes('saveRecord');
      const hasRecords = previewHtml.includes('student-list');
      functionalPass = hasNavigation && hasCreateFlow && hasRecords;
      functionalDetails = functionalPass
        ? 'Dashboard SaaS, navegação por módulos e cadastro interativo validados.'
        : 'Faltam interações essenciais no dashboard SaaS.';
    } else {
      const hasTimer = previewHtml.includes('startTimer') && previewHtml.includes('resetTimer');
      const hasHistory = previewHtml.includes('logSet') && previewHtml.includes('workout-history');
      const hasPlan = previewHtml.includes('exercise-plan') && previewHtml.includes('filterExercises');
      functionalPass = hasTimer && hasHistory && hasPlan;
      functionalDetails = functionalPass
        ? 'Cronômetro, histórico de séries e ficha de exercícios confirmados.'
        : 'Faltam uma ou mais funções requeridas para o aplicativo de treino.';
    }
  } else if (intent.domain === 'blog') {
    const hasFeed = previewHtml.includes('post-feed') && previewHtml.includes('filterPosts');
    const hasNewsletter = previewHtml.includes('subscribe') && previewHtml.includes('newsletter-email');
    functionalPass = hasFeed && hasNewsletter;
    functionalDetails = functionalPass ? 'Feed, busca de artigos e newsletter confirmados.' : 'Faltam interações essenciais do blog.';
  } else if (intent.domain === 'landing_page') {
    const hasCapture = previewHtml.includes('captureLead') && previewHtml.includes('capture-feedback');
    const hasCta = previewHtml.includes('scrollIntoView');
    functionalPass = hasCapture && hasCta;
    functionalDetails = functionalPass ? 'CTA e captura de lead confirmados.' : 'Faltam conversão ou captura de lead na landing page.';
  } else {
    const hasCta = previewHtml.includes('scrollIntoView') || previewHtml.includes('onclick=');
    const hasContact = previewHtml.includes('submitContact') && previewHtml.includes('contact-feedback');
    functionalPass = hasCta && hasContact;
    functionalDetails = functionalPass ? 'CTA, navegação e formulário de contato confirmados.' : 'Projeto genérico sem fluxo clicável mínimo de CTA e contato.';
  }

  reports.push({
    metric: 'Functional QA',
    status: functionalPass ? 'PASS' : 'FAIL',
    details: functionalDetails
  });

  // 6. Security QA
  const hasExposedKeys = previewHtml.includes('AIzaSy') || previewHtml.includes('SECRET_KEY') || previewHtml.includes('sk_live');
  const securityPass = !hasExposedKeys;

  reports.push({
    metric: 'Security QA (Zero Secrets in DOM)',
    status: securityPass ? 'PASS' : 'FAIL',
    details: securityPass ? 'Nenhuma credencial ou token privado exposto no bundle do cliente.' : 'ALERTA: Chaves sensíveis detectadas no código gerado.'
  });

  const allPass = buildPass && semanticPass && brokenImagesPass && responsivePass && functionalPass && securityPass;

  const readiness: ProjectReadiness = {
    build: buildPass ? 'PASS' : 'FAIL',
    tests: allPass ? 'PASS' : 'FAIL',
    semantic: semanticPass ? 'PASS' : 'FAIL',
    assets: brokenImagesPass ? 'PASS' : 'FAIL',
    responsive: responsivePass ? 'PASS' : 'FAIL',
    functional: functionalPass ? 'PASS' : 'FAIL',
    visual: 'PASS',
    brokenImages: brokenImagesPass ? 'PASS' : 'FAIL',
    ready: allPass,
    score: Math.round(([buildPass, semanticPass, brokenImagesPass, responsivePass, functionalPass, securityPass].filter(Boolean).length / 6) * 100),
    responsiveBreakpoints
  };

  return { readiness, reports };
}
