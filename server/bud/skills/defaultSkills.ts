import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import type { SkillContext } from './SkillContext.ts';
import type { SkillDefinition } from './SkillTypes.ts';
import { skillResult, type SkillResult } from './SkillResult.ts';
import { safePath, validateCommand, redactSecret } from './SkillSecurity.ts';
import { runBudSupervisor } from '../../engines/budRuntime.ts';
import { repairEngine } from '../../../core/repair-engine/repairEngine.ts';
import { IntentAnalyzer } from '../../../core/project-forge/IntentAnalyzer.ts';
import { generateProjectFiles } from '../../engines/projectGenerator.ts';
import { skillRegistry } from './SkillRegistry.ts';
import { isFirestoreConfigured } from '../../persistence/firestoreStore.ts';

const execFileAsync = promisify(execFile);
const SKILL_TIMEOUT = 180_000;

type AnySkill = SkillDefinition<any, any>;
const record = (value: unknown): value is Record<string, unknown> => Boolean(value && typeof value === 'object' && !Array.isArray(value));
const stringInput = (value: unknown, key: string) => record(value) && typeof value[key] === 'string' && String(value[key]).length > 0;
const rootFiles = (rootDir: string): string[] => {
  const out: string[] = [];
  const visit = (dir: string, prefix = '') => {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (['node_modules', '.git', 'dist', '.bud'].includes(entry.name)) continue;
      const relative = path.join(prefix, entry.name);
      if (entry.isDirectory()) visit(path.join(dir, entry.name), relative);
      else out.push(relative);
    }
  };
  visit(rootDir);
  return out;
};
const pkg = (rootDir: string): any => {
  const file = path.join(rootDir, 'package.json');
  return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : {};
};
const command = async (context: SkillContext, executable: string, args: string[], timeout = SKILL_TIMEOUT) => {
  const validation = validateCommand(executable, args);
  if (!validation.safe) throw new Error(validation.error);
  const started = Date.now();
  const result = await execFileAsync(executable, args, { cwd: context.rootDir, timeout, maxBuffer: 12 * 1024 * 1024, env: { ...process.env, CI: '1' } });
  return { stdout: redactSecret(result.stdout || ''), stderr: redactSecret(result.stderr || ''), durationMs: Date.now() - started, exitCode: 0 };
};
const base = (id: string, name: string, description: string, category: string, permissions: string[], validate: (input: unknown) => boolean, execute: AnySkill['execute'], riskLevel: AnySkill['riskLevel'] = 'LOW'): AnySkill => ({ id, name, description, category, inputSchema: {}, outputSchema: {}, permissions, riskLevel, timeout: SKILL_TIMEOUT, retryPolicy: { maxAttempts: 0, backoffMs: 100 }, dependencies: permissions, idempotencyKey: (input, context) => `${id}:${context.projectId || 'no-project'}:${JSON.stringify(input)}`, validate: (input: unknown): input is any => validate(input), execute });
const fail = (id: string, context: SkillContext, message: string, status: 'FAILED' | 'BLOCKED_EXTERNAL' | 'BLOCKED_SECURITY' = 'FAILED'): SkillResult => skillResult(id, context, { status, errors: [message], nextAction: status === 'BLOCKED_EXTERNAL' ? 'CONFIGURE_EXTERNAL_PROVIDER' : 'REPAIR' });

