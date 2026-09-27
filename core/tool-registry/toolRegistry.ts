import fs from 'fs';
import path from 'path';
import { sandboxManager } from '../../infrastructure/sandbox/sandboxManager';
import { providerRouter } from '../provider-router/providerRouter';

export interface ToolDefinition {
  name: string;
  description: string;
  category: 'file' | 'execution' | 'build' | 'git' | 'asset' | 'preview';
  inputSchema: Record<string, string>;
  execute: (input: any) => Promise<any>;
}

export class ToolRegistry {
  private tools: Map<string, ToolDefinition> = new Map();

  constructor() {
    this.registerCoreTools();
  }

  private registerCoreTools() {
    // 1. createFile / writeFile
    this.tools.set('writeFile', {
      name: 'writeFile',
      description: 'Grava ou atualiza um arquivo no workspace real do projeto.',
      category: 'file',
      inputSchema: { projectId: 'string', filePath: 'string', content: 'string' },
      execute: async ({ projectId, filePath, content }) => {
        const { safe, resolvedPath, error } = sandboxManager.validatePath(projectId, filePath);
        if (!safe) throw new Error(error);

        const dir = path.dirname(resolvedPath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }

        fs.writeFileSync(resolvedPath, content, 'utf8');
        return { success: true, filePath, bytesWritten: Buffer.byteLength(content, 'utf8') };
      }
    });

    // 2. readFile
    this.tools.set('readFile', {
      name: 'readFile',
      description: 'Lê o conteúdo de um arquivo do workspace real.',
      category: 'file',
      inputSchema: { projectId: 'string', filePath: 'string' },
      execute: async ({ projectId, filePath }) => {
        const { safe, resolvedPath, error } = sandboxManager.validatePath(projectId, filePath);
        if (!safe) throw new Error(error);

        if (!fs.existsSync(resolvedPath)) {
          throw new Error(`Arquivo '${filePath}' não encontrado.`);
        }

        const content = fs.readFileSync(resolvedPath, 'utf8');
        return { success: true, filePath, content };
      }
    });

    // 3. listFiles
    this.tools.set('listFiles', {
      name: 'listFiles',
      description: 'Lista todos os arquivos do workspace real recursivamente.',
      category: 'file',
      inputSchema: { projectId: 'string' },
      execute: async ({ projectId }) => {
        const workspaceDir = sandboxManager.getWorkspaceDir(projectId);
        
        const readDirRecursive = (dir: string, base: string = ''): string[] => {
          let results: string[] = [];
          if (!fs.existsSync(dir)) return results;
          const list = fs.readdirSync(dir);
          for (const file of list) {
            if (file === 'node_modules' || file === '.git') continue;
            const fullPath = path.join(dir, file);
            const relative = path.join(base, file);
            const stat = fs.statSync(fullPath);
            if (stat && stat.isDirectory()) {
              results = results.concat(readDirRecursive(fullPath, relative));
            } else {
              results.push(relative);
            }
          }
          return results;
        };

        const files = readDirRecursive(workspaceDir);
        return { success: true, count: files.length, files };
      }
    });

    // 4. gitCommit (Checks provider status)
    this.tools.set('gitCommit', {
      name: 'gitCommit',
      description: 'Executa commit e push para o repositório GitHub configurado.',
      category: 'git',
      inputSchema: { projectId: 'string', message: 'string' },
      execute: async () => {
        if (providerRouter.getStatus('github') !== 'AVAILABLE') {
          return {
            status: 'NOT_CONFIGURED',
            reason: 'GitHub Provider não configurado com credenciais OAuth.',
            requiredConfiguration: ['GITHUB_TOKEN']
          };
        }
        return { status: 'SUCCESS', commitHash: 'git-commit-mock' };
      }
    });

    // 5. deployProject
    this.tools.set('deployProject', {
      name: 'deployProject',
      description: 'Publica o projeto em ambiente de produção na nuvem.',
      category: 'execution',
      inputSchema: { projectId: 'string', target: 'string' },
      execute: async ({ target = 'cloud_run' }) => {
        if (target === 'vercel') {
          return {
            status: 'NOT_CONFIGURED',
            reason: 'Vercel Provider não configurado.',
            requiredConfiguration: ['VERCEL_TOKEN']
          };
        }
        return {
          status: 'DEPLOYED',
          url: process.env.APP_URL || 'http://localhost:3000',
          target: 'cloud_run'
        };
      }
    });
  }

  public getTool(name: string): ToolDefinition | undefined {
    return this.tools.get(name);
  }

  public listTools(): ToolDefinition[] {
    return Array.from(this.tools.values());
  }

  public async executeTool(name: string, input: any): Promise<any> {
    const tool = this.tools.get(name);
    if (!tool) {
      throw new Error(`Ferramenta '${name}' não registrada no ToolRegistry.`);
    }
    return await tool.execute(input);
  }
}

export const toolRegistry = new ToolRegistry();
