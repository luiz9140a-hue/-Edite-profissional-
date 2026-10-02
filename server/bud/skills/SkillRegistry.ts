import type { SkillContext } from './SkillContext.ts';
import type { SkillResult } from './SkillResult.ts';
import type { SkillDefinition } from './SkillTypes.ts';
import { SkillExecutor } from './SkillExecutor.ts';
import { skillPolicy } from './SkillPolicy.ts';

export class SkillRegistry {
  private readonly skills = new Map<string, SkillDefinition<any, any>>();
  private readonly executor = new SkillExecutor();

  public register(skill: SkillDefinition<any, any>): void {
    if (this.skills.has(skill.id)) throw new Error(`Skill já registrada: ${skill.id}`);
    this.skills.set(skill.id, skill);
  }

  public get(id: string): SkillDefinition | undefined { return this.skills.get(id); }
  public list(): SkillDefinition[] { return [...this.skills.values()]; }
  public has(id: string): boolean { return this.skills.has(id); }

  public async execute(id: string, context: SkillContext, input: unknown): Promise<SkillResult> {
    const skill = this.skills.get(id);
    if (!skill) return { success: false, status: 'INVALID', skillId: id, jobId: context.jobId, projectId: context.projectId, filesChanged: [], commandsExecuted: [], artifactsCreated: [], testsExecuted: [], errors: [`Skill não registrada: ${id}`], warnings: [], evidence: [], nextAction: 'SELECT_EXISTING_SKILL', timestamp: new Date().toISOString() };
    const policy = skillPolicy.evaluate(skill, context);
    if (policy.decision !== 'ALLOW') return { success: false, status: policy.decision === 'STOP' ? 'BLOCKED' : 'BLOCKED_SECURITY', skillId: id, jobId: context.jobId, projectId: context.projectId, filesChanged: [], commandsExecuted: [], artifactsCreated: [], testsExecuted: [], errors: [policy.reason || 'Skill bloqueada pela política.'], warnings: [], evidence: [], nextAction: 'STOP', timestamp: new Date().toISOString() };
    return this.executor.execute(skill, context, input);
  }
}

export const skillRegistry = new SkillRegistry();
