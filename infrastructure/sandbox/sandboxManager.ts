import path from 'path';
import fs from 'fs';

export interface CommandExecutionResult {
  runId: string;
  projectId: string;
  command: string;
  args: string[];
  startedAt: string;
  finishedAt: string;
  exitCode: number;
  stdout: string;
  stderr: string;
  status: 'SUCCESS' | 'FAILED' | 'BLOCKED';
  duration: number;
}

export class SandboxManager {
  private allowedCommands = new Set(['node', 'npm', 'npx', 'tsc', 'git', 'python3', 'python', 'ls', 'cat', 'echo']);
  private blockedPatterns = [/rm\s+-rf\s+\//, /mkfs/, /dd\s+if=/, />\s*\/dev\//, /sudo/, /chmod\s+777/];

  public getWorkspaceDir(projectId: string): string {
    const writableRoot = process.env.VERCEL ? '/tmp' : process.cwd();
    const base = path.resolve(writableRoot, 'workspace', 'projects', projectId);
    if (!fs.existsSync(base)) {
      fs.mkdirSync(base, { recursive: true });
    }
    return base;
  }

  public validatePath(projectId: string, targetPath: string): { safe: boolean; resolvedPath: string; error?: string } {
    const workspaceDir = this.getWorkspaceDir(projectId);
    const resolved = path.resolve(workspaceDir, targetPath);

    if (!resolved.startsWith(workspaceDir)) {
      return {
        safe: false,
        resolvedPath: resolved,
        error: `Tentativa de Path Traversal bloqueada: '${targetPath}' escapa o workspace '${workspaceDir}'`
      };
    }

    return { safe: true, resolvedPath: resolved };
  }

  public validateCommand(command: string): { allowed: boolean; reason?: string } {
    const baseCmd = command.trim().split(/\s+/)[0];
    
    for (const pattern of this.blockedPatterns) {
      if (pattern.test(command)) {
        return { allowed: false, reason: `Comando bloqueado por política de segurança de Sandbox: violou padrão restrito.` };
      }
    }

    return { allowed: true };
  }

  public sanitizeEnv(env: Record<string, string | undefined>): Record<string, string> {
    const safeEnv: Record<string, string> = {};
    for (const [key, val] of Object.entries(env)) {
      // Isolate sensitive keys from being exposed
      if (val && !key.includes('PRIVATE_KEY') && !key.includes('SERVICE_ACCOUNT')) {
        safeEnv[key] = val;
      }
    }
    return safeEnv;
  }
}

export const sandboxManager = new SandboxManager();
