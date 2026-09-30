import type { SkillContext } from './SkillContext.ts';
import type { SkillDefinition } from './SkillTypes.ts';
import type { SkillResult } from './SkillResult.ts';
import { hasPermission } from './SkillSecurity.ts';

export class SkillExecutor {
  public async execute<TInput, TOutput>(skill: SkillDefinition<TInput, TOutput>, context: SkillContext, input: unknown): Promise<SkillResult<TOutput>> {
    if (!skill.validate(input)) {
      return { success: false, status: 'INVALID', skillId: skill.id, jobId: context.jobId, projectId: context.projectId, filesChanged: [], commandsExecuted: [], artifactsCreated: [], testsExecuted: [], errors: ['Input não atende ao schema da skill.'], warnings: [], evidence: [], nextAction: 'REPAIR_INPUT', timestamp: new Date().toISOString() };
    }
    for (const permission of skill.permissions) {
      if (!hasPermission(context.permissions, permission)) {
        return { success: false, status: 'BLOCKED_SECURITY', skillId: skill.id, jobId: context.jobId, projectId: context.projectId, filesChanged: [], commandsExecuted: [], artifactsCreated: [], testsExecuted: [], errors: [`Permissão ausente: ${permission}`], warnings: [], evidence: [], nextAction: 'REQUEST_PERMISSION', timestamp: new Date().toISOString() };
      }
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
        last = { success: false, status: 'FAILED', skillId: skill.id, jobId: context.jobId, projectId: context.projectId, filesChanged: [], commandsExecuted: [], artifactsCreated: [], testsExecuted: [], errors: [error instanceof Error ? error.message : String(error)], warnings: [], evidence: [], nextAction: attempt < attempts ? 'RETRY' : 'REPAIR_OR_BLOCK', timestamp: new Date().toISOString() };
      }
      if (attempt < attempts) await new Promise(resolve => setTimeout(resolve, skill.retryPolicy.backoffMs * attempt));
    }
    return last!;
  }
}
