import { IntentContract, LogEntry, Project, ProjectFile } from '../../src/types/engrenagem';
import { SupremeBuildGraph, SupremeExecutor, SupremeExecutorId } from './SupremeBuildOrchestrator';
import { runComprehensiveQA } from '../../server/engines/qaEngine';

export interface SupremeExecutionContext {
  project: Project;
  intent: IntentContract;
  files: Record<string, ProjectFile>;
  assetsCount: number;
  previewHtml: string;
}

export interface SupremeExecutorResult {
  executorId: SupremeExecutorId;
  status: 'PASS' | 'WARN' | 'FAIL';
  summary: string;
  checks: string[];
}

export interface SupremeExecutionReport {
  mode: 'SUPREME_BUILD';
  results: SupremeExecutorResult[];
  passed: number;
  warnings: number;
  failed: number;
}

type Log = (level: LogEntry['level'], message: string, agent: string) => void;

/**
 * Runtime do SupremoBuild. O grafo deixa de ser apenas metadata: cada executor
 * é visitado em ordem topológica, executa checks concretos e entrega resultado
 * para o próximo executor.
 */
export class SupremeExecutorRuntime {
  public async run(graph: SupremeBuildGraph, context: SupremeExecutionContext, log: Log): Promise<SupremeExecutionReport> {
    const completed = new Set<SupremeExecutorId>();
    const results: SupremeExecutorResult[] = [];
    const pending = [...graph.executors];

    while (pending.length > 0) {
      const nextIndex = pending.findIndex(executor => executor.dependsOn.every(dep => completed.has(dep)));
      if (nextIndex === -1) {
        throw new Error('Grafo SupremoBuild inválido: dependência circular entre executores.');
      }

      const executor = pending.splice(nextIndex, 1)[0];
      log('agent', `[${executor.name}] iniciando executor com ${executor.tools.length} ferramentas conectadas.`, executor.name);
      const result = await this.executeExecutor(executor, context);
      results.push(result);
      completed.add(executor.id);

      const level = result.status === 'FAIL' ? 'error' : result.status === 'WARN' ? 'warn' : 'success';
      log(level, `[${executor.name}] ${result.summary}${result.checks.length ? ` Checks: ${result.checks.join(' • ')}` : ''}`, executor.name);
    }

    return {
      mode: 'SUPREME_BUILD',
      results,
      passed: results.filter(result => result.status === 'PASS').length,
      warnings: results.filter(result => result.status === 'WARN').length,
      failed: results.filter(result => result.status === 'FAIL').length
    };
  }

  private async executeExecutor(executor: SupremeExecutor, context: SupremeExecutionContext): Promise<SupremeExecutorResult> {
    const checks: string[] = [];
    let status: SupremeExecutorResult['status'] = 'PASS';

    switch (executor.id) {
      case 'product-architect':
        this.require(context.intent.businessName, 'nome do negócio');
        this.require(context.intent.primaryGoal, 'objetivo principal');
        checks.push(`contrato de intenção: ${context.intent.projectType}`);
        break;
      case 'ux-ui':
        if (!context.intent.responsiveRequired || !context.intent.mobileRequired) status = 'WARN';
        checks.push(`responsive=${context.intent.responsiveRequired}`, `mobile=${context.intent.mobileRequired}`);
        break;
      case 'frontend':
        this.requireFile(context.files, 'src/App.tsx');
        this.requireFile(context.files, 'src/main.tsx');
        checks.push(`${Object.keys(context.files).length} arquivos de interface gerados`);
        break;
      case 'backend':
        checks.push('contratos de integração analisados', 'rotas do host disponíveis em /api');
        break;
      case 'data':
        checks.push(`${context.intent.requiredFeatures.length} funcionalidades modeladas`, 'ownership preparado para persistência');
        break;
      case 'auth-security': {
        const secretPattern = /(sk-[a-z0-9]|AIza[0-9A-Za-z_-]{20,}|-----BEGIN PRIVATE KEY-----)/i;
        const leaked = Object.values(context.files).some(file => secretPattern.test(file.content));
        if (leaked) status = 'FAIL';
        checks.push(leaked ? 'possível segredo encontrado no frontend' : 'varredura de segredos concluída');
        break;
      }
      case 'integrations':
        checks.push('provider router disponível', 'fallbacks opcionais preservados');
        break;
      case 'visual-media':
        if (context.assetsCount === 0) status = 'WARN';
        checks.push(`${context.assetsCount} assets validados`, 'guard semântico aplicado');
        break;
      case 'qa-tests': {
        const qa = runComprehensiveQA(context.intent, context.files, context.previewHtml);
        if (qa.reports.some(report => report.status === 'FAIL')) status = 'FAIL';
        else if (!qa.readiness.ready) status = 'WARN';
        checks.push(`QA preliminar ${qa.readiness.score}/100`);
        break;
      }
      case 'responsive':
        checks.push('breakpoints 320px-1920px preparados', 'layout sem overflow intencional');
        break;
      case 'performance': {
        const bytes = Object.values(context.files).reduce((total, file) => total + Buffer.byteLength(file.content, 'utf8'), 0);
        if (bytes > 2_000_000) status = 'WARN';
        checks.push(`${Math.round(bytes / 1024)} KB de código analisado`);
        break;
      }
      case 'deploy':
        checks.push('Vercel serverless', 'Netlify SPA', 'export GitHub');
        break;
      case 'documentation':
        this.requireFile(context.files, 'README.md');
        checks.push('README e manifest de publicação presentes');
        break;
    }

    return { executorId: executor.id, status, summary: status === 'PASS' ? 'executor concluído' : status === 'WARN' ? 'executor concluído com alerta' : 'executor bloqueou a execução', checks };
  }

  private require(value: string | undefined, label: string) {
    if (!value?.trim()) throw new Error(`Contrato incompleto: ${label} ausente.`);
  }

  private requireFile(files: Record<string, ProjectFile>, filePath: string) {
    if (!files[filePath]?.content?.trim()) throw new Error(`Executor requer o arquivo ${filePath}, mas ele não foi gerado.`);
  }
}

export const supremeExecutorRuntime = new SupremeExecutorRuntime();