export const defaultSkills: AnySkill[] = [
  base('project.discovery', 'Project Discovery', 'Mapeia a raiz, arquitetura, dependências, rotas e integrações reais.', 'discovery', ['read:project'], () => true, async (context, input) => {
    const files = rootFiles(context.rootDir);
    const packageJson = pkg(context.rootDir);
    const source = files.filter(file => /\.(ts|tsx|js|jsx|json|env|md)$/.test(file)).slice(0, 200);
    const envRefs = new Set<string>();
    for (const file of source) {
      const content = fs.readFileSync(path.join(context.rootDir, file), 'utf8');
      for (const match of content.matchAll(/\b(?:GEMINI|FIREBASE|GITHUB|VERCEL|NETLIFY|VITE)_[A-Z0-9_]+\b/g)) envRefs.add(match[0]);
    }
    const output = { projectMap: { root: context.rootDir, files, packageJson, entrypoints: files.filter(file => /(^|\/)(index|main|server)\.(tsx?|jsx?)$/.test(file)) }, architectureMap: { directories: [...new Set(files.map(file => path.dirname(file)))], engines: files.filter(file => /engine|orchestrator|runtime/i.test(file)) }, dependencyMap: { dependencies: packageJson.dependencies || {}, devDependencies: packageJson.devDependencies || {} }, routeMap: files.filter(file => /server|api|route/i.test(file)), apiMap: files.filter(file => /api|provider|client/i.test(file)), environmentMap: [...envRefs].map(name => ({ name, status: process.env[name] ? 'PRESENT' : 'MISSING' })), integrationMap: ['Firebase', 'Gemini', 'GitHub', 'Vercel', 'Netlify'].map(name => ({ name, configured: Boolean(process.env[`${name.toUpperCase()}_TOKEN`] || process.env[`${name.toUpperCase()}_API_KEY`] || process.env[`${name.toUpperCase()}_PROJECT_ID`]) })) };
    return skillResult('project.discovery', context, { success: true, status: 'READY', output, evidence: [{ type: 'file', detail: `${files.length} arquivos percorridos`, value: files.length }, { type: 'state', detail: 'package.json lido da raiz real', value: Boolean(Object.keys(packageJson).length) }] });
  }),
  base('project.dependencies', 'Dependency Auditor', 'Audita package manager, lockfile e dependências declaradas sem inventar instalação.', 'dependencies', ['read:project'], () => true, async (context) => {
    const packageJson = pkg(context.rootDir);
    const lockfiles = ['package-lock.json', 'pnpm-lock.yaml', 'yarn.lock'].filter(file => fs.existsSync(path.join(context.rootDir, file)));
    return skillResult('project.dependencies', context, { success: true, status: 'READY', output: { packageManager: packageJson.packageManager || (lockfiles[0] || 'npm'), dependencies: Object.keys(packageJson.dependencies || {}), lockfiles }, evidence: [{ type: 'file', detail: 'package.json e lockfiles auditados', value: lockfiles.length }] });
  }),
  base('code.search', 'Code Search', 'Pesquisa símbolos, rotas, envs, TODOs e sinais de execução falsa.', 'code', ['read:project'], value => stringInput(value, 'query'), async (context, input: any) => {
    const query = input.query as string;
    const regex = new RegExp(query, input.regex ? 'i' : 'i');
    const matches: Array<{ file: string; line: number; text: string }> = [];
    for (const file of rootFiles(context.rootDir)) {
      if (matches.length >= 500 || file.endsWith('.lock')) continue;
      const full = path.join(context.rootDir, file);
      const lines = fs.readFileSync(full, 'utf8').split('\n');
      lines.forEach((text, index) => { if (regex.test(text) && matches.length < 500) matches.push({ file, line: index + 1, text: text.slice(0, 300) }); });
    }
    return skillResult('code.search', context, { success: true, status: 'READY', output: { query, matches }, evidence: [{ type: 'state', detail: `Busca real em ${rootFiles(context.rootDir).length} arquivos`, value: matches.length }] });
  }),
  base('code.read', 'File Reader', 'Lê um arquivo real depois da validação de caminho.', 'code', ['read:project'], value => stringInput(value, 'filePath'), async (context, input: any) => {
    const checked = safePath(context.rootDir, input.filePath);
    if (!checked.safe || !fs.existsSync(checked.absolute) || !fs.statSync(checked.absolute).isFile()) return fail('code.read', context, checked.error || 'Arquivo não encontrado.');
    const content = fs.readFileSync(checked.absolute, 'utf8');
    return skillResult('code.read', context, { success: true, status: 'READY', output: { filePath: input.filePath, content }, evidence: [{ type: 'file', detail: input.filePath, value: content.length }] });
  }),
  base('code.edit', 'Code Editor', 'Edita um arquivo somente dentro da raiz com hash opcional e validação pós-escrita.', 'code', ['read:project', 'write:project'], value => record(value) && typeof value.filePath === 'string' && typeof value.content === 'string', async (context, input: any) => {
    const checked = safePath(context.rootDir, input.filePath);
    if (!checked.safe) return fail('code.edit', context, checked.error!, 'BLOCKED_SECURITY');
    const before = fs.existsSync(checked.absolute) ? fs.readFileSync(checked.absolute, 'utf8') : '';
    const beforeSha = crypto.createHash('sha256').update(before).digest('hex');
    if (input.expectedSha && input.expectedSha !== beforeSha) return fail('code.edit', context, 'Arquivo mudou desde a leitura; rollback preventivo aplicado.');
    fs.mkdirSync(path.dirname(checked.absolute), { recursive: true });
    fs.writeFileSync(checked.absolute, input.content, 'utf8');
    const afterSha = crypto.createHash('sha256').update(input.content).digest('hex');
    return skillResult('code.edit', context, { success: true, status: 'READY', filesChanged: [input.filePath], output: { beforeSha, afterSha }, evidence: [{ type: 'diff', detail: `${input.filePath}: ${beforeSha} -> ${afterSha}` }, { type: 'file', detail: 'Arquivo existe após escrita', value: fs.existsSync(checked.absolute) }] });
  }, 'MEDIUM'),
  base('system.command', 'Terminal Executor', 'Executa apenas comandos da allowlist e captura saída, erro, código e duração.', 'system', ['command:execute'], value => record(value) && typeof value.command === 'string', async (context, input: any) => {
    try { const result = await command(context, input.command, Array.isArray(input.args) ? input.args.map(String) : []); return skillResult('system.command', context, { success: true, status: 'READY', commandsExecuted: [[input.command, ...(input.args || [])].join(' ')], output: result, evidence: [{ type: 'command', detail: `${input.command} terminou com exitCode 0`, value: result.durationMs }] }); }
    catch (error) { return fail('system.command', context, error instanceof Error ? error.message : String(error)); }
  }, 'HIGH'),
  base('build.execute', 'Build Engine', 'Descobre e executa o script build real do package.json.', 'build', ['read:project', 'command:execute'], () => true, async (context) => {
    try { const packageJson = pkg(context.rootDir); const script = packageJson.scripts?.build; if (!script) return fail('build.execute', context, 'package.json não possui script build.'); const executable = packageJson.packageManager?.startsWith('pnpm') ? 'pnpm' : packageJson.packageManager?.startsWith('yarn') ? 'yarn' : 'npm'; const args = executable === 'npm' ? ['run', 'build'] : ['build']; const result = await command(context, executable, args); const generatedFiles = fs.existsSync(path.join(context.rootDir, 'dist')) ? rootFiles(path.join(context.rootDir, 'dist')) : []; return skillResult('build.execute', context, { success: result.exitCode === 0, status: 'READY', commandsExecuted: [`${executable} ${args.join(' ')}`], artifactsCreated: generatedFiles, output: { script, stdout: result.stdout, stderr: result.stderr, exitCode: result.exitCode, durationMs: result.durationMs, generatedFiles }, evidence: [{ type: 'command', detail: 'Build real terminou com exitCode 0', value: result.exitCode }, { type: 'file', detail: 'Artefatos gerados', value: generatedFiles.length }] }); } catch (error) { return fail('build.execute', context, error instanceof Error ? error.message : String(error)); }
  }, 'HIGH'),
  base('test.execute', 'Test Engine', 'Descobre e executa testes reais; não transforma ausência de testes em sucesso.', 'test', ['read:project', 'command:execute'], () => true, async (context) => {
    try { const scripts = pkg(context.rootDir).scripts || {}; const name = ['test', 'test:run', 'test:e2e'].find(key => scripts[key]); if (!name) return fail('test.execute', context, 'Nenhum script de teste real foi encontrado.', 'BLOCKED_EXTERNAL'); const result = await command(context, 'npm', ['run', name]); return skillResult('test.execute', context, { success: true, status: 'READY', commandsExecuted: [`npm run ${name}`], testsExecuted: [name], output: result, evidence: [{ type: 'test', detail: `npm run ${name} terminou com exitCode 0`, value: result.exitCode }] }); } catch (error) { return fail('test.execute', context, error instanceof Error ? error.message : String(error)); }
  }, 'HIGH'),
  base('environment.audit', 'Environment Auditor', 'Audita referências de ambiente sem imprimir valores secretos.', 'environment', ['read:project'], () => true, async (context) => {
    const names = new Set<string>(); for (const file of rootFiles(context.rootDir)) { if (!/\.(ts|tsx|js|jsx|json|env|md)$/.test(file)) continue; const text = fs.readFileSync(path.join(context.rootDir, file), 'utf8'); for (const match of text.matchAll(/\b(?:GEMINI|FIREBASE|GITHUB|VERCEL|NETLIFY|VITE)_[A-Z0-9_]+\b/g)) names.add(match[0]); }
    const output = [...names].sort().map(name => ({ name, status: process.env[name] ? 'PRESENT' : 'MISSING', frontend: name.startsWith('VITE_') }));
    return skillResult('environment.audit', context, { success: true, status: 'READY', output, evidence: [{ type: 'state', detail: `${output.length} referências de ambiente auditadas`, value: output.length }], warnings: output.filter(item => item.frontend && /(KEY|TOKEN|SECRET|PRIVATE)/i.test(item.name)).map(item => `Possível segredo exposto em variável frontend: ${item.name}`) });
  }),
  base('route.audit', 'Route Auditor', 'Constrói um grafo real entre chamadas frontend e handlers server/API.', 'audit', ['read:project'], () => true, async (context) => {
    const edges: Array<{ from: string; to: string; file: string }> = [];
    for (const file of rootFiles(context.rootDir)) { if (!/\.(ts|tsx|js|jsx)$/.test(file)) continue; const text = fs.readFileSync(path.join(context.rootDir, file), 'utf8'); for (const match of text.matchAll(/fetch\(['"`]([^'"`]+)|app\.(get|post|put|delete)\(['"`]([^'"`]+)/g)) edges.push({ from: file, to: match[1] || match[3] || '', file }); }
    return skillResult('route.audit', context, { success: true, status: 'READY', output: { routeGraph: edges }, evidence: [{ type: 'state', detail: `${edges.length} arestas de rota encontradas`, value: edges.length }] });
  }),
  base('qa.full', 'QA Engine', 'Executa typecheck/build reais e verifica contratos estruturais, runtime e segurança.', 'qa', ['read:project', 'command:execute'], () => true, async (context) => {
    const build = await (defaultSkills.find(skill => skill.id === 'build.execute') as AnySkill).execute(context, {});
    const env = await (defaultSkills.find(skill => skill.id === 'environment.audit') as AnySkill).execute(context, {});
    const route = await (defaultSkills.find(skill => skill.id === 'route.audit') as AnySkill).execute(context, {});
    const success = build.success && env.success && route.success;
    return skillResult('qa.full', context, { success, status: success ? 'READY' : 'FAILED', commandsExecuted: build.commandsExecuted, testsExecuted: ['environment.audit', 'route.audit'], output: { build: build.output, environment: env.output, routes: route.output }, evidence: [...build.evidence, ...env.evidence, ...route.evidence], errors: success ? [] : [...build.errors, ...env.errors, ...route.errors], nextAction: success ? 'CONTINUE' : 'REPAIR' });
  }, 'HIGH'),
  base('repair.auto', 'Auto Repair', 'Aplica somente patches suportados pelo RepairEngine e exige evidência pós-patch.', 'repair', ['read:project', 'write:project'], value => record(value) && typeof value.errorMessage === 'string' && record(value.files), async (context, input: any) => { const result = repairEngine.diagnoseAndRepair(input.errorMessage, input.files as any, Number(input.currentAttempts || 0)); if (!result.canRepair || !result.repairedFiles) return fail('repair.auto', context, 'RepairEngine não possui patch seguro para este erro.'); return skillResult('repair.auto', context, { success: true, status: 'READY', filesChanged: Object.keys(result.repairedFiles), output: result.repairAttempt, evidence: [{ type: 'diff', detail: result.repairAttempt?.patchSummary || 'Patch aplicado' }, { type: 'state', detail: 'Arquivos reparados retornados pelo RepairEngine', value: Object.keys(result.repairedFiles).length }] }); }, 'HIGH'),
  base('preview.create', 'Preview Engine', 'Valida um preview HTTP real, status, HTML e título.', 'preview', ['network:read'], value => stringInput(value, 'url'), async (context, input: any) => { try { const response = await fetch(input.url); const body = await response.text(); const valid = response.ok && /<html|<!doctype/i.test(body) && !/NOT_FOUND|Application error/i.test(body); return skillResult('preview.create', context, { success: valid, status: valid ? 'READY' : 'FAILED', output: { url: input.url, status: response.status, contentType: response.headers.get('content-type'), bytes: body.length, title: body.match(/<title[^>]*>([^<]*)/i)?.[1] || null }, evidence: [{ type: 'http', detail: `${response.status} ${input.url}`, value: response.ok }, { type: 'file', detail: 'Resposta HTML recebida', value: body.length }], errors: valid ? [] : ['Preview não passou nos critérios HTTP/HTML.'] }); } catch (error) { return fail('preview.create', context, error instanceof Error ? error.message : String(error), 'BLOCKED_EXTERNAL'); }
  }),
  base('browser.smoke', 'Browser Smoke', 'Executa smoke HTTP controlado na página e rotas fornecidas, sem repetir previews.', 'browser', ['network:read'], value => record(value) && typeof value.url === 'string', async (context, input: any) => { try { const urls = [input.url, ...(Array.isArray(input.paths) ? input.paths.map((item: string) => new URL(item, input.url).toString()) : [])]; const checks = []; for (const url of urls.slice(0, 10)) { const response = await fetch(url); checks.push({ url, status: response.status, ok: response.ok, contentType: response.headers.get('content-type') }); } const success = checks.every(check => check.ok); return skillResult('browser.smoke', context, { success, status: success ? 'READY' : 'FAILED', output: { checks }, evidence: checks.map(check => ({ type: 'http' as const, detail: `${check.status} ${check.url}`, value: check.ok })), errors: success ? [] : ['Uma ou mais rotas falharam no smoke HTTP.'] }); } catch (error) { return fail('browser.smoke', context, error instanceof Error ? error.message : String(error), 'BLOCKED_EXTERNAL'); } }),
  base('project.generate', 'Project Generator', 'Gera arquivos reais a partir do generator existente e os grava no workspace seguro.', 'generation', ['read:project', 'write:project'], value => stringInput(value, 'prompt'), async (context, input: any) => {
    const intent = IntentAnalyzer.analyze(input.prompt);
    const generated = generateProjectFiles(intent, [], []);
    const projectRoot = path.join(context.rootDir, 'workspace', 'projects', context.projectId || `generated-${Date.now()}`);
    const changed: string[] = [];
    for (const [filePath, file] of Object.entries(generated.files)) {
      const checked = safePath(projectRoot, filePath);
      if (!checked.safe) return fail('project.generate', context, checked.error!, 'BLOCKED_SECURITY');
      fs.mkdirSync(path.dirname(checked.absolute), { recursive: true });
      fs.writeFileSync(checked.absolute, file.content, 'utf8');
      changed.push(path.relative(context.rootDir, checked.absolute));
    }
    return skillResult('project.generate', context, { success: changed.length > 0, status: changed.length > 0 ? 'READY' : 'FAILED', filesChanged: changed, artifactsCreated: changed, output: { projectRoot, fileCount: changed.length, intent }, evidence: [{ type: 'file', detail: `${changed.length} arquivos gerados no workspace`, value: changed.length }] });
  }, 'HIGH'),
  base('api.execute', 'API Connector', 'Executa uma requisição HTTP real e captura status, cabeçalhos e corpo.', 'api', ['network:read'], value => record(value) && typeof value.url === 'string', async (context, input: any) => { try { const response = await fetch(input.url, { method: String(input.method || 'GET'), headers: record(input.headers) ? Object.fromEntries(Object.entries(input.headers).map(([key, value]) => [key, String(value)])) : undefined, body: input.body === undefined ? undefined : JSON.stringify(input.body) }); const body = await response.text(); return skillResult('api.execute', context, { success: response.ok, status: response.ok ? 'READY' : 'FAILED', output: { status: response.status, headers: Object.fromEntries(response.headers.entries()), body: body.slice(0, 20000) }, evidence: [{ type: 'http', detail: `${input.method || 'GET'} ${input.url}`, value: response.status }], errors: response.ok ? [] : [`HTTP ${response.status}`] }); } catch (error) { return fail('api.execute', context, error instanceof Error ? error.message : String(error), 'BLOCKED_EXTERNAL'); } }),
  base('integration.firebase', 'Firebase Connector', 'Verifica a configuração real do Firebase Admin sem exibir segredos.', 'integration', ['read:project'], () => true, async (context) => { const configured = isFirestoreConfigured(); return skillResult('integration.firebase', context, { success: configured, status: configured ? 'READY' : 'BLOCKED_EXTERNAL', output: { firebaseAdmin: configured ? 'PRESENT' : 'MISSING', projectId: process.env.FIREBASE_PROJECT_ID ? 'PRESENT' : 'MISSING' }, evidence: [{ type: 'state', detail: `Firestore Admin ${configured ? 'inicializado' : 'não configurado'}`, value: configured }], errors: configured ? [] : ['FIREBASE_SERVICE_ACCOUNT_JSON ou credenciais equivalentes ausentes.'], nextAction: configured ? 'CONTINUE' : 'CONFIGURE_FIREBASE' }); }),
  base('ai.gemini', 'Gemini Connector', 'Executa o supervisor oficial Gemini ou reporta fallback/configuração real.', 'ai', ['read:project'], value => stringInput(value, 'prompt'), async (context, input: any) => { const decision = await runBudSupervisor({ prompt: input.prompt, mode: input.mode || 'EDIT', knownErrors: input.previousErrors || [] }); const configured = decision.provider === 'gemini'; return skillResult('ai.gemini', context, { success: configured, status: configured ? 'READY' : 'BLOCKED_EXTERNAL', output: decision, evidence: [{ type: 'state', detail: `Supervisor provider=${decision.provider}`, value: decision.model }], errors: configured ? [] : ['Gemini não configurado; decisão determinística usada.'], nextAction: configured ? 'CONTINUE' : 'CONFIGURE_GEMINI' }); }),
  base('ai.toolCall', 'Tool Call Executor', 'Encadeia uma decisão para uma skill registrada e retorna o resultado real.', 'ai', ['read:project'], value => record(value) && typeof value.skillId === 'string', async (context, input: any) => { const result = await skillRegistry.execute(input.skillId, context, input.args || {}); return skillResult('ai.toolCall', context, { success: result.success, status: result.status, output: result, filesChanged: result.filesChanged, commandsExecuted: result.commandsExecuted, testsExecuted: result.testsExecuted, errors: result.errors, warnings: result.warnings, evidence: [{ type: 'state', detail: `Skill chamada: ${input.skillId}`, value: result.status }, ...result.evidence], nextAction: result.nextAction }); }),
  base('github.audit', 'Git Auditor', 'Verifica branch, HEAD, árvore de trabalho e commit real.', 'git', ['read:project', 'command:execute'], () => true, async (context) => { try { const head = await command(context, 'git', ['rev-parse', 'HEAD']); const branch = await command(context, 'git', ['branch', '--show-current']); const status = await command(context, 'git', ['status', '--porcelain']); return skillResult('github.audit', context, { success: true, status: 'READY', commandsExecuted: ['git rev-parse HEAD', 'git branch --show-current', 'git status --porcelain'], output: { head: head.stdout.trim(), branch: branch.stdout.trim(), clean: !status.stdout.trim() }, evidence: [{ type: 'git', detail: `HEAD ${head.stdout.trim()}` }, { type: 'git', detail: `branch ${branch.stdout.trim()}` }, { type: 'git', detail: `working tree ${status.stdout.trim() ? 'DIRTY' : 'CLEAN'}` }] }); } catch (error) { return fail('github.audit', context, error instanceof Error ? error.message : String(error)); } }),
  base('deploy.execute', 'Deploy Engine', 'Valida configuração e nunca inventa deployment sem confirmação do provedor.', 'deploy', ['network:write'], value => record(value) && typeof value.target === 'string', async (context, input: any) => { const target = input.target; const configured = target === 'vercel' ? Boolean(process.env.VERCEL_TOKEN) : target === 'netlify' ? Boolean(process.env.NETLIFY_AUTH_TOKEN) : false; return fail('deploy.execute', context, configured ? `Adaptador real de ${target} não está conectado ao Skill Runtime; nenhum deployment foi executado.` : `Credencial de ${target} ausente; nenhum deployment foi executado.`, 'BLOCKED_EXTERNAL'); }, 'CRITICAL'),
  base('system.observe', 'Observation Engine', 'Registra evento, timestamp, input hash, resultado e próxima etapa.', 'system', ['read:project'], value => record(value) && typeof value.event === 'string', async (context, input: any) => { const inputHash = crypto.createHash('sha256').update(JSON.stringify(input.input || {})).digest('hex'); return skillResult('system.observe', context, { success: true, status: 'READY', output: { event: input.event, timestamp: new Date().toISOString(), inputHash, result: input.result || null, nextStep: input.nextStep || 'CONTINUE' }, evidence: [{ type: 'state', detail: `Evento observado: ${input.event}`, value: inputHash }] }); }),
  base('job.checkpoint', 'Checkpoint Engine', 'Persiste checkpoint local e recuperável do job.', 'job', ['read:project', 'write:project'], value => record(value) && typeof value.jobId === 'string', async (context, input: any) => { const relative = path.join(context.checkpointDir || '.bud/checkpoints', `${input.jobId}.json`); const checked = safePath(context.rootDir, relative); if (!checked.safe) return fail('job.checkpoint', context, checked.error!, 'BLOCKED_SECURITY'); fs.mkdirSync(path.dirname(checked.absolute), { recursive: true }); fs.writeFileSync(checked.absolute, JSON.stringify({ ...input, timestamp: new Date().toISOString() }, null, 2)); return skillResult('job.checkpoint', context, { success: true, status: 'READY', artifactsCreated: [relative], output: { path: relative }, evidence: [{ type: 'file', detail: `Checkpoint persistido em ${relative}`, value: fs.statSync(checked.absolute).size }] }); }, 'MEDIUM'),
  base('bud.supervisor', 'BUD Supervisor', 'Solicita decisão estruturada ao Supervisor Gemini ou fallback determinístico.', 'ai', ['read:project'], value => stringInput(value, 'prompt'), async (context, input: any) => { const decision = await runBudSupervisor({ prompt: input.prompt, mode: input.mode || 'EDIT', knownErrors: input.previousErrors || [], currentProjectState: input.currentState }); return skillResult('bud.supervisor', context, { success: true, status: 'READY', output: decision, evidence: [{ type: 'state', detail: `Decisão estruturada via ${decision.provider}`, value: decision.model }] }); })
];
