import crypto from 'node:crypto';

export type BudStatus = 'QUEUED' | 'PLANNING' | 'EXECUTING' | 'BUILDING' | 'TESTING' | 'PREVIEWING' | 'QA' | 'REPAIRING' | 'READY' | 'BLOCKED' | 'FAILED' | 'TIMEOUT' | 'CANCELLED';
export type ActionType = 'PLAN' | 'GENERATE' | 'EDIT' | 'BUILD' | 'TEST' | 'PREVIEW' | 'BROWSER_TEST' | 'QA' | 'REPAIR' | 'DEPLOY';

export interface BudExecutionLimits {
  maxDurationMs: number;
  maxSteps: number;
  maxToolCalls: number;
  maxBuildAttempts: number;
  maxTestAttempts: number;
  maxPreviewAttempts: number;
  maxRepairAttempts: number;
  maxDeployAttempts: number;
  maxIdenticalFailures: number;
  maxIdenticalActions: number;
}

export const DEFAULT_BUD_LIMITS: BudExecutionLimits = {
  maxDurationMs: 15 * 60 * 1000,
  maxSteps: 40,
  maxToolCalls: 80,
  maxBuildAttempts: 3,
  maxTestAttempts: 3,
  maxPreviewAttempts: 2,
  maxRepairAttempts: 5,
  maxDeployAttempts: 2,
  maxIdenticalFailures: 2,
  maxIdenticalActions: 2
};

const finite = (name: string, fallback: number): number => {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value >= 1 ? Math.floor(value) : fallback;
};

export function configuredBudLimits(overrides: Partial<BudExecutionLimits> = {}): BudExecutionLimits {
  return {
    maxDurationMs: finite('BUD_MAX_JOB_DURATION_MS', DEFAULT_BUD_LIMITS.maxDurationMs),
    maxSteps: finite('BUD_MAX_STEPS', DEFAULT_BUD_LIMITS.maxSteps),
    maxToolCalls: finite('BUD_MAX_TOOL_CALLS', DEFAULT_BUD_LIMITS.maxToolCalls),
    maxBuildAttempts: finite('BUD_MAX_BUILD_ATTEMPTS', DEFAULT_BUD_LIMITS.maxBuildAttempts),
    maxTestAttempts: finite('BUD_MAX_TEST_ATTEMPTS', DEFAULT_BUD_LIMITS.maxTestAttempts),
    maxPreviewAttempts: finite('BUD_MAX_PREVIEW_ATTEMPTS', DEFAULT_BUD_LIMITS.maxPreviewAttempts),
    maxRepairAttempts: finite('BUD_MAX_REPAIR_ATTEMPTS', DEFAULT_BUD_LIMITS.maxRepairAttempts),
    maxDeployAttempts: finite('BUD_MAX_DEPLOY_ATTEMPTS', DEFAULT_BUD_LIMITS.maxDeployAttempts),
    maxIdenticalFailures: finite('BUD_MAX_IDENTICAL_FAILURES', DEFAULT_BUD_LIMITS.maxIdenticalFailures),
    maxIdenticalActions: finite('BUD_MAX_IDENTICAL_ACTIONS', DEFAULT_BUD_LIMITS.maxIdenticalActions),
    ...overrides
  };
}

export interface BudEvidence { type: 'COMMAND' | 'BUILD' | 'TEST' | 'PREVIEW' | 'HTTP' | 'FILE' | 'ROUTE' | 'API' | 'AUTH' | 'DEPLOY' | 'QA' | 'REPAIR'; message: string; data?: Record<string, unknown>; timestamp: number; }
export interface BudActionResult { success: boolean; action: ActionType; message?: string; errorCode?: string; filesChanged?: string[]; evidence?: BudEvidence[]; changedState?: boolean; stateHash?: string; output?: Record<string, unknown>; }
export interface BudContext {
  jobId: string; projectId: string; userId: string; runId: string; status: BudStatus; currentStep: number; startedAt: number; deadline: number;
  buildAttempts: number; testAttempts: number; previewAttempts: number; repairAttempts: number; deployAttempts: number; toolCalls: number;
  lastErrorFingerprint?: string; identicalFailureCount: number; lastActionHash?: string; identicalActionCount: number; lastStateHash?: string;
  evidence: BudEvidence[]; completedActions: ActionType[]; blockedReason?: string;
}
export interface BudCheckpoint { jobId: string; runId: string; projectId: string; status: BudStatus; currentStep: number; currentPhase?: ActionType; buildAttempts: number; testAttempts: number; previewAttempts: number; repairAttempts: number; deployAttempts: number; toolCalls: number; lastErrorFingerprint?: string; lastStateHash?: string; lastActionHash?: string; blockedReason?: string; timestamp: number; }
export interface BudRuntimeDependencies {
  persistCheckpoint: (checkpoint: BudCheckpoint) => Promise<void>;
  executeAction: (action: ActionType, context: BudContext) => Promise<BudActionResult>;
  decideNextAction: (context: BudContext) => Promise<ActionType | null>;
}

