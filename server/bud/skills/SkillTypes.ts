import type { SkillContext } from './SkillContext.ts';
import type { SkillResult } from './SkillResult.ts';

export type SkillRiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type SkillStatus = 'READY' | 'FAILED' | 'BLOCKED' | 'BLOCKED_EXTERNAL' | 'BLOCKED_SECURITY' | 'TIMEOUT' | 'CANCELLED' | 'INVALID';

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
  dependencies?: string[];
  idempotencyKey?: (input: TInput, context: SkillContext) => string;
  validate: (input: unknown) => boolean;
  execute: (context: SkillContext, input: TInput) => Promise<SkillResult<TOutput>>;
  rollback?: (context: SkillContext, result: SkillResult<TOutput>) => Promise<void>;
}
