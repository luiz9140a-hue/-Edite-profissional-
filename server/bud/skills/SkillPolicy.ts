import type { SkillContext } from './SkillContext.ts';
import type { SkillDefinition } from './SkillTypes.ts';

export type SkillPolicyDecision = 'ALLOW' | 'DENY' | 'STOP' | 'RETRY' | 'REPAIR' | 'BLOCK';

export interface SkillPolicyResult {
  decision: SkillPolicyDecision;
  reason?: string;
}

export class SkillPolicy {
  public evaluate(skill: SkillDefinition, context: SkillContext): SkillPolicyResult {
    const missing = (skill.dependencies || []).filter(dependency => !context.permissions.includes(dependency));
    if (missing.length > 0) return { decision: 'DENY', reason: `Dependências/permissões ausentes: ${missing.join(', ')}` };
    return { decision: 'ALLOW' };
  }
}

export const skillPolicy = new SkillPolicy();