export class BudExecutionRuntime {
  private readonly limits: BudExecutionLimits;
  constructor(private readonly deps: BudRuntimeDependencies, limits: Partial<BudExecutionLimits> = {}) { this.limits = configuredBudLimits(limits); }

  public async run(input: { jobId: string; projectId: string; userId: string; resumeFrom?: Partial<BudContext> }): Promise<BudContext> {
    const now = Date.now();
    const resume = input.resumeFrom || {};
    const context: BudContext = {
      jobId: input.jobId, projectId: input.projectId, userId: input.userId, runId: resume.runId || crypto.randomUUID(),
      status: resume.status || 'QUEUED', currentStep: resume.currentStep || 0, startedAt: resume.startedAt || now,
      deadline: resume.deadline || now + this.limits.maxDurationMs, buildAttempts: resume.buildAttempts || 0,
      testAttempts: resume.testAttempts || 0, previewAttempts: resume.previewAttempts || 0, repairAttempts: resume.repairAttempts || 0,
      deployAttempts: resume.deployAttempts || 0, toolCalls: resume.toolCalls || 0, lastErrorFingerprint: resume.lastErrorFingerprint,
      identicalFailureCount: resume.identicalFailureCount || 0, lastActionHash: resume.lastActionHash, identicalActionCount: resume.identicalActionCount || 0,
      lastStateHash: resume.lastStateHash, evidence: resume.evidence || [], completedActions: resume.completedActions || [], blockedReason: resume.blockedReason
    };

    while (!this.isTerminal(context.status)) {
      const budget = this.checkExecutionBudget(context);
      if (!budget.allowed) { await this.stop(context, budget.status || 'BLOCKED', budget.reason || 'Execution budget exceeded'); break; }
      const action = await this.selectNextAction(context);
      if (!action) { await this.stop(context, 'BLOCKED', 'No valid next action was returned by the supervisor.'); break; }
      const actionBudget = this.checkActionBudget(action, context);
      if (!actionBudget.allowed) { await this.stop(context, actionBudget.status || 'BLOCKED', actionBudget.reason || `Action ${action} is not allowed anymore.`); break; }
      const hash = this.createActionHash(action, context);
      if (this.isDuplicateAction(hash, context)) { await this.stop(context, 'BLOCKED', `Repeated action without state progress: ${action}`); break; }
      context.currentStep += 1; context.toolCalls += 1; context.lastActionHash = hash; context.status = this.statusForAction(action);
      await this.persist(context, action);
      let result: BudActionResult;
      try { result = await this.deps.executeAction(action, context); } catch (error) { result = { success: false, action, errorCode: 'ACTION_EXCEPTION', message: error instanceof Error ? error.message : String(error), changedState: false }; }
      this.recordResult(context, result);
      await this.persist(context, action);
      if (result.success) { this.handleSuccess(context, result); continue; }
      const failure = this.handleFailure(context, result);
      if (!failure.continue) { await this.stop(context, failure.status || 'BLOCKED', failure.reason || result.message || 'Execution failed.'); break; }
      context.status = 'REPAIRING';
      await this.persist(context, 'REPAIR');
    }
    return context;
  }

