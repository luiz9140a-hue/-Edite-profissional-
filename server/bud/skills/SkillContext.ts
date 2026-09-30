export interface SkillContext {
  rootDir: string;
  projectId?: string;
  jobId?: string;
  userId?: string;
  requestId?: string;
  environment: 'local' | 'vercel' | 'test';
  permissions: string[];
  checkpointDir?: string;
}

export function createSkillContext(input: Partial<SkillContext> = {}): SkillContext {
  return {
    rootDir: input.rootDir || process.cwd(),
    projectId: input.projectId,
    jobId: input.jobId,
    userId: input.userId,
    requestId: input.requestId,
    environment: input.environment || (process.env.VERCEL ? 'vercel' : 'local'),
    permissions: input.permissions || ['read:project'],
    checkpointDir: input.checkpointDir || '.bud/checkpoints'
  };
}
