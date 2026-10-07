import { skillRegistry } from './SkillRegistry.ts';
import { defaultSkills } from './defaultSkills.ts';

let registered = false;
export function registerDefaultSkills(): void {
  if (registered) return;
  for (const skill of defaultSkills) skillRegistry.register(skill);
  registered = true;
}

registerDefaultSkills();

export { skillRegistry } from './SkillRegistry.ts';
export { createSkillContext } from './SkillContext.ts';
export type { SkillContext } from './SkillContext.ts';
export type { SkillDefinition, SkillRiskLevel, SkillStatus } from './SkillTypes.ts';
export type { SkillResult, SkillEvidence } from './SkillResult.ts';
export { SkillPolicy, skillPolicy } from './SkillPolicy.ts';
export { BudExecutionRuntime, DEFAULT_BUD_LIMITS, configuredBudLimits } from '../runtime/BudExecutionRuntime.ts';
export type { BudStatus, ActionType, BudContext, BudCheckpoint, BudEvidence, BudActionResult, BudExecutionLimits, BudRuntimeDependencies } from '../runtime/BudExecutionRuntime.ts';
