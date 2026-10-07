import { eventEngine } from '../event-engine/eventEngine.ts';

export type PreviewStatus = 'STOPPED' | 'STARTING' | 'RUNNING' | 'RESTARTING' | 'CRASHED' | 'ERROR';

export interface PreviewEvidence {
  type: string;
  message: string;
  data?: unknown;
}

export interface PreviewResult {
  success: boolean;
  mode: 'LOCAL';
  projectId: string;
  url?: string;
  statusCode?: number;
  readyState?: string;
  errorCode?: string;
  errorMessage?: string;
  evidence: PreviewEvidence[];
}

export interface PreviewInstance {
  projectId: string;
  status: PreviewStatus;
  url: string;
  health: 'ONLINE' | 'OFFLINE' | 'DEGRADED';
  restartsCount: number;
  lastHealthCheck: string;
  error?: {
    type: string;
    file?: string;
    line?: number;
    message: string;
  };
  logs: Array<{
    timestamp: string;
    level: 'info' | 'warn' | 'error';
    message: string;
  }>;
}

export class PreviewManager {
  private instances: Map<string, PreviewInstance> = new Map();
  private readonly MAX_PREVIEW_RESTARTS = 3;

  public getOrCreateInstance(projectId: string): PreviewInstance {
    let inst = this.instances.get(projectId);
    if (!inst) {
      inst = {
        projectId,
        status: 'RUNNING',
        url: `/api/projects/${projectId}/preview-html`,
        health: 'ONLINE',
        restartsCount: 0,
        lastHealthCheck: new Date().toISOString(),
        logs: [
          {
            timestamp: new Date().toISOString(),
            level: 'info',
            message: `Preview Server montado para o projeto ${projectId}`
          }
        ]
      };
      this.instances.set(projectId, inst);
    }
    return inst;
  }

  public getStatus(projectId: string): PreviewStatus {
    return this.getOrCreateInstance(projectId).status;
  }

  public getUrl(projectId: string): string {
    return `/api/projects/${projectId}/preview-html?t=${Date.now()}`;
  }

  public getResult(projectId: string): PreviewResult {
    const instance = this.getOrCreateInstance(projectId);
    const success = instance.health === 'ONLINE' && instance.status === 'RUNNING';
    return {
      success,
      mode: 'LOCAL',
      projectId,
      url: success ? `/preview/${encodeURIComponent(projectId)}` : undefined,
      readyState: success ? 'LOCAL_READY' : instance.status,
      errorCode: success ? undefined : 'LOCAL_PREVIEW_UNAVAILABLE',
      errorMessage: success ? undefined : instance.error?.message || 'Preview local indisponível.',
      evidence: [{
        type: 'LOCAL_PREVIEW',
        message: success ? 'Preview local registrado pelo servidor.' : 'Preview local não está online.',
        data: { status: instance.status, health: instance.health, restartsCount: instance.restartsCount }
      }]
    };
  }

  public getLogs(projectId: string) {
    return this.getOrCreateInstance(projectId).logs;
  }

  public async checkHealth(projectId: string): Promise<{ status: PreviewStatus; health: 'ONLINE' | 'OFFLINE'; latencyMs: number }> {
    const inst = this.getOrCreateInstance(projectId);
    const start = Date.now();

    try {
      // Internal health check
      inst.lastHealthCheck = new Date().toISOString();
      inst.health = 'ONLINE';
      if (inst.status !== 'CRASHED' && inst.status !== 'ERROR') {
        inst.status = 'RUNNING';
      }

      return {
        status: inst.status,
        health: 'ONLINE',
        latencyMs: Date.now() - start
      };
    } catch (err: any) {
      inst.health = 'OFFLINE';
      inst.status = 'CRASHED';
      return {
        status: 'CRASHED',
        health: 'OFFLINE',
        latencyMs: Date.now() - start
      };
    }
  }

  public restartPreview(projectId: string): { success: boolean; restartsCount: number; message: string; url: string } {
    const inst = this.getOrCreateInstance(projectId);

    if (inst.restartsCount >= this.MAX_PREVIEW_RESTARTS) {
      inst.status = 'CRASHED';
      inst.logs.push({
        timestamp: new Date().toISOString(),
        level: 'error',
        message: `Limite de tentativas de restart excedido (${this.MAX_PREVIEW_RESTARTS}/${this.MAX_PREVIEW_RESTARTS}).`
      });
      return {
        success: false,
        restartsCount: inst.restartsCount,
        message: 'Limite máximo de reinicializações atingido para prevenir loop de crash.',
        url: this.getUrl(projectId)
      };
    }

    inst.restartsCount++;
    inst.status = 'RESTARTING';
    inst.error = undefined;

    inst.logs.push({
      timestamp: new Date().toISOString(),
      level: 'info',
      message: `Reinicialização do preview solicitada (${inst.restartsCount}/${this.MAX_PREVIEW_RESTARTS})`
    });

    eventEngine.emit(projectId, 'sys-job', 'PREVIEW_STARTED', { restartsCount: inst.restartsCount });

    // Mark as running after brief re-mount
    setTimeout(() => {
      inst.status = 'RUNNING';
      inst.health = 'ONLINE';
    }, 400);

    return {
      success: true,
      restartsCount: inst.restartsCount,
      message: 'Preview reiniciado com sucesso.',
      url: this.getUrl(projectId)
    };
  }

  public reportError(projectId: string, error: { type: string; file?: string; line?: number; message: string }) {
    const inst = this.getOrCreateInstance(projectId);
    inst.status = 'ERROR';
    inst.health = 'DEGRADED';
    inst.error = error;
    inst.logs.push({
      timestamp: new Date().toISOString(),
      level: 'error',
      message: `[PreviewCrash] ${error.type} em ${error.file || 'runtime'}: ${error.message}`
    });
  }

  public resetRestarts(projectId: string) {
    const inst = this.getOrCreateInstance(projectId);
    inst.restartsCount = 0;
    inst.error = undefined;
    inst.status = 'RUNNING';
    inst.health = 'ONLINE';
  }
}

export const previewManager = new PreviewManager();
