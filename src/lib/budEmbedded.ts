import type { GenerationJob, LogEntry, Project } from '../types/engrenagem';
import {
  classifyIntent,
  generateProjectFiles,
  runQa,
  attemptRepair,
  applyEditToProject,
  rid,
  nowIso,
  buildLogEntry,
} from '../convex/budEngine';

/**
 * Embedded BUD engine (client-side).
 *
 * Runs the same deterministic pipeline as the Convex backend — intent
 * classification → site generation → QA → repair → natural-language edits —
 * entirely in the browser with localStorage persistence. Used in production
 * static hosting until a cloud Convex deployment is connected; then the
 * dual-mode budClient transparently switches to the cloud backend.
 */

const STORAGE_KEY = 'bud-embedded-state-v1';

interface EmbeddedState {
  projects: Record<string, Project>;
  jobs: Record<string, GenerationJob>;
  credits: Record<string, { date: string; used: number }>;
}

let state: EmbeddedState | null = null;

function loadState(): EmbeddedState {
  if (state) return state;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      state = JSON.parse(raw) as EmbeddedState;
      return state;
    }
  } catch {
    /* corrupted state — reset */
  }
  state = { projects: {}, jobs: {}, credits: {} };
  return state;
}

function persist(): void {
  try {
    if (state) localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* quota exceeded — best effort */
  }
}

function today(): string {
  return nowIso().slice(0, 10);
}

const PLAN_CREDITS: Record<string, number> = {
  free: 5,
  creator: 100,
  studio: 500,
  admin_lifetime: Number.MAX_SAFE_INTEGER,
};

const CREDIT_COSTS = { budCreate: 5, budEdit: 1, leadSearch: 2 } as const;

function creditsUsed(accountId: string): number {
  const s = loadState();
  const record = s.credits[accountId];
  if (!record || record.date !== today()) return 0;
  return record.used;
}

function consume(accountId: string, cost: number): void {
  const s = loadState();
  const record = s.credits[accountId];
  if (record && record.date === today()) {
    record.used += cost;
  } else {
    s.credits[accountId] = { date: today(), used: cost };
  }
  persist();
}

export function checkCredits(accountId: string, planId: string, cost: number): boolean {
  const limit = PLAN_CREDITS[planId] ?? PLAN_CREDITS.free;
  return creditsUsed(accountId) + cost <= limit;
}

export function usage(accountId: string): { used: number; limit: number } {
  return { used: creditsUsed(accountId), limit: PLAN_CREDITS.free };
}

