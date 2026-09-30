import { runBudSupervisor, type BudMode, type BudSupervisorDecision, getBudRuntimeHealth } from '../../server/engines/budRuntime.ts';
import { ProjectBrainManager } from '../project-forge/ProjectBrainManager.ts';
import { planner } from '../planning/planner.ts';
import { toolRegistry } from '../tool-registry/toolRegistry.ts';

export type BudRootPhase =
  | 'UNDERSTAND'
  | 'PLAN'
  | 'SELECT'
  | 'EXECUTE'
  | 'OBSERVE'
  | 'VERIFY'
  | 'REPAIR'
  | 'CONTINUE'
  | 'DELIVER';

export type BudRootTerminalState = 'RUNNING' | 'READY' | 'BLOCKED_EXTERNAL' | 'FAILED';

export interface BudRootRequest {
  userRequest: string;
  mode: BudMode;
  projectId?: string;
  projectContext?: unknown;
  currentFiles?: Record<string, unknown>;
  currentState?: unknown;
  previousErrors?: string[];
  previousActions?: string[];
  acceptanceCriteria?: string[];
}

export interface BudRootDecision extends BudSupervisorDecision {
  files: string[];
  selectedTool: string;
  phase: BudRootPhase;
}

export interface BudRootRun<T> {
  state: BudRootTerminalState;
  phase: BudRootPhase;
  decision: BudRootDecision;
  result?: T;
  evidence: string[];
  error?: string;
}

function validateDecision(decision: BudSupervisorDecision, request: BudRootRequest): BudRootDecision {
  const validModes: BudMode[] = ['CREATE', 'EDIT', 'REPAIR', 'DEPLOY'];
  if (!decision.objective || !validModes.includes(decision.executionMode)) {
    throw new Error('Supervisor retornou uma decisão sem objective ou executionMode válido.');
  }
  if (!Array.isArray(decision.acceptanceChecks) || decision.acceptanceChecks.length === 0) {
    throw new Error('Supervisor retornou uma decisão sem critérios de aceitação.');
  }
  if (!Array.isArray(decision.nextActions) || decision.nextActions.length === 0) {
    throw new Error('Supervisor retornou uma decisão sem próxima ação.');
  }

  return {
    ...decision,
    executionMode: request.mode,
    files: Object.keys(request.currentFiles || {}).slice(0, 100),
    selectedTool: request.mode === 'REPAIR' ? 'runRepair' : request.mode === 'DEPLOY' ? 'deployProject' : 'runJob',
    phase: 'SELECT'
  };
}

export class BudRootAI {
  public async run<T>(request: BudRootRequest, execute: (decision: BudRootDecision) => Promise<T> | T): Promise<BudRootRun<T>> {
    const evidence: string[] = ['ROOT_AI:UNDERSTAND:request_received'];
    try {
      const decision = validateDecision(await runBudSupervisor({
        prompt: request.userRequest,
        mode: request.mode,
        projectBrain: request.projectContext as any,
        knownErrors: request.previousErrors,
        currentProjectState: request.currentState
      }), request);
      evidence.push(`ROOT_AI:PLAN:provider=${decision.provider};model=${decision.model}`);
      evidence.push(`ROOT_AI:SELECT:tool=${decision.selectedTool}`);

      const result = await execute({ ...decision, phase: 'EXECUTE' });
      evidence.push('ROOT_AI:EXECUTE:handler_completed');
      evidence.push('ROOT_AI:OBSERVE:result_received');
      evidence.push('ROOT_AI:VERIFY:handler_returned_without_exception');
      evidence.push('ROOT_AI:DELIVER:ready');
      return { state: 'READY', phase: 'DELIVER', decision: { ...decision, phase: 'DELIVER' }, result, evidence };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha desconhecida no ROOT AI.';
      const external = /gemini|firebase|github|vercel|network|timeout|provider|credential|token/i.test(message);
      evidence.push(`ROOT_AI:${external ? 'BLOCKED_EXTERNAL' : 'FAILED'}:${message}`);
      return {
        state: external ? 'BLOCKED_EXTERNAL' : 'FAILED',
        phase: external ? 'CONTINUE' : 'VERIFY',
        decision: {
          objective: request.userRequest,
          executionMode: request.mode,
          priorities: [],
          risks: [message],
          acceptanceChecks: request.acceptanceCriteria || [],
          nextActions: [],
          provider: 'deterministic',
          model: getBudRuntimeHealth().model,
          thinkingLevel: getBudRuntimeHealth().thinkingLevel,
          files: Object.keys(request.currentFiles || {}),
          selectedTool: 'none',
          phase: external ? 'CONTINUE' : 'VERIFY'
        },
        evidence,
        error: message
      };
    }
  }

  public health() {
    const runtime = getBudRuntimeHealth();
    const brain = typeof ProjectBrainManager.createBrain === 'function';
    const plannerReady = typeof planner.createPlan === 'function';
    const registryReady = toolRegistry.listTools().length > 0;
    return {
      bud: runtime.enabled && brain && plannerReady ? 'READY' : 'BLOCKED',
      supervisor: 'READY',
      planner: plannerReady ? 'READY' : 'BLOCKED',
      projectBrain: brain ? 'READY' : 'BLOCKED',
      toolRegistry: registryReady ? 'READY' : 'BLOCKED',
      runtime,
      evidence: {
        registeredTools: toolRegistry.listTools().map(tool => tool.name),
        supervisorProvider: runtime.configured ? 'gemini' : 'deterministic'
      }
    } as const;
  }
}

export const budRootAI = new BudRootAI();