  private async selectNextAction(context: BudContext): Promise<ActionType | null> { return this.deps.decideNextAction(context); }
  private checkExecutionBudget(context: BudContext): { allowed: boolean; status?: BudStatus; reason?: string } {
    if (Date.now() >= context.deadline) return { allowed: false, status: 'TIMEOUT', reason: 'Global execution deadline exceeded.' };
    if (context.currentStep >= this.limits.maxSteps) return { allowed: false, status: 'BLOCKED', reason: 'Maximum execution steps exceeded.' };
    if (context.toolCalls >= this.limits.maxToolCalls) return { allowed: false, status: 'BLOCKED', reason: 'Maximum tool calls exceeded.' };
    return { allowed: true };
  }
  private checkActionBudget(action: ActionType, context: BudContext): { allowed: boolean; status?: BudStatus; reason?: string } {
    const checks: Partial<Record<ActionType, [number, number, string]>> = {
      BUILD: [context.buildAttempts, this.limits.maxBuildAttempts, 'Maximum build attempts exceeded.'],
      TEST: [context.testAttempts, this.limits.maxTestAttempts, 'Maximum test attempts exceeded.'],
      PREVIEW: [context.previewAttempts, this.limits.maxPreviewAttempts, 'Maximum preview attempts exceeded.'],
      REPAIR: [context.repairAttempts, this.limits.maxRepairAttempts, 'Maximum repair attempts exceeded.'],
      DEPLOY: [context.deployAttempts, this.limits.maxDeployAttempts, 'Maximum deployment attempts exceeded.']
    };
    const check = checks[action];
    return check && check[0] >= check[1] ? { allowed: false, status: 'BLOCKED', reason: check[2] } : { allowed: true };
  }
  private handleSuccess(context: BudContext, result: BudActionResult): void {
    context.identicalFailureCount = 0;
    if (result.stateHash) context.lastStateHash = result.stateHash;
    if (!context.completedActions.includes(result.action)) context.completedActions.push(result.action);
    if (result.action === 'QA') {
      if (this.hasRequiredEvidence(context)) context.status = 'READY';
      else { context.status = 'BLOCKED'; context.blockedReason = 'QA returned success but required final evidence is missing.'; }
    }
  }
  private handleFailure(context: BudContext, result: BudActionResult): { continue: boolean; status?: BudStatus; reason?: string } {
    const fingerprint = this.createErrorFingerprint(result);
    context.identicalFailureCount = fingerprint === context.lastErrorFingerprint ? context.identicalFailureCount + 1 : 1;
    context.lastErrorFingerprint = fingerprint;
    if (context.identicalFailureCount > this.limits.maxIdenticalFailures) return { continue: false, status: 'BLOCKED', reason: `Persistent identical failure detected: ${fingerprint}` };
    if (result.action === 'REPAIR' && result.changedState === false) return { continue: false, status: 'BLOCKED', reason: 'Repair produced no state change.' };
    return { continue: true };
  }
  private recordResult(context: BudContext, result: BudActionResult): void {
    if (result.action === 'BUILD') context.buildAttempts += 1;
    if (result.action === 'TEST' || result.action === 'BROWSER_TEST') context.testAttempts += 1;
    if (result.action === 'PREVIEW') context.previewAttempts += 1;
    if (result.action === 'REPAIR') context.repairAttempts += 1;
    if (result.action === 'DEPLOY') context.deployAttempts += 1;
    if (result.evidence) context.evidence.push(...result.evidence);
  }
  private hasRequiredEvidence(context: BudContext): boolean { const types = new Set(context.evidence.map(item => item.type)); return types.has('BUILD') && types.has('TEST') && types.has('PREVIEW'); }
  private statusForAction(action: ActionType): BudStatus {
    if (action === 'PLAN') return 'PLANNING';
    if (action === 'BUILD') return 'BUILDING';
    if (action === 'TEST' || action === 'BROWSER_TEST') return 'TESTING';
    if (action === 'PREVIEW') return 'PREVIEWING';
    if (action === 'QA') return 'QA';
    if (action === 'REPAIR') return 'REPAIRING';
    return 'EXECUTING';
  }
  private createActionHash(action: ActionType, context: BudContext): string { return crypto.createHash('sha256').update([context.projectId, context.lastStateHash || 'initial', action, context.currentStep].join(':')).digest('hex'); }
  private createErrorFingerprint(result: BudActionResult): string { return [result.action, result.errorCode || 'UNKNOWN', result.message || 'NO_MESSAGE'].join('|').trim().toLowerCase(); }
  private isDuplicateAction(hash: string, context: BudContext): boolean { if (hash !== context.lastActionHash) { context.identicalActionCount = 0; return false; } context.identicalActionCount += 1; return context.identicalActionCount > this.limits.maxIdenticalActions; }
  private isTerminal(status: BudStatus): boolean { return ['READY', 'BLOCKED', 'FAILED', 'TIMEOUT', 'CANCELLED'].includes(status); }
  private async stop(context: BudContext, status: BudStatus, reason: string): Promise<void> { context.status = status; context.blockedReason = reason; await this.persist(context); }
  private async persist(context: BudContext, phase?: ActionType): Promise<void> {
    await this.deps.persistCheckpoint({ jobId: context.jobId, runId: context.runId, projectId: context.projectId, status: context.status, currentStep: context.currentStep, currentPhase: phase, buildAttempts: context.buildAttempts, testAttempts: context.testAttempts, previewAttempts: context.previewAttempts, repairAttempts: context.repairAttempts, deployAttempts: context.deployAttempts, toolCalls: context.toolCalls, lastErrorFingerprint: context.lastErrorFingerprint, lastStateHash: context.lastStateHash, lastActionHash: context.lastActionHash, blockedReason: context.blockedReason, timestamp: Date.now() });
  }
}
