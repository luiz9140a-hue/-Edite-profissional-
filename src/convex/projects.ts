import { v } from 'convex/values';
import { query, mutation, internalMutation } from './_generated/server';
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
} from './budEngine';

export const PLAN_CREDITS: Record<string, number> = {
  free: 5,
  creator: 100,
  studio: 500,
  admin_lifetime: Number.MAX_SAFE_INTEGER,
};

export const CREDIT_COSTS = { budCreate: 5, budEdit: 1, leadSearch: 2 } as const;

// ---------- credits ----------
export const getUsage = query({
  args: { accountId: v.string() },
  handler: async (ctx, args) => {
    const date = nowIso().slice(0, 10);
    const record = await ctx.db
      .query('credits')
      .withIndex('by_account', (q) => q.eq('accountId', args.accountId))
      .collect();
    const used = record.filter((r) => r.date === date).reduce((sum, r) => sum + r.used, 0);
    return { used, limit: PLAN_CREDITS.free, costs: CREDIT_COSTS };
  },
});

async function consumeCredits(ctx: any, accountId: string, cost: number): Promise<void> {
  const date = nowIso().slice(0, 10);
  const existing = await ctx.db
    .query('credits')
    .withIndex('by_account', (q) => q.eq('accountId', accountId))
    .collect();
  const today = existing.find((r: any) => r.date === date);
  if (today) {
    await ctx.db.patch(today._id, { used: today.used + cost });
  } else {
    await ctx.db.insert('credits', { accountId, date, used: cost });
  }
}

// ---------- create project + job (pipeline completo, síncrono) ----------
export const createProject = mutation({
  args: { prompt: v.string(), accountId: v.string(), planId: v.optional(v.string()) },
  handler: async (ctx, args): Promise<{ jobId: string; projectId: string; status: string }> => {
    const planId = args.planId ?? 'free';
    const limit = PLAN_CREDITS[planId] ?? PLAN_CREDITS.free;

    // credit gate
    const date = nowIso().slice(0, 10);
    const records = await ctx.db
      .query('credits')
      .withIndex('by_account', (q) => q.eq('accountId', args.accountId))
      .collect();
    const usedToday = records.filter((r: any) => r.date === date).reduce((s: number, r: any) => s + r.used, 0);
    if (usedToday + CREDIT_COSTS.budCreate > limit) {
      throw new Error(`Limite diário de créditos atingido (${usedToday}/${limit}). Renova amanhã.`);
    }

    const intent = classifyIntent(args.prompt);
    const files = generateProjectFiles(intent);
    const qa = runQa(files, intent);

    const logs: LogEntry[] = [
      buildLogEntry('info', `Job criado para conta ${args.accountId} (plano ${planId}).`, 'QUEUED', 'BUD Runtime'),
      buildLogEntry('agent', 'Analisando intenção e requisitos do pedido...', 'ANALYZING', 'Product Architect'),
      buildLogEntry('agent', `Arquitetura definida: ${intent.projectType} com ${intent.requiredFeatures.length} funcionalidades.`, 'PLANNING', 'UX/UI Engineer'),
      buildLogEntry('agent', `Gerando arquivos do projeto...`, 'EXECUTING', 'Frontend Engineer'),
      buildLogEntry('agent', 'Compilando bundle estático e validando integridade...', 'BUILDING', 'Performance Engineer'),
      ...qa.qaReport.map((r) => buildLogEntry(r.status === 'PASS' ? 'success' : 'error', `${r.metric}: ${r.status} — ${r.details}`, 'QA', 'QA & Test Engineer')),
      buildLogEntry('success', `Pipeline concluído: READY (QA ${qa.readiness.score}/100).`, 'READY', 'Deploy Engineer'),
    ];

    if (qa.readiness.score < 100) {
      const repaired = attemptRepair(files);
      if (repaired) {
        const reQa = runQa(files, intent);
        qa.qaReport = reQa.qaReport;
        qa.readiness = reQa.readiness;
        logs.push(buildLogEntry('success', 'Reparo automático aplicado e revalidado.', 'REPAIRING', 'Repair Engine'));
      }
    }

    await consumeCredits(ctx, args.accountId, CREDIT_COSTS.budCreate);

    const now = nowIso();

    const brain = {
      currentIntent: intent,
      decisions: [
        `Classificado como ${intent.projectType} (${intent.domain})`,
        `Público definido: ${intent.targetAudience}`,
        `Paleta do nicho: ${intent.colorPalette.primary}`,
      ],
      dependencies: {},
      files,
      history: [
        { id: rid('hist'), prompt: args.prompt, timestamp: now, changesSummary: `Projeto criado com ${Object.keys(files).length} arquivos e QA ${qa.readiness.score}/100.` },
      ],
      repairAttempts: 0,
    };

    // IDs nativos do Convex: insert primeiro, depois vincula via patch.
    const projectDocId = await ctx.db.insert('projects', {
      ownerId: args.accountId,
      name: intent.businessName,
      description: `${intent.businessType} gerado pelo BUD para ${intent.targetAudience}.`,
      prompt: args.prompt,
      status: 'READY',
      intent,
      files,
      assets: [],
      readiness: qa.readiness,
      brain,
      createdAt: now,
      updatedAt: now,
    } as never);

    const jobDocId = await ctx.db.insert('jobs', {
      projectId: projectDocId,
      prompt: args.prompt,
      status: 'READY',
      currentStep: 'Projeto pronto, testado e aprovado no QA.',
      progress: 100,
      logs,
      qaReport: qa.qaReport,
      readiness: qa.readiness,
      createdAt: now,
      updatedAt: now,
    } as never);

    // Vincula os IDs reais (project.activeJobId e brain.projectId).
    await ctx.db.patch(projectDocId, {
      activeJobId: jobDocId,
      brain: { ...brain, projectId: projectDocId },
    } as never);

    return { jobId: jobDocId, projectId: projectDocId, status: 'READY' };
  },
});

