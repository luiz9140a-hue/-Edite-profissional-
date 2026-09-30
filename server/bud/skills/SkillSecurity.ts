import path from 'node:path';

const ALLOWED_COMMANDS = new Set(['npm', 'npx', 'pnpm', 'yarn', 'node', 'git', 'vite', 'tsc']);
const BLOCKED_TOKENS = /(?:rm\s+-rf|mkfs|shutdown|reboot|:\(\)|\bsudo\b|curl\s+[^\s]+\s*\|\s*(?:sh|bash)|>\s*\/|\.\.\/\.\.\/)/i;
const SECRET_NAME = /(KEY|TOKEN|SECRET|PASSWORD|PRIVATE|CREDENTIAL)/i;

export function safePath(rootDir: string, candidate: string): { safe: boolean; absolute: string; error?: string } {
  const absolute = path.resolve(rootDir, candidate);
  const root = path.resolve(rootDir);
  if (absolute !== root && !absolute.startsWith(`${root}${path.sep}`)) return { safe: false, absolute, error: 'Caminho fora da raiz do projeto.' };
  return { safe: true, absolute };
}

export function validateCommand(command: string, args: string[] = []): { safe: boolean; error?: string } {
  const executable = command.trim().split(/[\\/]/).pop() || '';
  const joined = [command, ...args].join(' ');
  if (!ALLOWED_COMMANDS.has(executable)) return { safe: false, error: `Comando '${executable}' não está na allowlist.` };
  if (BLOCKED_TOKENS.test(joined) || /[;&|`$<>]/.test(joined)) return { safe: false, error: 'Comando contém operador ou padrão destrutivo bloqueado.' };
  return { safe: true };
}

export function redactSecret(value: string): string {
  return value.split('\n').map(line => SECRET_NAME.test(line.split('=')[0] || '') ? `${line.split('=')[0]}=REDACTED` : line).join('\n');
}

export function hasPermission(contextPermissions: string[], required: string): boolean {
  return contextPermissions.includes('*') || contextPermissions.includes(required);
}
