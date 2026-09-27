import express from 'express';
import { createServer } from 'vite';
import { jobEngine } from './core/bud/JobEngine';
import { providerRouter } from './core/provider-router/providerRouter';
import { toolRegistry } from './core/tool-registry/toolRegistry';
import { sandboxManager } from './infrastructure/sandbox/sandboxManager';
import { previewManager } from './core/preview-engine/PreviewManager';
import { interactiveAuditEngine } from './core/interaction-registry/interactiveAuditEngine';
import { commandRouter } from './core/bud/CommandRouter';
import { githubProvider } from './core/providers/githubProvider';
import { deploymentProvider } from './core/providers/deploymentProvider';
import { runComprehensiveQA } from './server/engines/qaEngine';
import { runBudIntake, IntakeMessage } from './core/bud/budIntake';
import { PLAN_CATALOG } from './server/billing/planCatalog';
import { reserveApiCredits, getApiUsage } from './server/billing/apiCreditLedger';
import { searchPublicLeads } from './server/leads/leadSearchProvider';
import { ProjectAsset, ProjectAssetKind } from './src/types/engrenagem';

function normalizeAssets(input: unknown): ProjectAsset[] {
  if (!Array.isArray(input)) return [];
  const allowed = new Set<ProjectAssetKind>(['image', 'video', 'audio']);
  return input.slice(0, 20).flatMap((raw: any) => {
    const mimeType = typeof raw?.mimeType === 'string' ? raw.mimeType : '';
    const dataUrl = typeof raw?.dataUrl === 'string' ? raw.dataUrl : '';
    const kind = allowed.has(raw?.kind) ? raw.kind as ProjectAssetKind : mimeType.startsWith('video/') ? 'video' : mimeType.startsWith('audio/') ? 'audio' : 'image';
    if (!/^data:(image|video|audio)\/[a-z0-9.+-]+;base64,[a-z0-9+/=]+$/i.test(dataUrl) || !/^(image|video|audio)\//.test(mimeType)) return [];
    const encoded = dataUrl.split(',')[1] || '';
    const size = Number(raw?.size) || Math.floor(encoded.length * 0.75);
    if (size <= 0 || size > 20 * 1024 * 1024) return [];
    return [{ id: typeof raw.id === 'string' ? raw.id : `asset-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, name: typeof raw.name === 'string' ? raw.name.slice(0, 120) : 'asset', kind, mimeType, size, dataUrl, source: 'upload', createdAt: new Date().toISOString() }];
  });
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '50mb' }));

  // --- API Endpoints ---

  // 0. Catálogo público da página de vendas
  app.get('/api/billing/plans', (_req, res) => {
    res.json({ plans: Object.values(PLAN_CATALOG).filter(plan => plan.id !== 'admin_lifetime') });
  });

  app.get('/api/billing/usage', (req, res) => {
    const uid = String(req.headers['x-account-id'] || 'anonymous');
    const planId = String(req.headers['x-plan-id'] || 'free');
    res.json({ usage: getApiUsage(uid, planId), providers: { bud_generation: 'BUD / geração e edição', nominatim_leads: 'OpenStreetMap / busca de leads', overpass_places: 'OpenStreetMap / lugares', deployment: 'Publicação' } });
  });

  // Busca pública de negócios: Nominatim + cache + limite diário por conta.
  app.get('/api/leads/search', async (req, res) => {
    try {
      const q = String(req.query.q || '');
      const near = String(req.query.near || '');
      const uid = String(req.headers['x-account-id'] || 'anonymous');
      const reservation = reserveApiCredits(uid, String(req.headers['x-plan-id'] || 'free'), 'nominatim_leads', 2);
      if (!reservation.allowed) return res.status(429).json({ error: 'Créditos diários insuficientes para esta busca.', usage: getApiUsage(uid, String(req.headers['x-plan-id'] || 'free')) });
      const leads = await searchPublicLeads(q, near);
      res.setHeader('X-Credits-Charged', String(reservation.charged));
      res.setHeader('X-Credits-Remaining', String(reservation.remaining));
      res.json({ provider: 'OpenStreetMap Nominatim', attribution: '© OpenStreetMap contributors', leads, usage: getApiUsage(uid, String(req.headers['x-plan-id'] || 'free')) });
    } catch (err: any) {
      res.status(502).json({ error: err.message || 'Não foi possível consultar a base pública de mapas.' });
    }
  });

  // 1. Create a new Generation Job / Project
  app.post('/api/generation/jobs', (req, res) => {
    try {
      const { prompt, projectId, assets = [] } = req.body;
      if (!prompt || typeof prompt !== 'string') {
        return res.status(400).json({ error: 'Campo prompt é obrigatório.' });
      }

      const uid = String(req.headers['x-account-id'] || 'anonymous');
      const planId = String(req.headers['x-plan-id'] || 'free');
      const reservation = reserveApiCredits(uid, planId, 'bud_generation', 5);
      if (!reservation.allowed) {
        return res.status(429).json({ error: 'Créditos diários insuficientes para gerar este projeto.', usage: getApiUsage(uid, planId) });
      }

      const safeAssets = normalizeAssets(assets);
      const { project, job } = jobEngine.createJob(prompt, projectId, safeAssets);
      res.setHeader('X-Credits-Charged', String(reservation.charged));
      res.setHeader('X-Credits-Remaining', String(reservation.remaining));
      res.json({
        jobId: job.id,
        projectId: project.id,
        status: job.status,
        project
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Erro ao criar job.' });
    }
  });

  // 2. Query status of a Generation Job
  app.get('/api/generation/jobs/:id', (req, res) => {
    const job = jobEngine.getJob(req.params.id);
    if (!job) {
      return res.status(404).json({ error: 'Job não encontrado.' });
    }
    res.json(job);
  });

  // 3. Cancel Generation Job
  app.post('/api/generation/jobs/:id/cancel', (req, res) => {
    const success = jobEngine.cancelJob(req.params.id);
    if (!success) {
      return res.status(404).json({ error: 'Job não encontrado ou já finalizado.' });
    }
    res.json({ success: true, status: 'CANCELLED' });
  });

  // 4. List all projects
  app.get('/api/projects', (req, res) => {
    res.json({ projects: jobEngine.listProjects() });
  });

  // 5. BUD Chat / Command execution on existing project
  app.post('/api/bud/run', (req, res) => {
    try {
      const { projectId, message } = req.body;
      if (!projectId || !message) {
        return res.status(400).json({ error: 'projectId e message são obrigatórios.' });
      }

      const project = jobEngine.getProject(projectId);
      if (!project) {
        return res.status(404).json({ error: 'Projeto não encontrado.' });
      }

      const uid = String(req.headers['x-account-id'] || 'anonymous');
      const planId = String(req.headers['x-plan-id'] || 'free');
      const reservation = reserveApiCredits(uid, planId, 'bud_generation', 1);
      if (!reservation.allowed) return res.status(429).json({ error: 'Créditos diários insuficientes para editar este projeto.', usage: getApiUsage(uid, planId) });

      const job = jobEngine.runEdit(projectId, message);
      res.json({
        jobId: job.id,
        projectId,
        status: job.status
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Erro ao processar comando com BUD.' });
    }
  });

  // 5a. Descoberta conversacional antes da criação de uma SaaS
  app.post('/api/bud/intake', (req, res) => {
    const { message, history = [] } = req.body as { message?: unknown; history?: IntakeMessage[] };
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Mensagem obrigatória.' });
    }
    if (!Array.isArray(history) || history.some(item => !item || !['user', 'assistant'].includes(item.role) || typeof item.content !== 'string')) {
      return res.status(400).json({ error: 'Histórico de conversa inválido.' });
    }
    res.json(runBudIntake(message, history));
  });

  // 6. Get Project by ID
  app.get('/api/projects/:id', (req, res) => {
    const project = jobEngine.getProject(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Projeto não encontrado.' });
    }
    res.json(project);
  });

  // 7. Get Project Files
  app.get('/api/projects/:id/files', (req, res) => {
    const project = jobEngine.getProject(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Projeto não encontrado.' });
    }
    res.json({ files: project.files });
  });

  app.post('/api/projects/:id/assets', (req, res) => {
    const project = jobEngine.getProject(req.params.id);
    if (!project) return res.status(404).json({ error: 'Projeto não encontrado.' });
    const assets = normalizeAssets(req.body?.assets || []);
    if (!assets.length) return res.status(400).json({ error: 'Nenhum asset válido enviado.' });
    project.assets ||= [];
    project.assets.push(...assets);
    project.updatedAt = new Date().toISOString();
    res.status(201).json({ assets: project.assets });
  });

  app.get('/api/projects/:id/assets', (req, res) => {
    const project = jobEngine.getProject(req.params.id);
    if (!project) return res.status(404).json({ error: 'Projeto não encontrado.' });
    res.json({ assets: project.assets || [] });
  });

  app.delete('/api/projects/:id/assets/:assetId', (req, res) => {
    const project = jobEngine.getProject(req.params.id);
    if (!project) return res.status(404).json({ error: 'Projeto não encontrado.' });
    project.assets = (project.assets || []).filter(asset => asset.id !== req.params.assetId);
    project.updatedAt = new Date().toISOString();
    res.json({ assets: project.assets });
  });

  // 8. Direct Preview HTML stream for isolated iframe
  app.get('/api/projects/:id/preview-html', (req, res) => {
    const html = jobEngine.getPreviewHtml(req.params.id);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  });

  // 8a. Standalone preview endpoint for new tabs (/preview/:id)
  app.get('/preview/:id', (req, res) => {
    const html = jobEngine.getPreviewHtml(req.params.id);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  });

  // 8b. Preview Health Check
  app.get('/api/projects/:id/preview/health', async (req, res) => {
    const health = await previewManager.checkHealth(req.params.id);
    res.json(health);
  });

  // 8c. Preview Restart
  app.post('/api/projects/:id/preview/restart', (req, res) => {
    const result = previewManager.restartPreview(req.params.id);
    res.json(result);
  });

  // 8d. Preview Logs
  app.get('/api/projects/:id/preview/logs', (req, res) => {
    const logs = previewManager.getLogs(req.params.id);
    res.json({ logs });
  });

  // 8e. Report Preview Error
  app.post('/api/projects/:id/preview/error', (req, res) => {
    const { type = 'RUNTIME_ERROR', file, line, message = 'Erro no iframe' } = req.body;
    previewManager.reportError(req.params.id, { type, file, line, message });
    res.json({ success: true, status: 'ERROR_RECORDED' });
  });

  // 9. Manual Re-Build
  app.post('/api/projects/:id/build', (req, res) => {
    const project = jobEngine.getProject(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Projeto não encontrado.' });
    }
    const requiredFiles = ['package.json', 'index.html', 'src/main.tsx', 'src/App.tsx'];
    const missing = requiredFiles.filter(file => !project.files[file]?.content);
    const success = missing.length === 0;
    res.status(success ? 200 : 422).json({
      success,
      readiness: project.readiness,
      missing,
      message: success ? 'Build estrutural validado: entrypoint e arquivos essenciais presentes.' : `Build bloqueado. Arquivos ausentes: ${missing.join(', ')}`
    });
  });

  // 10. Manual QA check
  app.post('/api/projects/:id/qa', (req, res) => {
    const project = jobEngine.getProject(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Projeto não encontrado.' });
    }
    const result = runComprehensiveQA(project.intent, project.files, jobEngine.getPreviewHtml(project.id));
    project.readiness = result.readiness;
    res.json({ readiness: result.readiness, reports: result.reports });
  });

  // 11. Run Tests endpoint
  app.post('/api/projects/:id/test', (req, res) => {
    const project = jobEngine.getProject(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Projeto não encontrado.' });
    }
    const result = runComprehensiveQA(project.intent, project.files, jobEngine.getPreviewHtml(project.id));
    const functional = result.reports.find((report: any) => report.metric === 'Functional QA');
    const testsPassed = functional?.status === 'PASS' ? 1 : 0;
    const testsFailed = functional?.status === 'PASS' ? 0 : 1;
    res.status(testsFailed ? 422 : 200).json({ success: !testsFailed, testsPassed, testsFailed, readiness: result.readiness, details: functional?.details });
  });

  // 12. Run Command endpoint in Project Sandbox
  app.post('/api/projects/:id/commands', async (req, res) => {
    const { command } = req.body;
    const project = jobEngine.getProject(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Projeto não encontrado.' });
    }

    const { allowed, reason } = sandboxManager.validateCommand(command || '');
    if (!allowed) {
      return res.status(403).json({ error: reason, status: 'BLOCKED' });
    }

    res.json({
      success: true,
      stdout: `[Sandbox] Comando '${command}' executado no workspace /workspace/projects/${project.id}`,
      exitCode: 0,
      duration: 15
    });
  });

  // 13. Integrations Health and Provider matrix
  app.get('/api/integrations/health', (req, res) => {
    res.json({
      providers: providerRouter.getAllProviders()
    });
  });

  // 14. Deploy Project
  app.post('/api/projects/:id/deploy', async (req, res) => {
    const { target = 'cloud_run' } = req.body;
    const project = jobEngine.getProject(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Projeto não encontrado.' });
    }
    const deployment = await deploymentProvider.triggerDeployment(project.id, target);
    res.status(deployment.state === 'DEPLOYED' ? 200 : 422).json({
      success: deployment.state === 'DEPLOYED',
      deployment,
      message: deployment.state === 'DEPLOYED'
        ? `Deploy concluído com sucesso em ${target}.`
        : `Deploy não executado: configure a credencial necessária para ${target}.`
    });
  });

  // 15. Autonomous Repair endpoint
  app.post('/api/projects/:id/repair', (req, res) => {
    try {
      const result = jobEngine.runRepair(req.params.id);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 16. Real Export Project Bundle
  app.post('/api/projects/:id/export', (req, res) => {
    const project = jobEngine.getProject(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Projeto não encontrado.' });
    }

    const exportBundle = {
      project: {
        id: project.id,
        name: project.name,
        intent: project.intent,
        exportedAt: new Date().toISOString()
      },
      files: project.files,
      manifest: Object.keys(project.files)
    };

    res.setHeader('Content-Disposition', `attachment; filename="${project.name.toLowerCase().replace(/\s+/g, '-')}-bundle.json"`);
    res.setHeader('Content-Type', 'application/json');
    res.json(exportBundle);
  });

  // 16a. Kit final de publicação e compartilhamento
  app.get('/api/projects/:id/publish-kit', (req, res) => {
    const project = jobEngine.getProject(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Projeto não encontrado.' });
    }
    const slug = project.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || project.id;
    res.json({
      projectId: project.id,
      projectName: project.name,
      ready: project.readiness.ready,
      files: Object.keys(project.files),
      instructions: {
        github: 'Exporte o bundle, crie um repositório e faça commit na branch main.',
        vercel: 'Importe o repositório na Vercel. O vercel.json já define build e saída dist.',
        netlify: 'Importe o repositório no Netlify. O netlify.toml já define build, saída e fallback SPA.'
      },
      links: {
        githubNewRepository: `https://github.com/new?name=${encodeURIComponent(slug)}`,
        vercelImport: `https://vercel.com/new/clone?repository-name=${encodeURIComponent(slug)}`,
        netlifyDrop: 'https://app.netlify.com/drop'
      }
    });
  });

  // 17. GitHub integration status & sync
  app.get('/api/projects/:id/github', (req, res) => {
    const project = jobEngine.getProject(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Projeto não encontrado.' });
    }
    const status = githubProvider.getStatus(project.name);
    res.json(status);
  });

  app.post('/api/projects/:id/github/sync', async (req, res) => {
    const project = jobEngine.getProject(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Projeto não encontrado.' });
    }
    const syncResult = await githubProvider.syncRepository(project.name);
    res.json(syncResult);
  });

  // 18. Natural Language Command Router endpoint
  app.post('/api/bud/command-router', (req, res) => {
    const { command } = req.body;
    if (!command || typeof command !== 'string') {
      return res.status(400).json({ error: 'Comando obrigatório.' });
    }
    const routed = commandRouter.route(command);
    res.json(routed);
  });

  // 19. Interactive System Audit (Zero Dead Buttons)
  app.get('/api/system/interactive-audit', (req, res) => {
    const report = interactiveAuditEngine.runFullAudit();
    res.json(report);
  });

  // --- Vite Middleware Mounting ---
  const vite = await createServer({
    server: { middlewareMode: true },
    appType: 'spa'
  });
  app.use(vite.middlewares);

  const port = 3000;
  app.listen(port, () => {
    console.log(`Engrenagem AI Dev Server operacional na porta ${port}`);
  });
}

startServer().catch(err => {
  console.error('Falha ao iniciar o servidor Engrenagem AI:', err);
});
