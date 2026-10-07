export type DeploymentState = 'QUEUED' | 'BUILDING' | 'DEPLOYING' | 'DEPLOYED' | 'FAILED' | 'BLOCKED_EXTERNAL';

export interface DeploymentStatus {
  id?: string;
  projectId: string;
  target: 'cloud_run' | 'vercel' | 'netlify' | 'docker';
  state: DeploymentState;
  url?: string;
  startedAt: string;
  completedAt?: string;
  logs: string[];
  errorCode?: string;
  errorMessage?: string;
}

export class DeploymentProvider {
  private deployments: Map<string, DeploymentStatus> = new Map();

  public async triggerDeployment(projectId: string, target: 'cloud_run' | 'vercel' | 'netlify' | 'docker' = 'cloud_run'): Promise<DeploymentStatus> {
    const now = new Date().toISOString();
    const tokenName = target === 'vercel' ? 'VERCEL_TOKEN' : target === 'netlify' ? 'NETLIFY_AUTH_TOKEN' : undefined;
    const configured = !tokenName || Boolean(process.env[tokenName]);
    const deployment: DeploymentStatus = {
      projectId,
      target,
      state: 'BLOCKED_EXTERNAL',
      startedAt: now,
      completedAt: now,
      errorCode: configured ? 'DEPLOYMENT_ADAPTER_NOT_IMPLEMENTED' : 'DEPLOYMENT_AUTH_MISSING',
      errorMessage: configured
        ? `Não existe adapter real conectado para ${target}; nenhum deployment foi criado.`
        : `Credencial ${tokenName} ausente; nenhum deployment foi criado.`,
      logs: [
        `[DeploymentEngine] Solicitação ${target} bloqueada sem confirmação do provedor.`,
        configured ? '[DeploymentEngine] Adapter real ausente.' : `[DeploymentEngine] Credencial ${tokenName} ausente.`,
        '[DeploymentEngine] Nenhum deploymentId ou URL foi atribuído.'
      ]
    };
    this.deployments.set(projectId, deployment);
    return deployment;
  }

  public getDeployment(projectId: string): DeploymentStatus | undefined {
    return this.deployments.get(projectId);
  }
}

export const deploymentProvider = new DeploymentProvider();