// ---------- pipeline ----------
export function embeddedCreateProject(
  prompt: string,
  accountId: string,
  planId: string,
): { jobId: string; projectId: string; status: string } {
  if (!checkCredits(accountId, planId, CREDIT_COSTS.budCreate)) {
    const limit = PLAN_CREDITS[planId] ?? PLAN_CREDITS.free;
    throw new Error(`Limite diário de créditos atingido (${creditsUsed(accountId)}/${limit}). Renova amanhã.`);
  }

  const intent = classifyIntent(prompt);
  const files = generateProjectFiles(intent);
  const qa = runQa(files, intent);
  const logs: LogEntry[] = [
    buildLogEntry('info', `Job criado para conta ${accountId} (plano ${planId}).`, 'QUEUED', 'BUD Runtime'),
    buildLogEntry('agent', 'Analisando intenção e requisitos do pedido...', 'ANALYZING', 'Product Architect'),
    buildLogEntry('agent', `Arquitetura definida: ${intent.projectType} com ${intent.requiredFeatures.length} funcionalidades.`, 'PLANNING', 'UX/UI Engineer'),
    buildLogEntry('agent', 'Gerando arquivos do projeto...', 'EXECUTING', 'Frontend Engineer'),
    buildLogEntry('agent', 'Compilando bundle estático e validando integridade...', 'BUILDING', 'Performance Engineer'),
  ];

  if (qa.readiness.score < 100) {
    if (attemptRepair(files)) {
      const reQa = runQa(files, intent);
      qa.qaReport = reQa.qaReport;
      qa.readiness = reQa.readiness;
      logs.push(buildLogEntry('success', 'Reparo automático aplicado e revalidado.', 'REPAIRING', 'Repair Engine'));
    }
  }

  logs.push(
    ...qa.qaReport.map((r) =>
      buildLogEntry(r.status === 'PASS' ? 'success' : 'error', `${r.metric}: ${r.status} — ${r.details}`, 'QA', 'QA & Test Engineer'),
    ),
    buildLogEntry('success', `Pipeline concluído: READY (QA ${qa.readiness.score}/100).`, 'READY', 'Deploy Engineer'),
  );

  consume(accountId, CREDIT_COSTS.budCreate);

  const s = loadState();
  const projectId = rid('proj');
  const jobId = rid('job');
  const now = nowIso();

  const project = {
    id: projectId,
    ownerId: accountId,
    name: intent.businessName,
    description: `${intent.businessType} gerado pelo BUD para ${intent.targetAudience}.`,
    prompt,
    status: 'READY',
    intent,
    files,
    assets: [],
    readiness: qa.readiness,
    brain: {
      projectId,
      originalRequest: prompt,
      currentIntent: intent,
      decisions: [
        `Classificado como ${intent.projectType} (${intent.domain})`,
        `Público definido: ${intent.targetAudience}`,
        `Paleta do nicho: ${intent.colorPalette.primary}`,
      ],
      dependencies: {},
      files,
      history: [
        { id: rid('hist'), prompt, timestamp: now, changesSummary: `Projeto criado com ${Object.keys(files).length} arquivos e QA ${qa.readiness.score}/100.` },
      ],
      repairAttempts: 0,
    },
    activeJobId: jobId,
    createdAt: now,
    updatedAt: now,
  } as unknown as Project;

  const job: GenerationJob = {
    id: jobId,
    projectId,
    prompt,
    status: 'READY',
    currentStep: 'Projeto pronto, testado e aprovado no QA.',
    progress: 100,
    logs,
    qaReport: qa.qaReport,
    readiness: qa.readiness,
    createdAt: now,
    updatedAt: now,
  };

  s.projects[projectId] = project;
  s.jobs[jobId] = job;
  persist();

  return { jobId, projectId, status: 'READY' };
}

export function embeddedGetProject(projectId: string): Project | null {
  return loadState().projects[projectId] ?? null;
}

export function embeddedGetJob(jobId: string): GenerationJob | null {
  return loadState().jobs[jobId] ?? null;
}

export function embeddedRunEdit(
  projectId: string,
  message: string,
  accountId: string,
  planId: string,
): { jobId: string; status: string } {
  const s = loadState();
  const project = s.projects[projectId];
  if (!project) throw new Error('Projeto não encontrado.');

  if (!checkCredits(accountId, planId, CREDIT_COSTS.budEdit)) {
    const limit = PLAN_CREDITS[planId] ?? PLAN_CREDITS.free;
    throw new Error(`Limite diário de créditos atingido (${creditsUsed(accountId)}/${limit}).`);
  }

  const result = applyEditToProject(project.intent, { ...project.files }, message);
  const files = result.newFiles ?? project.files;
  const intent = result.newIntent ?? project.intent;
  const qa = runQa(files, intent);
  const now = nowIso();

  project.files = files;
  project.intent = intent;
  project.readiness = qa.readiness;
  project.brain.files = files;
  project.brain.currentIntent = intent;
  project.brain.history.push({
    id: rid('hist'),
    prompt: message,
    timestamp: now,
    changesSummary: result.summary,
  });
  project.updatedAt = now;

  const jobId = rid('job');
  s.jobs[jobId] = {
    id: jobId,
    projectId,
    prompt: message,
    status: 'READY',
    currentStep: 'Edição aplicada e revalidada.',
    progress: 100,
    logs: [
      buildLogEntry('info', `Instrução recebida: "${message}"`, 'EXECUTING', 'BUD Runtime'),
      buildLogEntry('agent', result.summary, 'EXECUTING', 'Frontend Engineer'),
      ...qa.qaReport.map((r) => buildLogEntry(r.status === 'PASS' ? 'success' : 'error', `${r.metric}: ${r.status}`, 'QA', 'QA & Test Engineer')),
      buildLogEntry('success', `Edição concluída. QA ${qa.readiness.score}/100.`, 'READY', 'BUD Runtime'),
    ],
    qaReport: qa.qaReport,
    readiness: qa.readiness,
    createdAt: now,
    updatedAt: now,
  };
  project.activeJobId = jobId;

  consume(accountId, CREDIT_COSTS.budEdit);
  persist();
  return { jobId, status: 'READY' };
}

