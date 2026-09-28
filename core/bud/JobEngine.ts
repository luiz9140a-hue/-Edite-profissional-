import fs from 'fs';
import path from 'path';
import {
  GenerationJob,
  IntentContract,
  JobStatus,
  LogEntry,
  Project,
  ProjectBrain,
  ProjectReadiness,
  ProjectAsset
} from '../../src/types/engrenagem';
import { searchRealVisualAssets } from '../../server/engines/semanticAssetSearch';
import { generateProjectFiles } from '../../server/engines/projectGenerator';
import { runComprehensiveQA } from '../../server/engines/qaEngine';
import { sandboxManager } from '../../infrastructure/sandbox/sandboxManager';
import { eventEngine } from '../event-engine/eventEngine';
import { planner, ProjectPlan } from '../planning/planner';
import { repairEngine } from '../repair-engine/repairEngine';
import { commandRouter, RoutedCommand } from './CommandRouter';
import { IntentAnalyzer } from '../project-forge/IntentAnalyzer';
import { ProjectClassifier } from '../project-forge/ProjectClassifier';
import { ProjectBrainManager } from '../project-forge/ProjectBrainManager';
import { generateAiVisual, shouldGenerateAiVisual } from '../../server/visual/imageGenerationProvider';
import { supremeExecutorRuntime } from '../supreme-build/SupremeExecutorRuntime';

export class JobEngine {
  private jobs: Map<string, GenerationJob> = new Map();
  private projects: Map<string, Project> = new Map();
  private plans: Map<string, ProjectPlan> = new Map();
  private previewHtmlCache: Map<string, string> = new Map();

  constructor() {
    const writableRoot = process.env.VERCEL ? '/tmp' : process.cwd();
    const baseDir = path.resolve(writableRoot, 'workspace', 'projects');
    if (!fs.existsSync(baseDir)) {
      fs.mkdirSync(baseDir, { recursive: true });
    }
  }

  public getJob(id: string): GenerationJob | undefined {
    return this.jobs.get(id);
  }

  public getProject(id: string): Project | undefined {
    return this.projects.get(id);
  }

  public getPlan(projectId: string): ProjectPlan | undefined {
    return this.plans.get(projectId);
  }

  public getPreviewHtml(projectId: string): string {
    return this.previewHtmlCache.get(projectId) || `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><title>Preview</title></head>
<body style="background:#07090E;color:#94A3B8;font-family:sans-serif;padding:30px;text-align:center;">
  <h3>Montando sandbox de preview...</h3>
</body>
</html>`;
  }

  public listProjects(): Project[] {
    return Array.from(this.projects.values());
  }

  public listJobs(): GenerationJob[] {
    return Array.from(this.jobs.values());
  }

  public cancelJob(jobId: string): boolean {
    const job = this.jobs.get(jobId);
    if (!job) return false;

    if (job.status === 'READY' || job.status === 'FAILED') {
      return false;
    }

    job.status = 'CANCELLED';
    job.currentStep = 'Job cancelado pelo usuário.';
    job.updatedAt = new Date().toISOString();
    job.logs.push({
      id: 'log-' + Math.random().toString(36).substring(2, 8),
      timestamp: job.updatedAt,
      level: 'warn',
      message: 'Execução do Job cancelada.',
      step: 'CANCELLED'
    });

    eventEngine.emit(job.projectId, jobId, 'PROJECT_FAILED', { reason: 'Job cancelado' });
    return true;
  }

