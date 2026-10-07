import { ConvexHttpClient } from 'convex/browser';
import { api } from '../convex/_generated/api';
import {
  embeddedCreateProject,
  embeddedGetProject,
  embeddedGetJob,
  embeddedRunEdit,
  embeddedRepair,
  embeddedQa,
  embeddedAddAssets,
  embeddedRemoveAsset,
  embeddedIntake,
  embeddedGetVisual,
  embeddedSaveVisual,
  embeddedPublishVisual,
  embeddedSearchLeads,
  usage as embeddedUsage,
  checkCredits,
} from './budEmbedded';

/**
 * Dual/trim-mode BUD client.
 *
 * 1. "convex"    — cloud Convex deployment (VITE_CONVEX_URL apontando para *.convex.cloud)
 * 2. "rest"      — Express API local (dev preview, rotas /api/*)
 * 3. "embedded"  — motor BUD embutido no cliente com persistência local
 *                  (produção estática enquanto o Convex cloud não está conectado)
 */

const RAW_CONVEX_URL = import.meta.env.VITE_CONVEX_URL as string | undefined;
const PROD_CONVEX_URL = import.meta.env.VITE_PROD_CONVEX_URL as string | undefined;

function resolveClientUrl(): string | undefined {
  // 1) URL de dev local (127.0.0.1/localhost): só vale quando o próprio app roda em localhost.
  if (RAW_CONVEX_URL) {
    const isLocal = /^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/.test(RAW_CONVEX_URL);
    const runningLocally = typeof window !== 'undefined' && /^(127\.0\.0\.1|localhost)$/.test(window.location.hostname);
    if (isLocal && runningLocally) return RAW_CONVEX_URL;
  }
  // 2) Deployment cloud de produção (*.convex.cloud) conectado via dashboard.
  if (PROD_CONVEX_URL && /^https:\/\/[a-z0-9-]+\.convex\.cloud$/.test(PROD_CONVEX_URL)) {
    return PROD_CONVEX_URL;
  }
  return undefined;
}

const CONVEX_URL = resolveClientUrl();

let client: ConvexHttpClient | null = null;
function convex(): ConvexHttpClient {
  if (!client) client = new ConvexHttpClient(CONVEX_URL!);
  return client;
}

export type BudMode = 'convex' | 'rest' | 'embedded';

function currentMode(): BudMode {
  if (CONVEX_URL) return 'convex';
  if (typeof window !== 'undefined' && /^(127\.0\.0\.1|localhost)$/.test(window.location.hostname)) return 'rest';
  return 'embedded';
}

export interface CreateJobResult {
  jobId: string;
  projectId?: string;
  status: string;
  project?: unknown;
}

export interface BudProject {
  id: string;
  name: string;
  description: string;
  prompt: string;
  status: string;
  intent: any;
  files: Record<string, { path: string; content: string; language: string; updatedAt: string }>;
  assets: any[];
  readiness: any;
  brain: any;
  activeJobId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BudJob {
  id: string;
  projectId: string;
  prompt: string;
  status: string;
  currentStep: string;
  progress: number;
  logs: any[];
  qaReport: any[];
  readiness: any;
  createdAt: string;
  updatedAt: string;
  error?: string;
}

async function rest<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, init);
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((body as any).error || `HTTP ${res.status}`);
  return body as T;
}

export function setBudIdentity(accountId: string, planId: string): void {
  try {
    localStorage.setItem('bud-account-id', accountId);
    localStorage.setItem('bud-plan-id', planId);
  } catch {
    /* ignore */
  }
}

function identity(): { accountId: string; planId: string } {
  try {
    return {
      accountId: localStorage.getItem('bud-account-id') || 'anonymous',
      planId: localStorage.getItem('bud-plan-id') || 'free',
    };
  } catch {
    return { accountId: 'anonymous', planId: 'free' };
  }
}