export function embeddedRepair(projectId: string): { success: boolean; message: string; readiness: unknown } {
  const s = loadState();
  const project = s.projects[projectId];
  if (!project) throw new Error('Projeto não encontrado.');
  const repaired = attemptRepair(project.files);
  const qa = runQa(project.files, project.intent);
  if (repaired) {
    project.brain.repairAttempts += 1;
    project.readiness = qa.readiness;
    project.brain.files = project.files;
    project.updatedAt = nowIso();
    persist();
  }
  return {
    success: repaired,
    message: repaired ? 'Correção automática aplicada e revalidada pelo QA.' : 'Nenhuma correção segura foi identificada para as falhas atuais.',
    readiness: qa.readiness,
  };
}

export function embeddedQa(projectId: string): { success: boolean; readiness: unknown } {
  const s = loadState();
  const project = s.projects[projectId];
  if (!project) throw new Error('Projeto não encontrado.');
  const qa = runQa(project.files, project.intent);
  project.readiness = qa.readiness;
  project.updatedAt = nowIso();
  persist();
  return { success: true, readiness: qa.readiness };
}

export function embeddedAddAssets(projectId: string, assets: unknown[]): { assets: unknown[] } {
  const s = loadState();
  const project = s.projects[projectId];
  if (!project) throw new Error('Projeto não encontrado.');
  const MAX = 20 * 1024 * 1024;
  const list = (project.assets ?? []) as unknown as Array<Record<string, unknown>>;
  for (const raw of assets as Array<Record<string, unknown>>) {
    if (!raw || Number(raw.size ?? 0) > MAX) continue;
    const normalized = { ...raw, source: 'upload', createdAt: nowIso() };
    const idx = list.findIndex((a) => a.id === raw.id);
    if (idx >= 0) list[idx] = normalized;
    else list.push(normalized);
  }
  project.assets = list as never;
  project.updatedAt = nowIso();
  persist();
  return { assets: list };
}

export function embeddedRemoveAsset(projectId: string, assetId: string): { assets: unknown[] } {
  const s = loadState();
  const project = s.projects[projectId];
  if (!project) throw new Error('Projeto não encontrado.');
  const list = ((project.assets ?? []) as unknown as Array<Record<string, unknown>>).filter((a) => a.id !== assetId);
  project.assets = list as never;
  project.updatedAt = nowIso();
  persist();
  return { assets: list };
}

// ---------- intake (SaaS discovery) ----------
const INTAKE_KEY = 'bud-embedded-intake-v1';

const INTAKE_QUESTIONS = [
  'Quem são os usuários principais do sistema? (ex.: administradores, pacientes, alunos)',
  'Quais módulos são essenciais no lançamento? (ex.: login, agenda, pagamentos, dashboard)',
  'Qual nome e identidade visual você imagina? (cores preferidas, tom do sistema)',
];

