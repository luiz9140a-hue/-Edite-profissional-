import type { SkillContext } from './SkillContext.ts';
import type { SkillResult } from './SkillResult.ts';
import type { SkillDefinition } from './SkillTypes.ts';
import { SkillExecutor } from './SkillExecutor.ts';

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
    return this.executor.execute(skill, context, input);
  }
}

export const skillRegistry = new SkillRegistry();
