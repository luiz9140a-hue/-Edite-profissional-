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
// Firebase é inicializado aqui (as variáveis de ambiente VITE_FIREBASE_* devem estar na Vercel)
import './lib/firebase';

const initialFiles: Record<string, string> = {
  'index.html': `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Meu Projeto</title>
<style>
  *{box-sizing:border-box}
  body{margin:0;font-family:Inter,system-ui,sans-serif;color:#172033;background:#fff;display:grid;place-items:center;min-height:100vh;padding:20px}
  .card{max-width:640px;text-align:center}
  h1{font-size:42px;margin:0 0 16px;letter-spacing:-.03em}
  p{color:#59657a;font-size:16px;line-height:1.6}
</style>
</head>
<body>
  <div class="card">
    <h1>Bem-vindo ao BUD</h1>
    <p>Descreva no chat ao lado o que você quer criar. A IA vai gerar o site completo aqui.</p>
  </div>
</body>
</html>`,
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
        const { html } = await bundleProject(files);
        if (!cancelled) setPreviewHtml(html);
      } catch (e: any) {
        if (!cancelled) addLog('bundle.error · ' + e.message, 'err');
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
          onLog={(m, k) => addLog(m, k)}
        />
      </div>
    </div>
  );
}