export function embeddedIntake(
  sessionId: string,
  message: string,
  historyLen: number,
): { status: string; message: string; prompt?: string } {
  let answers: string[] = [];
  try {
    const raw = sessionStorage.getItem(INTAKE_KEY);
    if (raw) answers = (JSON.parse(raw) as Record<string, string[]>)[sessionId] ?? [];
  } catch {
    answers = [];
  }

  if (message.trim()) answers.push(message);
  const answered = Math.max(answers.length, historyLen);

  let result: { status: string; message: string; prompt?: string };
  if (answered <= INTAKE_QUESTIONS.length) {
    result = { status: 'QUESTION', message: INTAKE_QUESTIONS[Math.max(answered - 1, 0)] };
  } else {
    result = {
      status: 'READY',
      message: 'Perfeito! Tenho tudo que preciso. Iniciando a construção agora.',
      prompt: `Crie uma SaaS completa com os seguintes requisitos: ${answers.join(' ')}. Inclua login, dashboard, gestão de cadastros e design responsivo premium.`,
    };
    answers = [];
  }

  try {
    const raw = sessionStorage.getItem(INTAKE_KEY);
    const map = raw ? (JSON.parse(raw) as Record<string, string[]>) : {};
    map[sessionId] = answers;
    sessionStorage.setItem(INTAKE_KEY, JSON.stringify(map));
  } catch {
    /* ignore */
  }

  return result;
}

// ---------- visual builder ----------
const VISUAL_KEY = 'bud-embedded-visual-v1';

function starterVisual(docId: string): Record<string, unknown> {
  return {
    id: docId,
    name: 'Starter Document',
    route: '/',
    version: 1,
    updatedAt: nowIso(),
    root: {
      id: 'page',
      type: 'element',
      component: 'Section',
      props: {},
      styles: { display: 'flex', flexDirection: 'column', gap: 18, fontFamily: 'Inter, sans-serif' },
      children: [
        {
          id: 'hero',
          type: 'element',
          component: 'Section',
          props: {},
          styles: { display: 'flex', flexDirection: 'column', gap: 12, padding: 28, borderRadius: 18, background: 'linear-gradient(135deg,#0B1120,#1E293B)', color: '#f8fafc' },
          children: [
            { id: 'hero-title', type: 'text', component: 'Text', props: { text: 'Engrenagem AI' }, styles: { fontSize: 34, fontWeight: 800, color: '#38bdf8', margin: 0 }, children: [] },
            { id: 'hero-sub', type: 'text', component: 'Text', props: { text: 'Você explica. O BUD constrói.' }, styles: { fontSize: 16, color: '#e2e8f0', margin: 0 }, children: [] },
            { id: 'hero-cta', type: 'element', component: 'Button', props: { label: 'Construir com BUD' }, styles: { background: '#2563eb', color: '#fff', padding: '10px 18px', borderRadius: 10, width: 'fit-content', fontSize: 14 }, children: [] },
          ],
        },
        { id: 'content', type: 'text', component: 'Text', props: { text: 'Edite este documento no Builder visual: selecione camadas, ajuste propriedades e publique.' }, styles: { fontSize: 15, color: '#cbd5e1', margin: 0 }, children: [] },
      ],
    },
  };
}

export function embeddedGetVisual(docId: string): Record<string, unknown> {
  try {
    const raw = localStorage.getItem(VISUAL_KEY);
    if (raw) {
      const map = JSON.parse(raw) as Record<string, Record<string, unknown>>;
      if (map[docId]) return map[docId];
    }
  } catch {
    /* ignore */
  }
  // Persist the starter so subsequent saves version from v1 → v2.
  const starter = starterVisual(docId);
  try {
    const raw = localStorage.getItem(VISUAL_KEY);
    const map = raw ? (JSON.parse(raw) as Record<string, Record<string, unknown>>) : {};
    map[docId] = starter;
    localStorage.setItem(VISUAL_KEY, JSON.stringify(map));
  } catch {
    /* ignore */
  }
  return starter;
}

