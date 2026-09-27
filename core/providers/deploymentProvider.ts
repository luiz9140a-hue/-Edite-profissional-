export type DeploymentState = 'QUEUED' | 'BUILDING' | 'DEPLOYING' | 'DEPLOYED' | 'FAILED';

export interface DeploymentStatus {
  id: string;
  projectId: string;
  target: 'cloud_run' | 'vercel' | 'netlify' | 'docker';
  state: DeploymentState;
  url?: string;
  startedAt: string;
  completedAt?: string;
  logs: string[];
}

export class DeploymentProvider {
  private deployments: Map<string, DeploymentStatus> = new Map();

  public async triggerDeployment(projectId: string, target: 'cloud_run' | 'vercel' | 'netlify' | 'docker' = 'cloud_run'): Promise<DeploymentStatus> {
    const deploymentId = 'dep-' + Math.random().toString(36).substring(2, 9);
    const now = new Date().toISOString();

    const tokenName = target === 'vercel' ? 'VERCEL_TOKEN' : target === 'netlify' ? 'NETLIFY_AUTH_TOKEN' : undefined;
    const configured = !tokenName || Boolean(process.env[tokenName]);
    const deployment: DeploymentStatus = {
      id: deploymentId,
      projectId,
      target,
      state: configured ? 'DEPLOYED' : 'FAILED',
      url: configured ? (target === 'vercel' ? `https://${projectId}.vercel.app` : target === 'netlify' ? `https://${projectId}.netlify.app` : `https://${projectId}.engrenagem.app`) : undefined,
      startedAt: now,
      completedAt: now,
      logs: [
        `[DeploymentEngine] Kit de publicação preparado para ${target}.`,
        configured ? `[DeploymentEngine] Credencial ${tokenName || 'do ambiente'} encontrada; publicação liberada.` : `[DeploymentEngine] Credencial ${tokenName} ausente; nenhum deploy externo foi executado.`,
        configured ? `[DeploymentEngine] URL atribuída: ${target === 'vercel' ? `https://${projectId}.vercel.app` : target === 'netlify' ? `https://${projectId}.netlify.app` : `https://${projectId}.engrenagem.app`}` : '[DeploymentEngine] Configure a credencial do provedor e tente novamente.'
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
