import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import type { IntentContract, ProjectBrain } from '../../src/types/engrenagem.ts';
import type { ProjectPlan } from '../../core/planning/planner.ts';
import { providerRouter } from '../../core/provider-router/providerRouter.ts';

export type BudMode = 'CREATE' | 'EDIT' | 'REPAIR' | 'DEPLOY';
export type BudFailureClass = 'RECOVERABLE' | 'BLOCKING' | 'CONFIGURATION' | 'EXTERNAL_PROVIDER';

export interface BudSupervisorInput {
  prompt: string;
  mode: BudMode;
  intent?: IntentContract;
  projectBrain?: ProjectBrain;
  plan?: ProjectPlan;
  knownErrors?: string[];
  currentProjectState?: unknown;
}

export interface BudSupervisorDecision {
  objective: string;
  executionMode: BudMode;
  priorities: string[];
  risks: string[];
  acceptanceChecks: string[];
  nextActions: string[];
  failureClass?: BudFailureClass;
  provider: 'gemini' | 'deterministic';
  model: string;
  thinkingLevel: 'low' | 'medium' | 'high';
  message?: string;
}

const DEFAULT_MODEL = 'gemini-3.8-flash';
const DEFAULT_THINKING_LEVEL = 'high';

function configuredApiKey(): string | undefined {
  const key = process.env.GEMINI_API_KEY?.trim();
  return key && key !== 'MY_GEMINI_API_KEY' ? key : undefined;
}

function thinkingLevel(): 'low' | 'medium' | 'high' {
  const level = String(process.env.BUD_THINKING_LEVEL || DEFAULT_THINKING_LEVEL).toLowerCase();
  return level === 'low' || level === 'medium' ? level : 'high';
}

function deterministicDecision(input: BudSupervisorInput, reason?: string): BudSupervisorDecision {
  const isEdit = input.mode === 'EDIT';
  const isRepair = input.mode === 'REPAIR';
  return {
    objective: input.prompt,
    executionMode: input.mode,
    priorities: isRepair
      ? ['diagnosticar falhas obrigatórias', 'aplicar patch mínimo', 'revalidar QA']
      : isEdit
        ? ['consultar ProjectBrain', 'alterar somente arquivos afetados', 'preservar contratos existentes']
        : ['fixar intenção', 'planejar arquitetura', 'gerar arquivos executáveis', 'validar preview'],
    risks: input.knownErrors?.length ? input.knownErrors : ['dependências externas podem estar indisponíveis'],
    acceptanceChecks: ['estrutura de arquivos válida', 'QA funcional', 'QA responsivo', 'preview executável', 'nenhum segredo no frontend'],
    nextActions: isRepair ? ['diagnosticar', 'patch mínimo', 'executar QA novamente'] : ['analisar intenção', 'criar plano', 'executar pipeline', 'validar resultado'],
    failureClass: reason ? 'CONFIGURATION' : undefined,
    provider: 'deterministic',
    model: DEFAULT_MODEL,
    thinkingLevel: thinkingLevel(),
    message: reason || 'BUD AI Supervisor não configurado — executando modo determinístico.'
  };
}

function extractJson(text: string): unknown {
  const trimmed = text.trim();
  try { return JSON.parse(trimmed); } catch { /* continue */ }
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i)?.[1];
  if (fenced) {
    try { return JSON.parse(fenced); } catch { /* continue */ }
  }
  const object = trimmed.match(/\{[\s\S]*\}/)?.[0];
  if (object) {
    try { return JSON.parse(object); } catch { /* continue */ }
  }
  return null;
}

function normalizeDecision(raw: any, input: BudSupervisorInput): BudSupervisorDecision {
  const asStrings = (value: unknown, fallback: string[]) => Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string').slice(0, 12) : fallback;
  return {
    objective: typeof raw?.objective === 'string' ? raw.objective : input.prompt,
    executionMode: input.mode,
    priorities: asStrings(raw?.priorities, ['analisar intenção', 'executar pipeline', 'validar resultado']),
    risks: asStrings(raw?.risks, []),
    acceptanceChecks: asStrings(raw?.acceptanceChecks, ['QA funcional', 'QA responsivo', 'preview executável']),
    nextActions: asStrings(raw?.nextActions, ['executar pipeline', 'validar resultado']),
    failureClass: ['RECOVERABLE', 'BLOCKING', 'CONFIGURATION', 'EXTERNAL_PROVIDER'].includes(raw?.failureClass) ? raw.failureClass : undefined,
    provider: 'gemini',
    model: String(process.env.GEMINI_MODEL || DEFAULT_MODEL),
    thinkingLevel: thinkingLevel()
  };
}

export async function runBudSupervisor(input: BudSupervisorInput): Promise<BudSupervisorDecision> {
  if (process.env.BUD_ENABLED === 'false') return deterministicDecision(input, 'BUD AI Supervisor desativado — executando modo determinístico.');
  const apiKey = configuredApiKey();
  if (!apiKey) return deterministicDecision(input);

  const model = process.env.GEMINI_MODEL || DEFAULT_MODEL;
  const level = thinkingLevel();
  const ai = new GoogleGenAI({ apiKey });
  const context = JSON.stringify({
    prompt: input.prompt,
    mode: input.mode,
    intent: input.intent,
    projectBrain: input.projectBrain,
    plan: input.plan,
    knownErrors: input.knownErrors || [],
    currentProjectState: input.currentProjectState
  });
  const instruction = `Você é o BUD Supervisor do SUPREMEBUILDMOD. Decida a próxima execução do pipeline real, não apenas dê conselhos. Preserve a arquitetura existente e, em EDIT/REPAIR, prefira mudanças mínimas. Responda somente JSON válido com as chaves objective, executionMode, priorities (array), risks (array), acceptanceChecks (array), nextActions (array), failureClass (RECOVERABLE|BLOCKING|CONFIGURATION|EXTERNAL_PROVIDER opcional). Contexto: ${context}`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: instruction,
      config: {
        responseMimeType: 'application/json',
        thinkingConfig: { thinkingLevel: level === 'low' ? ThinkingLevel.LOW : level === 'medium' ? ThinkingLevel.MEDIUM : ThinkingLevel.HIGH }
      }
    });
    const parsed = extractJson(response.text || '');
    if (!parsed) throw new Error('Gemini não retornou uma decisão JSON válida.');
    providerRouter.setStatus('gemini', 'AVAILABLE', `Conectado via ${model}.`);
    return normalizeDecision(parsed, input);
  } catch (error: any) {
    const errorMessage = String(error?.message || 'erro externo');
    providerRouter.setStatus('gemini', /429|rate.?limit/i.test(errorMessage) ? 'RATE_LIMITED' : 'ERROR', `Fallback determinístico ativo: ${errorMessage}`);
    console.warn(`[BUD Supervisor] Gemini indisponível; fallback determinístico: ${errorMessage}`);
    return deterministicDecision(input, `Supervisor Gemini indisponível — executando modo determinístico (${errorMessage}).`);
  }
}

export function getBudRuntimeHealth() {
  const configured = Boolean(configuredApiKey());
  return {
    enabled: process.env.BUD_ENABLED !== 'false',
    mode: 'SUPREME_BUILD',
    model: process.env.GEMINI_MODEL || DEFAULT_MODEL,
    configured,
    thinkingLevel: thinkingLevel(),
    fallback: 'deterministic-planner',
    maxRepairAttempts: Number(process.env.BUD_MAX_REPAIR_ATTEMPTS || 5)
  };
}
