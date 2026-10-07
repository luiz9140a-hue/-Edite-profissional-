import { useEffect, useState } from 'react';
import Topbar from './components/Topbar';
import FileTree from './components/FileTree';
import Editor from './components/Editor';
import Preview from './components/Preview';
import BudChat from './components/BudChat';
import BottomPanel, { LogLine } from './components/BottomPanel';
import Landing from './components/Landing';
import { runQa } from './lib/qa';
import { buildHtml } from './lib/build';
import { exportProjectZip, downloadBlob } from './lib/export';
import { saveTextToDisk } from './lib/fs';
import { bundleProject } from './lib/bundle';

const initialFiles: Record<string, string> = {
  'index.html': `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Odonto Prime</title>
<style>
  *{box-sizing:border-box}
  body{margin:0;font-family:Inter,system-ui,sans-serif;color:#172033;background:#fff}
  .site-nav{height:50px;display:flex;justify-content:space-between;align-items:center;padding:0 18px;border-bottom:1px solid #e6ebf2}
  .site-brand{font-weight:800}
  .site-hero{padding:34px 26px;background:linear-gradient(160deg,#f8fbff,#eef6ff)}
  .eyebrow{font-size:11px;text-transform:uppercase;color:#2563eb;font-weight:800}
  h2{font-size:30px;margin:10px 0}
  p{color:#59657a}
  .site-cta{display:inline-flex;padding:9px 13px;border-radius:8px;color:white;background:#2563eb;border:0;cursor:pointer}
  .cards{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;padding:16px 22px}
  .card{background:#f8fafc;border:1px solid #e7ebf0;border-radius:8px;padding:10px}
</style>
</head>
<body>
  <main>
    <nav class="site-nav"><div class="site-brand">Odonto Prime</div></nav>
    <section class="site-hero">
      <div class="eyebrow">Cuidado que inspira confiança</div>
      <h2 id="hero-title">Seu sorriso, com plano e tranquilidade.</h2>
      <p>Atendimento humano e tecnologia.</p>
      <button class="site-cta" id="cta">Agendar avaliação</button>
    </section>
    <section class="cards">
      <div class="card">Clínica Geral</div>
      <div class="card">Implantes</div>
      <div class="card">Ortodontia</div>
    </section>
  </main>
</body>
</html>`,
  'src/main.tsx': `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
`,
  'src/App.tsx': `export default function App() {
  return (
    <main style={{fontFamily:'Inter,system-ui,sans-serif',padding:40}}>
      <h1>Olá, mundo React!</h1>
      <p>Edite este arquivo no painel e veja o preview atualizar.</p>
    </main>
  );
}
`,
};

export default function App() {
  const [screen, setScreen] = useState<'landing' | 'workspace'>('landing');
  const [files, setFiles] = useState<Record<string, string>>(initialFiles);
  const [activeFile, setActiveFile] = useState('index.html');
  const [previewHtml, setPreviewHtml] = useState(initialFiles['index.html']);
  const [previewMode, setPreviewMode] = useState<'static' | 'bundle'>('static');
  const [logs, setLogs] = useState<LogLine[]>([]);
  const [qaOutput, setQaOutput] = useState('');
  const [buildOutput, setBuildOutput] = useState('');
  const [bundleError, setBundleError] = useState('');

  const addLog = (text: string, kind?: LogLine['kind']) =>
    setLogs((l) => [...l, { time: new Date().toLocaleTimeString('pt-BR'), text, kind }].slice(-300));

  useEffect(() => {
    if (previewMode === 'static') setPreviewHtml(files['index.html'] ?? '');
  }, [files, previewMode]);

  useEffect(() => {
    if (previewMode !== 'bundle') return;
    let cancelled = false;
    (async () => {
      try {
        setBundleError('');
        const { html } = await bundleProject(files);
        if (!cancelled) setPreviewHtml(html);
      } catch (e: any) {
        if (!cancelled) setBundleError(String(e?.message || e));
      }
    })();
    return () => { cancelled = true; };
  }, [files, previewMode]);

  const handleQa = () => {
    const target = previewHtml || files['index.html'] || '';
    const { checks, passed, total } = runQa(target);
    setQaOutput(
      checks
        .map((c) => `<div>${c.ok ? '<span class="log-ok">✓</span>' : '<span class="log-err">✗</span>'} ${c.label}${c.detail ? ' — ' + c.detail : ''}</div>`)
        .join('')
    );
    addLog(`qa.run · ${passed}/${total}`, passed === total ? 'ok' : 'warn');
  };

  const handleBuild = () => {
    const local = buildHtml(files['index.html'] || '');
    setBuildOutput(
      local.ok
        ? `<div><span class="log-ok">✓ build</span> · ${(local.size / 1024).toFixed(2)} KB</div>`
        : local.issues.map((i) => `<div><span class="log-err">✗</span> ${i}</div>`).join('')
    );
    addLog(local.ok ? 'build.run · ok' : 'build.run · falhou', local.ok ? 'ok' : 'err');
  };

  const handleSave = async () => {
    try {
      await saveTextToDisk(files[activeFile] ?? '', activeFile.split('/').pop() || 'file.txt');
      addLog('file.save · ok', 'ok');
    } catch {
      addLog('file.save · cancelado', 'warn');
    }
  };

  const handleExport = async () => {
    const blob = await exportProjectZip(files);
    downloadBlob(blob, 'edite-profissional.zip');
    addLog('export.zip · ok', 'ok');
  };

  const handleCommand = (c: string) => {
    const cmd = c.trim().toLowerCase();
    if (cmd === 'help') addLog('comandos: help · qa · build · export · save · clear');
    else if (cmd === 'qa') handleQa();
    else if (cmd === 'build') handleBuild();
    else if (cmd === 'export') handleExport();
    else if (cmd === 'save') handleSave();
    else if (cmd === 'clear') setLogs([]);
    else addLog(`comando desconhecido: ${c}`, 'err');
  };

  const editorValue = files[activeFile] ?? '';
  const fileCount = Object.keys(files).length;

  if (screen === 'landing') return <Landing onStart={() => setScreen('workspace')} />;

  return (
    <div className="app">
      <Topbar onQa={handleQa} onBuild={handleBuild} onExport={handleExport} onSave={handleSave} />
      <div className="shell">
        <FileTree files={files} active={activeFile} onSelect={setActiveFile} />
        <main className="main">
          <div className="editorbar">
            <div className="editor-meta">{activeFile} · {fileCount} arquivo(s)</div>
            {bundleError && <div className="editor-meta log-err">bundle: {bundleError}</div>}
          </div>
          <div className="workgrid">
            <Editor
              value={editorValue}
              filename={activeFile}
              onChange={(v) => setFiles((f) => ({ ...f, [activeFile]: v }))}
            />
            <Preview html={previewHtml} mode={previewMode} onModeChange={setPreviewMode} />
          </div>
          <BottomPanel
            logs={logs}
            qaOutput={qaOutput}
            buildOutput={buildOutput}
            onCommand={handleCommand}
          />
        </main>
        <BudChat
          html={files['index.html'] ?? ''}
          setHtml={(h) => setFiles((f) => ({ ...f, 'index.html': h }))}
          onRunQa={handleQa}
          onRunBuild={handleBuild}
          onLog={(m, k) => addLog(m, k)}
        />
      </div>
    </div>
  );
}