export const budClient = {
  mode: (): BudMode => currentMode(),

  async createJob(prompt: string, accountId: string, planId: string, assets: unknown[] = []): Promise<CreateJobResult> {
    setBudIdentity(accountId, planId);
    const mode = currentMode();
    if (mode === 'convex') {
      return convex().mutation(api.projects.createProject, { prompt, accountId, planId });
    }
    if (mode === 'embedded') {
      const result = embeddedCreateProject(prompt, accountId, planId);
      return { ...result, project: embeddedGetProject(result.projectId) };
    }
    return rest<CreateJobResult>('/api/generation/jobs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-account-id': accountId, 'x-plan-id': planId },
      body: JSON.stringify({ prompt, assets }),
    });
  },

  async getJob(jobId: string): Promise<BudJob | null> {
    const mode = currentMode();
    if (mode === 'convex') {
      return convex().query(api.projects.getJob, { jobId }) as Promise<BudJob | null>;
    }
    if (mode === 'embedded') {
      return embeddedGetJob(jobId) as BudJob | null;
    }
    return rest<BudJob>(`/api/generation/jobs/${jobId}`);
  },

  async getProject(projectId: string): Promise<BudProject | null> {
    const mode = currentMode();
    if (mode === 'convex') {
      return convex().query(api.projects.getProject, { projectId }) as Promise<BudProject | null>;
    }
    if (mode === 'embedded') {
      return embeddedGetProject(projectId) as BudProject | null;
    }
    return rest<BudProject>(`/api/projects/${projectId}`);
  },

  async runEdit(projectId: string, message: string, accountId: string, planId: string): Promise<CreateJobResult> {
    setBudIdentity(accountId, planId);
    const mode = currentMode();
    if (mode === 'convex') {
      const result = await convex().mutation(api.projects.runBudEdit, { projectId, message, accountId, planId });
      return { ...result, projectId };
    }
    if (mode === 'embedded') {
      const result = embeddedRunEdit(projectId, message, accountId, planId);
      return { ...result, projectId };
    }
    return rest<CreateJobResult>('/api/bud/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-account-id': accountId, 'x-plan-id': planId },
      body: JSON.stringify({ projectId, message }),
    });
  },

  async intake(message: string, historyLen: number, sessionId: string): Promise<{ status: string; message: string; prompt?: string }> {
    const mode = currentMode();
    if (mode === 'convex') {
      return convex().mutation(api.projects.intakeTurn, { sessionId, message, historyLen });
    }
    if (mode === 'embedded') {
      return embeddedIntake(sessionId, message, historyLen);
    }
    return rest<{ status: string; message: string; prompt?: string }>('/api/bud/intake', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, history: [] }),
    });
  },

  async getUsage(accountId: string): Promise<{ used: number; limit: number }> {
    const mode = currentMode();
    if (mode === 'convex') {
      return convex().query(api.projects.getUsage, { accountId }) as Promise<{ used: number; limit: number }>;
    }
    if (mode === 'embedded') {
      return embeddedUsage(accountId);
    }
    return rest<{ used: number; limit: number }>('/api/billing/usage', { headers: { 'x-account-id': accountId } });
  },

  async repair(projectId: string): Promise<{ success: boolean; message: string; readiness?: any }> {
    const mode = currentMode();
    if (mode === 'convex') {
      return convex().mutation(api.projects.repairProject, { projectId });
    }
    if (mode === 'embedded') {
      return embeddedRepair(projectId);
    }
    return rest<{ success: boolean; message: string }>(`/api/projects/${projectId}/repair`, { method: 'POST' });
  },

  async qa(projectId: string): Promise<{ success: boolean; readiness?: any }> {
    const mode = currentMode();
    if (mode === 'convex') {
      return convex().mutation(api.projects.runQaCheck, { projectId });
    }
    if (mode === 'embedded') {
      return embeddedQa(projectId);
    }
    return rest<{ success: boolean }>(`/api/projects/${projectId}/qa`, { method: 'POST' });
  },

  async addAssets(projectId: string, assets: unknown[]): Promise<{ assets: any[] }> {
    const mode = currentMode();
    if (mode === 'convex') {
      return convex().mutation(api.projects.addAssets, { projectId, assets });
    }
    if (mode === 'embedded') {
      return embeddedAddAssets(projectId, assets) as { assets: any[] };
    }
    return rest<{ assets: any[] }>(`/api/projects/${projectId}/assets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assets }),
    });
  },

  async removeAsset(projectId: string, assetId: string): Promise<{ assets: any[] }> {
    const mode = currentMode();
    if (mode === 'convex') {
      return convex().mutation(api.projects.removeAsset, { projectId, assetId });
    }
    if (mode === 'embedded') {
      return embeddedRemoveAsset(projectId, assetId) as { assets: any[] };
    }
    return rest<{ assets: any[] }>(`/api/projects/${projectId}/assets/${encodeURIComponent(assetId)}`, { method: 'DELETE' });
  },

  async searchLeads(query: string, near: string): Promise<{ leads: any[] }> {
    const mode = currentMode();
    if (mode === 'convex') {
      return convex().action(api.leads.searchLeads, { query, near });
    }
    if (mode === 'embedded') {
      return embeddedSearchLeads(query, near) as Promise<{ leads: any[] }>;
    }
    const { accountId } = identity();
    return rest<{ leads: any[] }>(`/api/leads/search?q=${encodeURIComponent(query)}&near=${encodeURIComponent(near)}`, {
      headers: { 'x-account-id': accountId },
    });
  },

  async getVisualDocument(docId: string): Promise<any> {
    const mode = currentMode();
    if (mode === 'convex') {
      return convex().query(api.projects.getVisualDocument, { docId });
    }
    if (mode === 'embedded') {
      return embeddedGetVisual(docId);
    }
    return rest<any>(`/api/visual/documents/${docId}`);
  },

  async saveVisualDocument(docId: string, doc: { name: string; route: string; root: unknown }): Promise<any> {
    const mode = currentMode();
    if (mode === 'convex') {
      return convex().mutation(api.projects.saveVisualDocument, { docId, ...doc });
    }
    if (mode === 'embedded') {
      return embeddedSaveVisual(docId, doc);
    }
    return rest<any>(`/api/visual/documents/${docId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: docId, ...doc }),
    });
  },

  async publishVisualDocument(docId: string): Promise<any> {
    const mode = currentMode();
    if (mode === 'convex') {
      return convex().mutation(api.projects.publishVisualDocument, { docId });
    }
    if (mode === 'embedded') {
      return embeddedPublishVisual(docId);
    }
    return rest<any>(`/api/visual/documents/${docId}/publish`, { method: 'POST' });
  },

  async previewHtml(projectId: string): Promise<string> {
    const project = await this.getProject(projectId);
    if (!project) throw new Error('Projeto não encontrado.');
    return buildPreviewDocument(project);
  },
};

// ---------- preview document builder ----------
const ERROR_BRIDGE = `
<script>
(function () {
  function report(type, message) {
    try { parent.postMessage({ type: 'PREVIEW_RUNTIME_ERROR', errorType: type, message: String(message), file: 'index.html' }, '*'); } catch (_) {}
  }
  window.addEventListener('error', function (event) { report('RUNTIME_ERROR', event.message); });
  window.addEventListener('unhandledrejection', function (event) { report('PROMISE_REJECTION', event.reason); });
})();
</script>`;

export function buildPreviewDocument(project: BudProject): string {
  const htmlFile = project.files?.['index.html'];
  const content =
    htmlFile?.content ??
    '<!doctype html><html><body style="font-family:sans-serif;background:#07090E;color:#94a3b8;padding:24px"><p>Projeto sem HTML principal.</p></body></html>';
  if (/<\/body>/i.test(content)) {
    return content.replace(/<\/body>/i, `${ERROR_BRIDGE}\n</body>`);
  }
  return content + ERROR_BRIDGE;
}

// re-export for callers that gate on credits directly
export { checkCredits };