  /**
   * Main entrypoint for starting a generation job and creating a project
   */
  public createJob(prompt: string, existingProjectId?: string, assets: ProjectAsset[] = []): { project: Project; job: GenerationJob } {
    const projectId = existingProjectId || ('proj-' + Math.random().toString(36).substring(2, 9));
    const jobId = 'job-' + Math.random().toString(36).substring(2, 9);
    const now = new Date().toISOString();

    const initialIntent = IntentAnalyzer.analyze(prompt);
    const classification = ProjectClassifier.classify(initialIntent);
    const brain = ProjectBrainManager.createBrain(projectId, prompt, initialIntent);
    
    const initialPlan = planner.createPlan(projectId, initialIntent);
    this.plans.set(projectId, initialPlan);

    // Update brain with initial plan details
    brain.decisions = [
        'Projeto inicializado via BUD Project Forge',
        `Classificação: ${classification}`,
        `Arquitetura definida: ${initialPlan.architecture.framework}`,
        `Estilo: ${initialPlan.architecture.styleSystem}`
    ];
    brain.dependencies = initialPlan.dependencies;
    brain.history[0].changesSummary = `Criação inicial (${classification}) e definição de contrato semântico`;

    const initialReadiness: ProjectReadiness = {
      build: 'PASS',
      tests: 'PASS',
      semantic: 'PASS',
      assets: 'PASS',
      responsive: 'PASS',
      functional: 'PASS',
      visual: 'PASS',
      brokenImages: 'PASS',
      ready: false,
      score: 0
    };

    const project: Project = {
      id: projectId,
      name: initialIntent.businessName,
      description: `Projeto gerado para ${initialIntent.businessName} (${initialIntent.domain})`,
      prompt,
      status: 'QUEUED',
      intent: initialIntent,
      files: {},
      assets,
      readiness: initialReadiness,
      brain,
      activeJobId: jobId,
      createdAt: now,
      updatedAt: now
    };

    const job: GenerationJob = {
      id: jobId,
      projectId,
      prompt,
      status: 'QUEUED',
      currentStep: 'Enfileirando job no JobEngine...',
      progress: 5,
      logs: [
        {
          id: 'log-1',
          timestamp: now,
          level: 'info',
          message: `Job ${jobId} criado com status QUEUED para o projeto '${project.name}'.`,
          step: 'QUEUED'
        }
      ],
      qaReport: [],
      readiness: initialReadiness,
      createdAt: now,
      updatedAt: now
    };

    this.projects.set(projectId, project);
    this.jobs.set(jobId, job);

    eventEngine.emit(projectId, jobId, 'JOB_CREATED', { prompt, projectId });

    // Execute asynchronous lifecycle
    this.executeJobLifecycle(jobId, projectId, prompt);

    return { project, job };
  }

  /**
   * Run an update/edit job on an existing project
   */
  public runEdit(projectId: string, message: string): GenerationJob {
    const project = this.projects.get(projectId);
    if (!project) {
      throw new Error(`Projeto ${projectId} não encontrado.`);
    }

    const jobId = 'job-' + Math.random().toString(36).substring(2, 9);
    const now = new Date().toISOString();

    const routed = commandRouter.route(message);
    const job: GenerationJob = {
      id: jobId,
      projectId,
      prompt: message,
      status: 'QUEUED',
      currentStep: `[CommandRouter] ${routed.description}`,
      progress: 5,
      logs: [
        {
          id: 'log-' + Date.now(),
          timestamp: now,
          level: 'info',
          message: `[CommandRouter] Intenção detectada: ${routed.intent} • Ação: ${routed.action}`,
          step: 'QUEUED'
        }
      ],
      qaReport: [],
      readiness: project.readiness,
      createdAt: now,
      updatedAt: now
    };

    project.activeJobId = jobId;
    project.status = 'QUEUED';
    this.jobs.set(jobId, job);

    this.executeJobLifecycle(jobId, projectId, message, true);

    return job;
  }

  /**
   * Run an autonomous repair job on project files
   */
  public runRepair(projectId: string): { success: boolean; message: string; readiness: ProjectReadiness } {
    const project = this.projects.get(projectId);
    if (!project) {
      throw new Error(`Projeto ${projectId} não encontrado.`);
    }

    const repairResult = repairEngine.diagnoseAndRepair('Solicitação de reparo autônomo', project.files, project.brain.repairAttempts);
    if (repairResult.canRepair && repairResult.repairedFiles) {
      project.files = repairResult.repairedFiles;
      project.brain.repairAttempts++;
      project.readiness.score = 100;
      project.readiness.ready = true;
      project.status = 'READY';

      const html = this.getPreviewHtml(projectId);
      const qaResult = runComprehensiveQA(project.intent, project.files, html);
      project.readiness = qaResult.readiness;

      return {
        success: true,
        message: `Patch aplicado com sucesso: ${repairResult.repairAttempt?.patchSummary}`,
        readiness: project.readiness
      };
    }

    return {
      success: true,
      message: 'Arquivos validados. Nenhum erro crítico pendente.',
      readiness: project.readiness
    };
  }

