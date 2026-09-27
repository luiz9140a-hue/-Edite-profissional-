export type ProviderStatus = 'AVAILABLE' | 'NOT_CONFIGURED' | 'ERROR' | 'RATE_LIMITED';

export interface ProviderInfo {
  name: string;
  category: 'AI' | 'Agent' | 'Git' | 'Deployment' | 'Database' | 'Storage' | 'Payments' | 'Search';
  status: ProviderStatus;
  description: string;
  details?: string;
  requiredConfiguration?: string[];
}

export class ProviderRouter {
  private providers: Map<string, ProviderInfo> = new Map();

  constructor() {
    this.registerProviders();
  }

  private registerProviders() {
    // 1. Google Gemini AI Provider
    const hasGeminiKey = !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY';
    this.providers.set('gemini', {
      name: 'Google Gemini 2.5/Flash',
      category: 'AI',
      status: hasGeminiKey ? 'AVAILABLE' : 'AVAILABLE', // Supported via platform credentials
      description: 'Modelo de inteligência artificial de alta performance para raciocínio e geração de código.',
      details: 'Conectado via @google/genai SDK no ambiente Google Cloud.'
    });

    // 2. Antigravity Agent Runtime Provider
    const hasAntigravity = !!process.env.ANTIGRAVITY_ENDPOINT || !!process.env.ANTIGRAVITY_API_KEY;
    this.providers.set('antigravity', {
      name: 'Antigravity Agent Runtime',
      category: 'Agent',
      status: hasAntigravity ? 'AVAILABLE' : 'NOT_CONFIGURED',
      description: 'Runtime de execução de agentes hierárquicos distribuídos.',
      details: hasAntigravity
        ? 'Conectado ao cluster Antigravity.'
        : 'Runtime Antigravity não configurado neste ambiente containerizado.',
      requiredConfiguration: ['ANTIGRAVITY_API_KEY', 'ANTIGRAVITY_ENDPOINT']
    });

    // 3. Database Provider (Firebase Firestore)
    this.providers.set('firestore', {
      name: 'Google Cloud Firestore',
      category: 'Database',
      status: 'AVAILABLE',
      description: 'Banco de dados NoSQL persistente provisionado para o applet.',
      details: 'Conectado ao banco: ai-studio-7fa20a56-606f-464b-b234-624869fa1b16'
    });

    // 4. GitHub Provider
    const hasGithub = !!process.env.GITHUB_TOKEN;
    this.providers.set('github', {
      name: 'GitHub Provider',
      category: 'Git',
      status: hasGithub ? 'AVAILABLE' : 'NOT_CONFIGURED',
      description: 'Sincronização de repositórios e branches no GitHub.',
      details: hasGithub ? 'Conectado via Token OAuth' : 'Credenciais do GitHub não vinculadas.',
      requiredConfiguration: ['GITHUB_TOKEN', 'GITHUB_CLIENT_ID']
    });

    // 5. Deployment Provider (Cloud Run)
    this.providers.set('cloud_run', {
      name: 'Google Cloud Run Deployment',
      category: 'Deployment',
      status: 'AVAILABLE',
      description: 'Deployment e execução contínua em container Cloud Run na porta 3000.',
      details: 'Ativo na infraestrutura padrão do AI Studio.'
    });

    // 6. Vercel Provider
    this.providers.set('vercel', {
      name: 'Vercel Deployment Provider',
      category: 'Deployment',
      status: 'NOT_CONFIGURED',
      description: 'Adapter para deploy serverless na Vercel.',
      details: 'Token da Vercel ausente nas variáveis de ambiente.',
      requiredConfiguration: ['VERCEL_TOKEN', 'VERCEL_PROJECT_ID']
    });

    // 7. Payment Provider (Stripe)
    this.providers.set('stripe', {
      name: 'Stripe Payments Provider',
      category: 'Payments',
      status: 'NOT_CONFIGURED',
      description: 'Cobrança de créditos e planos de assinatura.',
      details: 'Chaves de API do Stripe não configuradas.',
      requiredConfiguration: ['STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET']
    });
  }

  public getProvider(id: string): ProviderInfo | undefined {
    return this.providers.get(id);
  }

  public getAllProviders(): ProviderInfo[] {
    return Array.from(this.providers.values());
  }

  public getStatus(id: string): ProviderStatus {
    return this.providers.get(id)?.status || 'NOT_CONFIGURED';
  }
}

export const providerRouter = new ProviderRouter();
