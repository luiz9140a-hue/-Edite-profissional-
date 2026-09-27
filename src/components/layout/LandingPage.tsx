import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Cpu
} from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeJobStatus, setActiveJobStatus] = useState<string | null>(null);

  const startJob = async (inputPrompt?: string) => {
    const textToRun = inputPrompt || prompt;
    if (!textToRun.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setActiveJobStatus('Iniciando o BUD Agent Engine...');

    try {
      const res = await fetch('/api/generation/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: textToRun })
      });

      if (!res.ok) throw new Error('Falha ao iniciar geração');
      const data = await res.json();

      setActiveJobStatus('Analisando intenção e arquitetura...');
      setTimeout(() => {
        navigate(`/workspace?project=${data.projectId}&job=${data.jobId}`);
      }, 700);
    } catch (err: any) {
      alert('Erro ao iniciar BUD: ' + err.message);
      setIsSubmitting(false);
      setActiveJobStatus(null);
    }
  };

  const handleShortcut = (shortcutText: string) => {
    setPrompt(shortcutText);
  };

  return (
    <div className="min-h-screen bg-[#07090E] text-slate-100 flex flex-col justify-between selection:bg-blue-600 selection:text-white">
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
          <span className="hidden sm:inline-flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Agent Engine Ativo
          </span>
          <button
            onClick={() => navigate('/workspace')}
            className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-4 py-2 rounded-xl transition font-medium"
          >
            Abrir Workspace
          </button>
        </div>
      </nav>

      {/* Main Hero & Command Center */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-12 max-w-4xl mx-auto w-full text-center">
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
          <div className="relative">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={isSubmitting}
              placeholder="Descreva o que você quer criar... Ex: Crie um site premium para uma hamburgueria chamada Burger House, com cardápio, carrinho e botão de WhatsApp."
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

          <div className="mt-3 flex flex-col sm:flex-row items-center justify-between gap-3 px-2">
            <div className="text-xs text-slate-500 font-mono hidden sm:flex items-center gap-2">
              <Terminal className="w-3.5 h-3.5 text-blue-400" />
              <span>Shift + Enter para quebra de linha</span>
            </div>

            <button
              onClick={() => startJob()}
              disabled={isSubmitting || !prompt.trim()}
              className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 disabled:opacity-50 text-white font-extrabold px-8 py-3.5 rounded-2xl text-sm flex items-center justify-center space-x-2 shadow-lg shadow-blue-600/30 transition transform active:scale-95"
            >
              <span>{isSubmitting ? activeJobStatus : 'Construir com BUD'}</span>
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