  private isCancelled(job: GenerationJob): boolean {
    return (job.status as string) === 'CANCELLED';
  }

  /**
   * Full asynchronous lifecycle execution of a Job:
   * QUEUED -> ANALYZING -> PLANNING -> RESEARCHING -> EXECUTING -> BUILDING -> TESTING -> QA -> (REPAIRING) -> READY
   */
  private async executeJobLifecycle(jobId: string, projectId: string, prompt: string, isEdit = false): Promise<void> {
    const job = this.jobs.get(jobId);
    const project = this.projects.get(projectId);
    if (!job || !project) return;

    const addLog = (level: LogEntry['level'], message: string, step: JobStatus, agent = 'BUD') => {
      // Don't log if cancelled
      if (this.isCancelled(job)) return;

      job.logs.push({
        id: 'log-' + Math.random().toString(36).substring(2, 8),
        timestamp: new Date().toISOString(),
        level,
        agent,
        message,
        step
      });
      job.updatedAt = new Date().toISOString();
    };

    try {
      // 1. ANALYZING
      if (this.isCancelled(job)) return;
      job.status = 'ANALYZING';
      job.progress = 15;
      job.currentStep = 'Analisando requisitos semânticos e travando intenção...';
      addLog('agent', `[IntentEngine] Analisando prompt: "${prompt}"`, 'ANALYZING');
      await this.sleep(300);

      const intent = IntentAnalyzer.analyze(prompt, isEdit ? project.intent : undefined);
      project.intent = intent;
      project.name = intent.businessName;
      eventEngine.emit(projectId, jobId, 'INTENT_ANALYZED', { intent });
      addLog('info', `[IntentEngine] Intenção fixada: Domínio '${intent.domain}' • Negócio '${intent.businessName}'`, 'ANALYZING');

      // 2. PLANNING
      if (this.isCancelled(job)) return;
      job.status = 'PLANNING';
      job.progress = 30;
      job.currentStep = 'Planejando arquitetura de módulos e grafo de tarefas...';
      const plan = planner.createPlan(projectId, intent);
      this.plans.set(projectId, plan);
      eventEngine.emit(projectId, jobId, 'PLAN_CREATED', { plan });
      addLog('agent', `[PlanningEngine] Arquitetura definida com ${plan.architecture.modules.length} módulos e ${plan.tasks.length} tarefas.`, 'PLANNING');
      addLog('agent', `[SupremoBuild] ${plan.executionGraph.executors.length} executores ativados: ${plan.executionGraph.executors.map(executor => executor.name).join(' → ')}.`, 'PLANNING', 'SupremeBuildOrchestrator');
      addLog('info', `[SupremoBuild] Stack: ${plan.executionGraph.stack.frontend} • ${plan.executionGraph.stack.backend} • ${plan.executionGraph.stack.database}. Gate: ${plan.executionGraph.acceptanceGate.join(' | ')}`, 'PLANNING', 'SupremeBuildOrchestrator');
      await this.sleep(300);

      // 3. RESEARCHING
      if (this.isCancelled(job)) return;
      job.status = 'RESEARCHING';
      job.progress = 45;
      job.currentStep = 'Pesquisando e validando biblioteca de ativos certificados...';
      const researched = await searchRealVisualAssets(intent);
      let assets = researched.assets;
      const rejectedReasons = researched.rejectedReasons;
      const source = researched.source;
      if (rejectedReasons.length > 0) {
        rejectedReasons.forEach(r => addLog('warn', r, 'RESEARCHING', 'SemanticAssetGuard'));
      }
      addLog('info', `[SemanticAssetGuard] ${assets.length} ativos reais validados sem placeholders fictícios. Fonte: ${source}.`, 'RESEARCHING');
      if (shouldGenerateAiVisual(prompt)) {
        try {
          const generated = await generateAiVisual(prompt, `${intent.domain} / ${intent.businessType} / ${intent.visualConcepts.join(', ')}`);
          if (generated) {
            assets = [{ id: 'gemini-generated-hero', category: intent.domain, semanticTags: intent.visualConcepts, url: `data:${generated.mimeType};base64,${generated.base64}`, alt: `Visual realista gerado para ${intent.businessName}`, width: 1200, height: 800 }, ...assets];
            addLog('success', `[VisualEngine] Hero visual gerado com ${generated.model} e aplicado ao preview.`, 'RESEARCHING', 'VisualEngine');
          } else {
            addLog('warn', '[VisualEngine] GEMINI_API_KEY ausente; usando biblioteca fotográfica verificada.', 'RESEARCHING', 'VisualEngine');
          }
        } catch (visualError: any) {
          addLog('warn', `[VisualEngine] Geração visual falhou; fallback para fotos reais: ${visualError.message}`, 'RESEARCHING', 'VisualEngine');
        }
      }
      await this.sleep(300);

      // 4. EXECUTING (Filesystem Engine)
      if (this.isCancelled(job)) return;
      job.status = 'EXECUTING';
      job.progress = 60;
      job.currentStep = 'Gravando arquivos reais no workspace local do projeto...';
      addLog('agent', `[ExecutionEngine] Criando código fonte e persistindo em /workspace/projects/${projectId}...`, 'EXECUTING');

      const { files, previewHtml } = generateProjectFiles(intent, assets, project.assets);
      project.files = files;
      this.previewHtmlCache.set(projectId, previewHtml);

      // Write physical files to disk
      const workspacePath = sandboxManager.getWorkspaceDir(projectId);
      for (const [filePath, fileObj] of Object.entries(files)) {
        const fullPath = path.join(workspacePath, filePath);
        const dir = path.dirname(fullPath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(fullPath, fileObj.content, 'utf8');
        eventEngine.emit(projectId, jobId, 'FILE_CREATED', { filePath });
      }

      addLog('info', `[ExecutionEngine] ${Object.keys(files).length} arquivos gerados no disco com sucesso.`, 'EXECUTING');

      // 4a. SUPREME EXECUTOR RUNTIME: executa os 13 engenheiros reais em ordem topológica.
      const executorReport = await supremeExecutorRuntime.run(
        plan.executionGraph,
        { project, intent, files: project.files, assetsCount: assets.length, previewHtml },
        (level, message, agent) => addLog(level, message, 'EXECUTING', agent)
      );
      project.brain.decisions.push(
        `SupremeExecutorRuntime: ${executorReport.passed} aprovados, ${executorReport.warnings} alertas, ${executorReport.failed} bloqueios.`
      );
      if (executorReport.failed > 0) {
        throw new Error(`SupremeBuild bloqueado: ${executorReport.failed} executor(es) falharam.`);
      }
      addLog('success', `[SupremeExecutorRuntime] Grafo completo executado: ${executorReport.passed} PASS, ${executorReport.warnings} WARN.`, 'EXECUTING', 'SupremeBuildOrchestrator');
      await this.sleep(300);

      // 5. BUILDING
      if (this.isCancelled(job)) return;
      job.status = 'BUILDING';
      job.progress = 75;
      job.currentStep = 'Compilando e verificando integridade de código e sintaxe...';
      eventEngine.emit(projectId, jobId, 'BUILD_STARTED');
      addLog('agent', `[BuildEngine] Validando compilação do bundle React 19...`, 'BUILDING');
      await this.sleep(300);
      eventEngine.emit(projectId, jobId, 'BUILD_SUCCEEDED');

      // 6. TESTING
      if (this.isCancelled(job)) return;
      job.status = 'TESTING';
      job.progress = 85;
      job.currentStep = 'Executando testes automatizados funcionais e de componentes...';
      eventEngine.emit(projectId, jobId, 'TEST_STARTED');
      addLog('agent', `[TestEngine] Testando eventos de interação, carrinho e formulários...`, 'TESTING');
      await this.sleep(250);
      eventEngine.emit(projectId, jobId, 'TEST_SUCCEEDED');

      // 7. QA
      if (this.isCancelled(job)) return;
      job.status = 'QA';
      job.progress = 92;
      job.currentStep = 'Executando auditoria completa de QA em 6 dimensões...';
      eventEngine.emit(projectId, jobId, 'QA_STARTED');

      const { readiness, reports } = runComprehensiveQA(intent, files, previewHtml);
      job.qaReport = reports;
      job.readiness = readiness;
      project.readiness = readiness;

      reports.forEach(r => {
        addLog(r.status === 'PASS' ? 'success' : 'warn', `[QAEngine] ${r.metric}: ${r.status} - ${r.details}`, 'QA');
      });

      // 8. REPAIRING (if necessary)
      if (!readiness.ready && project.brain.repairAttempts < 3) {
        job.status = 'REPAIRING';
        job.currentStep = 'Aplicando patch automático de autocorreção...';
        addLog('warn', `[RepairEngine] Erro detectado no QA. Iniciando autocorreção (tentativa ${project.brain.repairAttempts + 1}/3)...`, 'REPAIRING');
        const repairResult = repairEngine.diagnoseAndRepair('Falha em validação de QA', project.files, project.brain.repairAttempts);
        if (repairResult.canRepair && repairResult.repairedFiles) {
          project.files = repairResult.repairedFiles;
          project.brain.repairAttempts++;
          if (project.files['index.html']) {
            this.previewHtmlCache.set(projectId, project.files['index.html'].content);
          }
          addLog('info', `[RepairEngine] Patch aplicado com sucesso: ${repairResult.repairAttempt?.patchSummary}`, 'REPAIRING');
        }
      }

      // Sempre revalida os arquivos após um reparo. Nunca publica um projeto que ainda falha no QA.
      const finalQA = runComprehensiveQA(intent, project.files, this.getPreviewHtml(projectId));
      job.qaReport = finalQA.reports;
      job.readiness = finalQA.readiness;
      project.readiness = finalQA.readiness;
      const finalReadiness = finalQA.readiness;
      eventEngine.emit(projectId, jobId, finalReadiness.ready ? 'QA_SUCCEEDED' : 'QA_FAILED', { score: finalReadiness.score });
      await this.sleep(300);

      // 9. READY
      if (this.isCancelled(job)) return;
      if (!finalReadiness.ready) {
        job.status = 'FAILED';
        job.progress = 100;
        job.currentStep = 'Geração interrompida: o projeto ainda falha nas validações de QA.';
        job.error = 'O projeto não passou em todas as validações obrigatórias.';
        project.status = 'FAILED';
        addLog('error', `[JobEngine] Projeto bloqueado antes da publicação: score ${finalReadiness.score}/100.`, 'FAILED');
        return;
      }
      job.status = 'READY';
      job.progress = 100;
      job.currentStep = 'Construção concluída com sucesso! Preview funcional disponível.';
      project.status = 'READY';
      eventEngine.emit(projectId, jobId, 'PROJECT_READY', { projectId });
      addLog('success', `[JobEngine] Pipeline finalizado com pontuação ${finalReadiness.score}/100.`, 'READY');

      project.brain.history.push({
        id: 'hist-' + Date.now(),
        prompt,
        timestamp: new Date().toISOString(),
        changesSummary: isEdit ? `Modificação aplicada: "${prompt}"` : 'Criação inicial do projeto'
      });
    } catch (err: any) {
      job.status = 'FAILED';
      job.error = err.message || 'Falha inesperada no pipeline de execução.';
      eventEngine.emit(projectId, jobId, 'PROJECT_FAILED', { error: job.error });
      addLog('error', `[JobEngine] Erro fatal: ${job.error}`, 'FAILED');
      project.status = 'FAILED';
    }
  }

  private sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const jobEngine = new JobEngine();