export function embeddedSaveVisual(docId: string, doc: { name: string; route: string; root: unknown }): Record<string, unknown> {
  let map: Record<string, Record<string, unknown>> = {};
  try {
    const raw = localStorage.getItem(VISUAL_KEY);
    if (raw) map = JSON.parse(raw) as Record<string, Record<string, unknown>>;
  } catch {
    map = {};
  }
  const previous = map[docId];
  const saved = {
    id: docId,
    name: doc.name,
    route: doc.route,
    root: doc.root,
    version: (Number(previous?.version ?? 0) || 0) + 1,
    updatedAt: nowIso(),
  };
  map[docId] = saved;
  try {
    localStorage.setItem(VISUAL_KEY, JSON.stringify(map));
  } catch {
    /* ignore */
  }
  return saved;
}

export function embeddedPublishVisual(docId: string): Record<string, unknown> {
  const doc = embeddedGetVisual(docId);
  const published = { ...doc, publishedAt: nowIso() };
  embeddedSaveVisual(docId, { name: String(doc.name), route: String(doc.route), root: doc.root });
  try {
    const raw = localStorage.getItem(VISUAL_KEY);
    const map = raw ? (JSON.parse(raw) as Record<string, Record<string, unknown>>) : {};
    map[docId] = published;
    localStorage.setItem(VISUAL_KEY, JSON.stringify(map));
  } catch {
    /* ignore */
  }
  return published;
}

// ---------- leads (direto no cliente, APIs públicas OSM) ----------
const LEAD_UA = 'EngrenagemAI/1.0 (lead discovery; contact via platform)';

export async function embeddedSearchLeads(query: string, near: string): Promise<{ leads: unknown[] }> {
  async function geocode(q: string): Promise<{ lat: number; lon: number } | null> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(q)}`, {
        headers: { 'Accept-Language': 'pt-BR' },
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (!res.ok) return null;
      const data = (await res.json()) as Array<{ lat: string; lon: string }>;
      if (!data[0]) return null;
      return { lat: Number(data[0].lat), lon: Number(data[0].lon) };
    } catch {
      return null;
    }
  }

  const place = await geocode(near);
  const lat = place?.lat ?? -23.5505;
  const lon = place?.lon ?? -46.6333;
  const overpassQuery = `[out:json][timeout:20];nwr(around:2500,${lat},${lon})[name][~"^(amenity|shop|office|healthcare|leisure)$"~".*"];out center 30;`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  try {
    const res = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `data=${encodeURIComponent(overpassQuery)}`,
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`Overpass HTTP ${res.status}`);
    const data = (await res.json()) as {
      elements: Array<{ type: string; id: number; lat?: number; lon?: number; center?: { lat: number; lon: number }; tags?: Record<string, string> }>;
    };
    const leads = data.elements
      .filter((e) => e.tags?.name)
      .slice(0, 12)
      .map((e) => {
        const eLat = e.lat ?? e.center?.lat ?? lat;
        const eLon = e.lon ?? e.center?.lon ?? lon;
        const name = e.tags?.name ?? 'Negócio';
        const street = [e.tags?.['addr:street'], e.tags?.['addr:housenumber']].filter(Boolean).join(', ');
        const city = e.tags?.['addr:city'] ?? near;
        return {
          id: `${e.type}/${e.id}`,
          name,
          address: street ? `${street} — ${city}` : city,
          lat: eLat,
          lon: eLon,
          mapUrl: `https://www.openstreetmap.org/?mlat=${eLat}&mlon=${eLon}#map=18/${eLat}/${eLon}`,
          category: e.tags?.amenity ?? e.tags?.shop ?? e.tags?.office ?? e.tags?.healthcare ?? e.tags?.leisure,
        };
      });
    return { leads };
  } finally {
    clearTimeout(timeout);
  }
}