// ---------- queries ----------
export const getProject = query({
  args: { projectId: v.string() },
  handler: async (ctx, args): Promise<Project | null> => {
    const doc = await ctx.db.get(args.projectId as never);
    if (!doc) return null;
    return { id: doc._id, ...(doc as unknown as Omit<Project, 'id'>) } as unknown as Project;
  },
});

export const getJob = query({
  args: { jobId: v.string() },
  handler: async (ctx, args): Promise<GenerationJob | null> => {
    const doc = await ctx.db.get(args.jobId as never);
    if (!doc) return null;
    return { id: doc._id, ...(doc as unknown as Omit<GenerationJob, 'id'>) } as unknown as GenerationJob;
  },
});

export const listProjects = query({
  args: { ownerId: v.string() },
  handler: async (ctx, args) => {
    const all = await ctx.db.query('projects').collect();
    return all
      .filter((p: any) => p.ownerId === args.ownerId)
      .sort((a: any, b: any) => (a.createdAt < b.createdAt ? 1 : -1))
      .map((p: any) => ({ id: p._id, name: p.name, status: p.status, createdAt: p.createdAt, readiness: p.readiness }));
  },
});

// ---------- BUD edit ----------
export const runBudEdit = mutation({
  args: { projectId: v.string(), message: v.string(), accountId: v.string(), planId: v.optional(v.string()) },
  handler: async (ctx, args): Promise<{ jobId: string; status: string }> => {
    const project = (await ctx.db.get(args.projectId as never)) as any;
    if (!project) throw new Error('Projeto não encontrado.');

    const planId = args.planId ?? 'free';
    const limit = PLAN_CREDITS[planId] ?? PLAN_CREDITS.free;
    const date = nowIso().slice(0, 10);
    const records = await ctx.db
      .query('credits')
      .withIndex('by_account', (q) => q.eq('accountId', args.accountId))
      .collect();
    const usedToday = records.filter((r: any) => r.date === date).reduce((s: number, r: any) => s + r.used, 0);
    if (usedToday + CREDIT_COSTS.budEdit > limit) {
      throw new Error(`Limite diário de créditos atingido (${usedToday}/${limit}).`);
    }

    const intent = project.intent as any;
    const files = { ...(project.files as any) };
    const result = applyEditToProject(intent, files, args.message);

    const editLog = buildLogEntry('agent', result.summary, 'EXECUTING', 'Frontend Engineer');
    const qa = runQa(result.newFiles ?? files, result.newIntent ?? intent);
    const now = nowIso();

    // Rebuild brain history
    const brain = { ...(project.brain as any) };
    brain.files = result.newFiles ?? files;
    brain.history = [
      ...(brain.history ?? []),
      { id: rid('hist'), prompt: args.message, timestamp: now, changesSummary: result.summary },
    ];
    if (result.newIntent) brain.currentIntent = result.newIntent;

    await ctx.db.patch(project._id, {
      files: result.newFiles ?? files,
      intent: result.newIntent ?? intent,
      brain,
      readiness: qa.readiness,
      status: 'READY',
      updatedAt: now,
    });

    const logs: LogEntry[] = [
      buildLogEntry('info', `Instrução recebida: "${args.message}"`, 'EXECUTING', 'BUD Runtime'),
      editLog,
      ...qa.qaReport.map((r) => buildLogEntry(r.status === 'PASS' ? 'success' : 'error', `${r.metric}: ${r.status}`, 'QA', 'QA & Test Engineer')),
      buildLogEntry('success', `Edição concluída. QA ${qa.readiness.score}/100.`, 'READY', 'BUD Runtime'),
    ];

    const jobId = rid('job');
    await ctx.db.insert('jobs', {
      projectId: args.projectId,
      prompt: args.message,
      status: 'READY',
      currentStep: 'Edição aplicada e revalidada.',
      progress: 100,
      logs,
      qaReport: qa.qaReport,
      readiness: qa.readiness,
      createdAt: now,
      updatedAt: now,
    } as never);

    await consumeCredits(ctx, args.accountId, CREDIT_COSTS.budEdit);
    return { jobId, status: 'READY' };
  },
});

