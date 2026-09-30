import type { SkillContext } from './SkillContext.ts';
import type { SkillResult } from './SkillResult.ts';

export type SkillRiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type SkillStatus = 'READY' | 'FAILED' | 'BLOCKED_EXTERNAL' | 'BLOCKED_SECURITY' | 'INVALID';

export interface RetryPolicy {
  maxAttempts: number;
  backoffMs: number;
}

export interface SkillDefinition<TInput = Record<string, unknown>, TOutput = unknown> {
  id: string;
  name: string;
  description: string;
  category: string;
  inputSchema: Record<string, string>;
  outputSchema: Record<string, string>;
  permissions: string[];
  riskLevel: SkillRiskLevel;
  timeout: number;
  retryPolicy: RetryPolicy;
  validate: (input: unknown) => boolean;
  execute: (context: SkillContext, input: TInput) => Promise<SkillResult<TOutput>>;
  rollback?: (context: SkillContext, result: SkillResult<TOutput>) => Promise<void>;
}
