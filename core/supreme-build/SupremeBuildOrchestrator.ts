import { IntentContract } from '../../src/types/engrenagem';

export type SupremeExecutorId =
  | 'product-architect' | 'ux-ui' | 'frontend' | 'backend' | 'data'
  | 'auth-security' | 'integrations' | 'visual-media' | 'qa-tests'
  | 'responsive' | 'performance' | 'deploy' | 'documentation';

export interface SupremeExecutor {
  id: SupremeExecutorId;
  name: string;
  responsibility: string;
  tools: string[];
  dependsOn: SupremeExecutorId[];
  enabled: boolean;
}

export interface SupremeBuildGraph {
  mode: 'SUPREME_BUILD';
  stack: { frontend: string; backend: string; database: string; styling: string; deployment: string };
  executors: SupremeExecutor[];
  acceptanceGate: string[];
}

export function createSupremeBuildGraph(intent: IntentContract): SupremeBuildGraph {
  const needsSaaS = intent.projectType === 'saas' || intent.domain === 'healthcare' || intent.domain === 'b2b_saas';
  const requestedContext = `${intent.domain} ${intent.projectType} ${intent.visualConcepts.join(' ')}`;
  return {
    mode: 'SUPREME_BUILD',
    stack: { frontend: 'React 19 + TypeScript + Vite', backend: needsSaaS ? 'Node.js 22 + Express + API modular' : 'Node.js 22 + Express', database: needsSaaS ? 'Firestore-ready repository + ownership rules' : 'Local project repository', styling: 'Tailwind CSS 4 + responsive design tokens', deployment: 'Vercel / Netlify / GitHub-ready' },
    executors: ([
      { id: 'product-architect', name: 'Product Architect', responsibility: 'Transforma pedido em contrato, módulos, fluxos e critérios de aceite.', tools: ['IntentEngine', 'Planner', 'FeaturePlanner'], dependsOn: [], enabled: true },
      { id: 'ux-ui', name: 'UX/UI Engineer', responsibility: 'Define hierarquia, estados vazios, feedback, navegação e conversão.', tools: ['DesignSystem', 'ResponsiveEngine'], dependsOn: ['product-architect'], enabled: true },
      { id: 'frontend', name: 'Frontend Engineer', responsibility: 'Gera componentes React, interações, formulários e preview executável.', tools: ['ProjectGenerator', 'ComponentLibrary'], dependsOn: ['product-architect', 'ux-ui'], enabled: true },
      { id: 'backend', name: 'Backend Engineer', responsibility: 'Cria rotas, validação, serviços, jobs e contratos de API.', tools: ['Express', 'ServiceRegistry'], dependsOn: ['product-architect'], enabled: true },
      { id: 'data', name: 'Data Engineer', responsibility: 'Modela entidades, ownership, persistência e migrações.', tools: ['FirestoreRules', 'RepositoryLayer'], dependsOn: ['backend'], enabled: true },
      { id: 'auth-security', name: 'Auth & Security Engineer', responsibility: 'Protege rotas, perfis, segredos, permissões e dados do usuário.', tools: ['FirebaseAuth', 'SecurityQA'], dependsOn: ['backend', 'data'], enabled: true },
      { id: 'integrations', name: 'Integration Engineer', responsibility: 'Conecta mapas, pagamentos, WhatsApp, GitHub e deploy sem mocks falsos.', tools: ['ProviderRouter', 'APIAdapters'], dependsOn: ['backend'], enabled: true },
      { id: 'visual-media', name: 'Visual & Media Engineer', responsibility: `Seleciona fotos reais, processa uploads e gera visuais sob demanda para: ${requestedContext}.`, tools: ['SemanticAssetGuard', 'GeminiImage', 'MediaLibrary'], dependsOn: ['ux-ui'], enabled: true },
      { id: 'qa-tests', name: 'QA & Test Engineer', responsibility: 'Valida build, interações, assets, segurança e critérios de aceite.', tools: ['QAEngine', 'RepairEngine'], dependsOn: ['frontend', 'backend', 'visual-media'], enabled: true },
      { id: 'responsive', name: 'Responsive Engineer', responsibility: 'Garante mobile, tablet, desktop e ausência de overflow.', tools: ['ResponsiveEngine', 'BreakpointMatrix'], dependsOn: ['frontend'], enabled: true },
      { id: 'performance', name: 'Performance Engineer', responsibility: 'Reduz bundle, otimiza assets, lazy loading e carregamento inicial.', tools: ['BuildEngine', 'AssetOptimizer'], dependsOn: ['frontend', 'visual-media'], enabled: true },
      { id: 'deploy', name: 'Deploy Engineer', responsibility: 'Prepara exportação e configuração para Vercel, Netlify e GitHub.', tools: ['DeploymentProvider', 'ExportProvider'], dependsOn: ['qa-tests', 'performance'], enabled: true },
      { id: 'documentation', name: 'Documentation Engineer', responsibility: 'Entrega README, variáveis, comandos, arquitetura e próximos passos.', tools: ['ReadmeGenerator', 'ProjectManifest'], dependsOn: ['deploy'], enabled: true }
    ] as SupremeExecutor[]).filter(executor => executor.enabled),
    acceptanceGate: ['npm run lint', 'npm run build', 'QA funcional', 'QA responsivo 320px-1920px', 'zero secrets no frontend', 'zero placeholder visual', 'preview executável', 'export Vercel/Netlify/GitHub pronto']
  };
}
