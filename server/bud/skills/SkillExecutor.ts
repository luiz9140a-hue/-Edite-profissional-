import type { SkillContext } from './SkillContext.ts';
import type { SkillDefinition } from './SkillTypes.ts';
import type { SkillResult } from './SkillResult.ts';
import { hasPermission } from './SkillSecurity.ts';

const emptyResult = <T>(skill: SkillDefinition<any, T>, context: SkillContext, status: SkillResult<T>['status'], error: string, nextAction: string): SkillResult<T> => ({
  success: false,
  status,
  skillId: skill.id,
  jobId: context.jobId,
  projectId: context.projectId,
  filesChanged: [],
  commandsExecuted: [],
  artifactsCreated: [],
  testsExecuted: [],
  errors: [error],
  warnings: [],
  evidence: [],
  nextAction,
  timestamp: new Date().toISOString()
});

export class SkillExecutor {
  public async execute<TInput, TOutput>(skill: SkillDefinition<TInput, TOutput>, context: SkillContext, input: unknown): Promise<SkillResult<TOutput>> {
    if (!skill.validate(input)) return emptyResult(skill, context, 'INVALID', 'Input não atende ao schema da skill.', 'REPAIR_INPUT');
    for (const permission of skill.permissions) {
      if (!hasPermission(context.permissions, permission)) return emptyResult(skill, context, 'BLOCKED_SECURITY', `Permissão ausente: ${permission}`, 'REQUEST_PERMISSION');
    }

    let last: SkillResult<TOutput> | undefined;
    const attempts = Math.max(1, skill.retryPolicy.maxAttempts + 1);
    for (let attempt = 1; attempt <= attempts; attempt += 1) {
      try {
        last = await Promise.race([
          skill.execute(context, input as TInput),
          new Promise<SkillResult<TOutput>>((_, reject) => setTimeout(() => reject(new Error(`Timeout de ${skill.timeout}ms`)), skill.timeout))
        ]);
        if (last.success && last.status === 'READY' && last.evidence.length === 0) {
          last = { ...last, success: false, status: 'FAILED', errors: [...last.errors, 'Resultado READY sem evidência.'], nextAction: 'REPAIR_OR_BLOCK' };
        }
        if (last.success || attempt === attempts) return last;
      } catch (error) {
        last = emptyResult(skill, context, 'FAILED', error instanceof Error ? error.message : String(error), attempt < attempts ? 'RETRY' : 'REPAIR_OR_BLOCK');
      }
      if (attempt < attempts) await new Promise(resolve => setTimeout(resolve, skill.retryPolicy.backoffMs * attempt));
    }
    return last || emptyResult(skill, context, 'FAILED', 'Skill não produziu resultado.', 'REPAIR_OR_BLOCK');
  }
}
