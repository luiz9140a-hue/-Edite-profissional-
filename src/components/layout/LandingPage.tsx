import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import {
  Sparkles,
  ArrowRight,
  Code2,
  Layers,
  ShoppingBag,
  Zap,
  Smartphone,
  Bot,
  CheckCircle2,
  Terminal,
  ShieldCheck,
  Cpu,
  Paperclip,
  X
} from 'lucide-react';
import { ProjectAsset, ProjectAssetKind } from '../../types/engrenagem';

export default function LandingPage() {
  const navigate = useNavigate();
  const { user, isAdmin, logout } = useAuth();
  const [prompt, setPrompt] = useState(() => new URLSearchParams(window.location.search).get('prompt') || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeJobStatus, setActiveJobStatus] = useState<string | null>(null);
  const [intakeMessages, setIntakeMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [isDiscovery, setIsDiscovery] = useState(false);
  const [uploadedAssets, setUploadedAssets] = useState<ProjectAsset[]>([]);

  const handleAssetFiles = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []).slice(0, 8);
    const next = await Promise.all(files.map(file => new Promise<ProjectAsset>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const kind: ProjectAssetKind = file.type.startsWith('video/') ? 'video' : file.type.startsWith('audio/') ? 'audio' : 'image';
        resolve({ id: `upload-${Date.now()}-${file.name}`, name: file.name, kind, mimeType: file.type, size: file.size, dataUrl: String(reader.result), source: 'upload', createdAt: new Date().toISOString() });
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    })));
    setUploadedAssets(prev => [...prev, ...next].slice(0, 8));
    event.target.value = '';
  };

  const createJob = async (textToRun: string) => {
    const res = await fetch('/api/generation/jobs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-account-id': user?.uid || 'anonymous', 'x-plan-id': isAdmin ? 'admin_lifetime' : 'free' },
      body: JSON.stringify({ prompt: textToRun, assets: uploadedAssets })
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || 'Falha ao iniciar geração');
    }

    const data = await res.json();
    setActiveJobStatus('Analisando intenção e arquitetura...');
    setTimeout(() => navigate(`/workspace?project=${data.projectId}&job=${data.jobId}`), 700);
  };

  const startJob = async (inputPrompt?: string) => {
    const textToRun = inputPrompt || prompt;
    if (!textToRun.trim() || isSubmitting) return;
    if (!user) {
      navigate('/login', { state: { from: '/' } });
      return;
    }

    setIsSubmitting(true);
    setActiveJobStatus(isDiscovery ? 'BUD está entendendo seus requisitos...' : 'Iniciando o BUD Agent Engine...');

    try {
      const looksLikeSaaS = /\b(saas|software|plataforma|sistema)\b/i.test(textToRun) || intakeMessages.length > 0;
      if (looksLikeSaaS) {
        const res = await fetch('/api/bud/intake', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: textToRun, history: intakeMessages })
        });
        if (!res.ok) throw new Error('Falha ao conversar com o BUD');
        const data = await res.json();
        setIntakeMessages(prev => [...prev, { role: 'user', content: textToRun }, { role: 'assistant', content: data.message }]);
        setPrompt('');
        if (data.status === 'QUESTION') {
          setIsDiscovery(true);
          setIsSubmitting(false);
          setActiveJobStatus('BUD aguardando sua resposta...');
          return;
        }
        setIsDiscovery(false);
        await createJob(data.prompt || textToRun);
        return;
      }

      await createJob(textToRun);
      /* A navegação ocorre em createJob depois que o servidor aceita o pedido. */
      /* Mantemos o estado de envio até a troca de tela para impedir jobs duplicados. */
      return;
    } catch (err: any) {
      alert('Erro ao iniciar BUD: ' + err.message);
      setIsSubmitting(false);
      setActiveJobStatus(null);
    }
  };

  const handleShortcut = (shortcutText: string) => {
    setIntakeMessages([]);
    setIsDiscovery(false);
    setPrompt(shortcutText);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#07090E] text-slate-100 flex flex-col justify-between selection:bg-blue-600 selection:text-white">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-0 overflow-hidden">
        <div className="absolute left-1/2 top-[-18rem] h-[34rem] w-[55rem] -translate-x-1/2 rounded-full bg-blue-600/10 blur-3xl" />
        <div className="absolute bottom-[-20rem] right-[-10rem] h-[32rem] w-[32rem] rounded-full bg-cyan-500/5 blur-3xl" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />
      </div>
      {/* Top Navbar */}
      <nav className="border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-md px-6 py-4 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center font-black text-xl text-white shadow-lg shadow-blue-500/25">
            <Cpu className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="font-extrabold text-xl tracking-tight text-white flex items-center gap-1.5">
              ENGRENAGEM <span className="text-blue-500 font-black">AI</span>
            </div>
            <div className="text-[10px] text-slate-400 font-mono uppercase tracking-widest">
              BUD • Creation Engine
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {user && <div className="hidden sm:block text-right"><div className="text-xs text-slate-200 max-w-[180px] truncate">{user.email}</div><div className="text-[10px] text-emerald-400">{isAdmin ? 'ADMIN • VITALÍCIO' : 'CONTA ATIVA'}</div></div>}
          <span className="hidden sm:inline-flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Agent Engine Ativo
          </span>
          <button
            onClick={() => user ? navigate('/workspace') : navigate('/login')}
            className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-4 py-2 rounded-xl transition font-medium"
          >
            {user ? 'Abrir Workspace' : 'Entrar / Criar conta'}
          </button>
          {user && <button onClick={() => navigate('/beginner')} className="hidden sm:inline-flex text-xs bg-blue-600/20 hover:bg-blue-600/30 text-blue-200 border border-blue-500/30 px-4 py-2 rounded-xl transition font-medium">Primeiro cliente</button>}
          {user && <button onClick={() => logout()} className="text-xs text-slate-400 hover:text-white">Sair</button>}
        </div>
      </nav>

      {/* Main Hero & Command Center */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-12 max-w-4xl mx-auto w-full text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 px-4 py-1.5 rounded-full text-xs font-semibold mb-6 shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-blue-400" />
          <span>Linguagem Natural → Software Real e Interativo</span>
        </div>

        {/* Headlines */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.08] mb-6 text-white">
          Você explica.<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-indigo-400">
            O BUD constrói.
          </span>
        </h1>

        <p className="text-base sm:text-xl text-slate-400 mb-10 max-w-2xl leading-relaxed">
          Crie sites, SaaS, lojas e sistemas completos conversando com uma inteligência artificial que planeja, programa, testa e entrega.
        </p>

        {/* Command Center Card */}
        <div className="w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-3 sm:p-4 shadow-2xl shadow-blue-950/20 backdrop-blur-xl relative">
          {intakeMessages.length > 0 && (
            <div className="mb-3 max-h-44 overflow-y-auto rounded-2xl border border-blue-500/20 bg-slate-950/70 p-3 text-left space-y-2">
              <div className="text-[10px] uppercase tracking-wider text-blue-400 font-bold">Descoberta guiada pelo BUD</div>
              {intakeMessages.map((item, index) => (
                <div key={`${item.role}-${index}`} className={item.role === 'assistant' ? 'text-slate-300 text-xs' : 'text-blue-200 text-xs text-right'}>
                  <span className="font-bold mr-1">{item.role === 'assistant' ? 'BUD:' : 'Você:'}</span>{item.content}
                </div>
              ))}
            </div>
          )}
          <div className="relative">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={isSubmitting}
              placeholder={isDiscovery ? 'Responda à pergunta do BUD para continuar...' : 'Descreva o que você quer criar... Ex: Quero uma SaaS para academias com alunos, treinos e pagamentos.'}
              rows={3}
              className="w-full p-4 sm:p-5 rounded-2xl bg-slate-950/80 border border-slate-850 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm sm:text-base leading-relaxed resize-none transition"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  startJob();
                }
              }}
            />
          </div>

          {uploadedAssets.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2 px-2">
              {uploadedAssets.map(asset => (
                <div key={asset.id} className="flex items-center gap-2 rounded-xl border border-blue-500/30 bg-blue-500/10 px-3 py-2 text-xs text-blue-200">
                  <span>{asset.kind === 'video' ? 'Vídeo' : asset.kind === 'audio' ? 'Áudio' : 'Foto'} · {asset.name}</span>
                  <button type="button" onClick={() => setUploadedAssets(prev => prev.filter(item => item.id !== asset.id))} aria-label={`Remover ${asset.name}`}><X className="w-3.5 h-3.5" /></button>
                </div>
              ))}
            </div>
          )}

          <div className="mt-3 flex flex-col sm:flex-row items-center justify-between gap-3 px-2">
            <div className="text-xs text-slate-500 font-mono hidden sm:flex items-center gap-2">
              <Terminal className="w-3.5 h-3.5 text-blue-400" />
              <span>Shift + Enter para quebra de linha</span>
            </div>

            <label className="w-full sm:w-auto cursor-pointer border border-slate-700 hover:border-blue-400 text-slate-300 px-4 py-3.5 rounded-2xl text-sm flex items-center justify-center gap-2 transition">
              <Paperclip className="w-4 h-4" />
              <span>Anexar foto, vídeo ou áudio</span>
              <input type="file" className="hidden" accept="image/*,video/*,audio/*" multiple onChange={handleAssetFiles} />
            </label>

            <button
              onClick={() => startJob()}
              disabled={isSubmitting || !prompt.trim()}
              className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 disabled:opacity-50 text-white font-extrabold px-8 py-3.5 rounded-2xl text-sm flex items-center justify-center space-x-2 shadow-lg shadow-blue-600/30 transition transform active:scale-95"
            >
              <span>{isSubmitting ? activeJobStatus : isDiscovery ? 'Enviar resposta ao BUD' : 'Construir com BUD'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Category Starter Buttons (Requirement #2) */}
        <div className="mt-8 w-full max-w-3xl">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
            O que você quer criar? (Atalhos rápidos)
          </div>
          <div className="flex flex-wrap justify-center gap-2.5">
            <button
              onClick={() => handleShortcut('Crie uma landing page de alta conversão para meu primeiro cliente de consultoria financeira, com depoimentos e formulário de qualificação.')}
              className="bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition"
            >
              <span>🚀 Primeiro cliente</span>
            </button>
            <button
              onClick={() => handleShortcut('Crie um site institucional moderno para um escritório de advocacia corporativa com áreas de atuação e agendamento de consulta.')}
              className="bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition"
            >
              <span>🎨 Criar site</span>
            </button>
            <button
              onClick={() => handleShortcut('Crie uma SaaS para uma clínica odontológica chamada DentalCare com login, pacientes, agenda, tratamentos e dashboard.')}
              className="bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition"
            >
              <span>⚡ Criar SaaS</span>
            </button>
            <button
              onClick={() => handleShortcut('Crie um delivery premium para uma adega que vende bebidas, gelo, carvão e copos, com carrinho rápido e WhatsApp.')}
              className="bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition"
            >
              <span>🛒 Criar loja</span>
            </button>
            <button
              onClick={() => handleShortcut('Crie um aplicativo de acompanhamento de treinos para academia com cronômetro, histórico de séries e ficha de exercícios.')}
              className="bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition"
            >
              <span>📱 Criar aplicativo</span>
            </button>
            <button
              onClick={() => handleShortcut('Crie um site premium para uma hamburgueria chamada Burger House, com cardápio, carrinho e botão de WhatsApp.')}
              className="bg-slate-900/80 hover:bg-blue-900/40 border border-slate-800 hover:border-blue-500/50 text-blue-300 px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition"
            >
              <span>🤖 Pedir ao BUD</span>
            </button>
          </div>
        </div>

        {/* Acceptance Tests Direct Triggers */}
        <div className="mt-12 pt-8 border-t border-slate-850 w-full grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
          <div
            onClick={() => {
              const p = 'Crie um site premium para uma hamburgueria chamada Burger House, com cardápio, carrinho e botão de WhatsApp.';
              setPrompt(p);
              startJob(p);
            }}
            className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-orange-500/50 cursor-pointer transition group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-orange-400 uppercase tracking-wide">Teste de Aceitação 1</span>
              <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono">Executar</span>
            </div>
            <h4 className="font-extrabold text-sm text-white group-hover:text-orange-400 transition">
              🍔 Hamburgueria Burger House
            </h4>
            <p className="text-xs text-slate-400 mt-1">
              Gera menu artesanal, carrinho funcional, cálculo e integração WhatsApp. Rejeita ativos médicos.
            </p>
          </div>

          <div
            onClick={() => {
              const p = 'Crie uma SaaS para uma clínica odontológica com login, pacientes, agenda, tratamentos e dashboard.';
              setPrompt(p);
              startJob(p);
            }}
            className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-sky-500/50 cursor-pointer transition group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-sky-400 uppercase tracking-wide">Teste de Aceitação 2</span>
              <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono">Executar</span>
            </div>
            <h4 className="font-extrabold text-sm text-white group-hover:text-sky-400 transition">
              🦷 Dental SaaS Clínico
            </h4>
            <p className="text-xs text-slate-400 mt-1">
              Gera dashboard de gestão, agenda de consultas e fichas de pacientes. Rejeita hambúrgueres e bebidas.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-850 py-6 px-6 text-center text-xs text-slate-500 flex flex-col sm:flex-row justify-between items-center max-w-5xl mx-auto w-full gap-2">
        <div>© {new Date().getFullYear()} ENGRENAGEM AI • Autonomous Creation Engine</div>
        <div className="flex items-center space-x-4">
          <span className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-blue-400" /> Zero Fake Execution</span>
          <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Real QA & Sandbox</span>
        </div>
      </footer>
    </div>
  );
}