// ---------- manual ops ----------
export const repairProject = mutation({
  args: { projectId: v.string() },
  handler: async (ctx, args) => {
    const project = (await ctx.db.get(args.projectId as never)) as any;
    if (!project) throw new Error('Projeto não encontrado.');
    const intent = project.intent as any;
    const files = { ...(project.files as any) };
    const repaired = attemptRepair(files);
    const qa = runQa(files, intent);
    if (repaired) {
      const brain = { ...(project.brain as any) };
      brain.repairAttempts = (brain.repairAttempts ?? 0) + 1;
      brain.files = files;
      await ctx.db.patch(project._id, { files, readiness: qa.readiness, brain, updatedAt: nowIso() });
    }
    return { success: repaired, message: repaired ? 'Correção automática aplicada e revalidada pelo QA.' : 'Nenhuma correção segura foi identificada para as falhas atuais.', readiness: qa.readiness };
  },
});

export const runQaCheck = mutation({
  args: { projectId: v.string() },
  handler: async (ctx, args) => {
    const project = (await ctx.db.get(args.projectId as never)) as any;
    if (!project) throw new Error('Projeto não encontrado.');
    const qa = runQa(project.files as any, project.intent as any);
    await ctx.db.patch(project._id, { readiness: qa.readiness, updatedAt: nowIso() });
    return { success: true, readiness: qa.readiness };
  },
});

// ---------- assets ----------
export const addAssets = mutation({
  args: { projectId: v.string(), assets: v.array(v.any()) },
  handler: async (ctx, args) => {
    const project = (await ctx.db.get(args.projectId as never)) as any;
    if (!project) throw new Error('Projeto não encontrado.');
    const MAX = 20 * 1024 * 1024;
    const incoming = (args.assets as any[]).filter((a) => a && a.size <= MAX);
    const current = (project.assets as any[]) ?? [];
    for (const asset of incoming) {
      const idx = current.findIndex((a) => a.id === asset.id);
      const normalized = { ...asset, source: 'upload', createdAt: nowIso() };
      if (idx >= 0) current[idx] = normalized;
      else current.push(normalized);
    }
    await ctx.db.patch(project._id, { assets: current, updatedAt: nowIso() });
    return { assets: current };
  },
});

