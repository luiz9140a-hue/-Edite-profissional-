import type { SkillStatus } from './SkillTypes.ts';

export interface SkillEvidence {
  type: 'command' | 'file' | 'http' | 'git' | 'test' | 'state' | 'diff';
  detail: string;
  value?: string | number | boolean;
}

export interface SkillResult<T = unknown> {
  success: boolean;
  status: SkillStatus;
  skillId: string;
  jobId?: string;
  projectId?: string;
  filesChanged: string[];
  commandsExecuted: string[];
  artifactsCreated: string[];
  testsExecuted: string[];
  errors: string[];
  warnings: string[];
  evidence: SkillEvidence[];
  nextAction: string;
  timestamp: string;
  output?: T;
}

export function skillResult<T>(skillId: string, context: { jobId?: string; projectId?: string }, patch: Partial<SkillResult<T>> = {}): SkillResult<T> {
  const evidence = patch.evidence || [];
  const success = patch.success === true && evidence.length > 0 && patch.status === 'READY';
  return {
    success,
    status: success ? 'READY' : patch.status || 'FAILED',
    skillId,
    jobId: context.jobId,
    projectId: context.projectId,
    filesChanged: patch.filesChanged || [],
    commandsExecuted: patch.commandsExecuted || [],
    artifactsCreated: patch.artifactsCreated || [],
    testsExecuted: patch.testsExecuted || [],
    errors: patch.errors || (success ? [] : ['Skill não produziu evidência suficiente para READY.']),
    warnings: patch.warnings || [],
    evidence,
    nextAction: patch.nextAction || (success ? 'CONTINUE' : 'REPAIR_OR_BLOCK'),
    timestamp: new Date().toISOString(),
    output: patch.output
  };
}