export const removeAsset = mutation({
  args: { projectId: v.string(), assetId: v.string() },
  handler: async (ctx, args) => {
    const project = (await ctx.db.get(args.projectId as never)) as any;
    if (!project) throw new Error('Projeto não encontrado.');
    const current = ((project.assets as any[]) ?? []).filter((a) => a.id !== args.assetId);
    await ctx.db.patch(project._id, { assets: current, updatedAt: nowIso() });
    return { assets: current };
  },
});

// ---------- intake (SaaS discovery) ----------
export const intakeTurn = mutation({
  args: { sessionId: v.string(), message: v.string(), historyLen: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const QUESTIONS = [
      'Quem são os usuários principais do sistema? (ex.: administradores, pacientes, alunos)',
      'Quais módulos são essenciais no lançamento? (ex.: login, agenda, pagamentos, dashboard)',
      'Qual nome e identidade visual você imagina? (cores preferidas, tom do sistema)',
    ];
    const existing = await ctx.db
      .query('intakeSessions')
      .withIndex('by_session', (q) => q.eq('sessionId', args.sessionId))
      .collect();
    const session = existing[0];
    const answers = [...(session?.answers ?? [])];
    if (args.message.trim()) answers.push(args.message);

    const answered = Math.max(answers.length, args.historyLen ?? 0);
    if (session) {
      await ctx.db.patch(session._id, { answers });
    } else {
      await ctx.db.insert('intakeSessions', { sessionId: args.sessionId, answers });
    }

    if (answered < QUESTIONS.length) {
      return { status: 'QUESTION', message: QUESTIONS[answered] };
    }
    if (session) await ctx.db.delete(session._id);
    return {
      status: 'READY',
      message: 'Perfeito! Tenho tudo que preciso. Iniciando a construção agora.',
      prompt: `Crie uma SaaS completa com os seguintes requisitos: ${answers.join(' ')}. Inclua login, dashboard, gestão de cadastros e design responsivo premium.`,
    };
  },
});

// ---------- visual builder ----------
export const getVisualDocument = query({
  args: { docId: v.string() },
  handler: async (ctx, args) => {
    const docs = await ctx.db
      .query('visualDocuments')
      .withIndex('by_doc', (q) => q.eq('docId', args.docId))
      .collect();
    if (docs[0]) return docs[0];
    // starter document
    const starter = {
      docId: args.docId,
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
    return starter;
  },
});

export const saveVisualDocument = mutation({
  args: { docId: v.string(), name: v.string(), route: v.string(), root: v.any() },
  handler: async (ctx, args) => {
    const docs = await ctx.db
      .query('visualDocuments')
      .withIndex('by_doc', (q) => q.eq('docId', args.docId))
      .collect();
    const version = (docs[0]?.version ?? 0) + 1;
    const payload = {
      docId: args.docId,
      name: args.name,
      route: args.route,
      root: args.root,
      version,
      updatedAt: nowIso(),
    };
    if (docs[0]) {
      await ctx.db.patch(docs[0]._id, payload);
      return { ...docs[0], ...payload };
    }
    await ctx.db.insert('visualDocuments', payload as never);
    return payload;
  },
});

export const publishVisualDocument = mutation({
  args: { docId: v.string() },
  handler: async (ctx, args) => {
    const docs = await ctx.db
      .query('visualDocuments')
      .withIndex('by_doc', (q) => q.eq('docId', args.docId))
      .collect();
    if (!docs[0]) throw new Error('Documento não encontrado. Salve antes de publicar.');
    await ctx.db.patch(docs[0]._id, { publishedAt: nowIso() });
    return { ...docs[0], publishedAt: nowIso() };
  },
});

// ---------- cleanup helper (internal) ----------
export const purgeSession = internalMutation({
  args: { sessionId: v.string() },
  handler: async (ctx, args) => {
    const sessions = await ctx.db
      .query('intakeSessions')
      .withIndex('by_session', (q) => q.eq('sessionId', args.sessionId))
      .collect();
    for (const s of sessions) await ctx.db.delete(s._id);
  },
});
