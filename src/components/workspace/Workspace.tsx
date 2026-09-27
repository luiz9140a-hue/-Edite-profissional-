import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  FolderTree,
  FileCode,
  Terminal,
  Play,
  RotateCw,
  Maximize2,
  ExternalLink,
  Send,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Brain,
  GitBranch,
  CloudUpload,
  Cpu,
  Layers,
  ChevronRight,
  Download,
  Copy,
  Check,
  Loader2,
  Wrench,
  Menu,
  X,
  Sliders,
  Sparkles,
  ArrowLeft
} from 'lucide-react';
import { GenerationJob, JobStatus, Project, ProjectFile } from '../../types/engrenagem';
import { ErrorBoundary } from '../common/ErrorBoundary';
import PreviewStage from '../preview/PreviewStage';
import MobileWorkspaceNavigation, { MobileTab } from './MobileWorkspaceNavigation';
import ProjectFilesList from './ProjectFilesList';
import ProjectAssetLibrary from './ProjectAssetLibrary';
import { useAuth } from '../../auth/AuthContext';

export default function Workspace() {
  return (
    <ErrorBoundary fallbackTitle="Erro no Painel do Workspace">
      <WorkspaceContent />
    </ErrorBoundary>
  );
}

function WorkspaceContent() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const accountHeaders = {
    'x-account-id': user?.uid || 'anonymous',
    'x-plan-id': isAdmin ? 'admin_lifetime' : 'free'
  };
  const projectIdParam = searchParams.get('project');
  const jobIdParam = searchParams.get('job');

  const [project, setProject] = useState<Project | null>(null);
  const [job, setJob] = useState<GenerationJob | null>(null);
  const [loading, setLoading] = useState(true);

  // Responsive state detection
  const [windowWidth, setWindowWidth] = useState<number>(
    typeof window !== 'undefined' ? window.innerWidth : 1200
  );

  // Mobile active tab ('preview' | 'bud' | 'code' | 'files' | 'more')
  const [mobileTab, setMobileTab] = useState<MobileTab>('preview');
  const [isMoreDrawerOpen, setIsMoreDrawerOpen] = useState(false);

  // Desktop panel widths (Resizable)
  const [leftSidebarWidth, setLeftSidebarWidth] = useState(250);
  const [budSidebarWidth, setBudSidebarWidth] = useState(340);
  const [isDraggingLeft, setIsDraggingLeft] = useState(false);
  const [isDraggingRight, setIsDraggingRight] = useState(false);

  // Workspace UI states
  const [selectedFile, setSelectedFile] = useState<string>('src/App.tsx');
  const [activeLeftTab, setActiveLeftTab] = useState<'files' | 'brain' | 'integrations'>('files');
  const [activeBottomTab, setActiveBottomTab] = useState<'terminal' | 'qa' | 'readiness'>('terminal');
  const [chatInput, setChatInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [copiedFile, setCopiedFile] = useState(false);
  const [actionLock, setActionLock] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);
  const [publishKit, setPublishKit] = useState<{ links: { githubNewRepository: string; vercelImport: string; netlifyDrop: string }; ready: boolean } | null>(null);

  const terminalEndRef = useRef<HTMLDivElement>(null);
  const chatMessagesEndRef = useRef<HTMLDivElement>(null);

  // Track window resizing
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = windowWidth < 768;
  const isTablet = windowWidth >= 768 && windowWidth < 1024;
  const isDesktop = windowWidth >= 1024;

  // Poll job status until READY or FAILED
  useEffect(() => {
    let interval: any = null;
    let isMounted = true;

    const fetchStatus = async () => {
      try {
        if (jobIdParam) {
          const res = await fetch(`/api/generation/jobs/${jobIdParam}`);
          if (res.ok && isMounted) {
            const data: GenerationJob = await res.json();
            setJob(data);

            const projRes = await fetch(`/api/projects/${data.projectId}`);
            if (projRes.ok && isMounted) {
              const projData: Project = await projRes.json();
              setProject(projData);

              // Select first file if current selected does not exist
              if (projData.files && !projData.files[selectedFile]) {
                const keys = Object.keys(projData.files);
                if (keys.length > 0 && keys[0]) {
                  setSelectedFile(keys[0]);
                }
              }
            }

            if (data.status === 'READY' || data.status === 'FAILED') {
              setIsProcessing(false);
            }
          }
        } else if (projectIdParam) {
          const projRes = await fetch(`/api/projects/${projectIdParam}`);
          if (projRes.ok && isMounted) {
            const projData: Project = await projRes.json();
            setProject(projData);
          }
        } else {
          createDefaultProject();
        }
      } catch (err) {
        console.error('Erro ao consultar status:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchStatus();
    interval = setInterval(fetchStatus, 1500);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [jobIdParam, projectIdParam]);

  // Scroll to bottom of chat when new message appears
  useEffect(() => {
    chatMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [project?.brain?.history, isProcessing]);

  const createDefaultProject = async () => {
    try {
      const res = await fetch('/api/generation/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...accountHeaders },
        body: JSON.stringify({
          prompt: 'Crie um site premium para uma hamburgueria chamada Burger House, com cardápio, carrinho e botão de WhatsApp.'
        })
      });
      if (!res.ok) return;
      const data = await res.json();
      navigate(`/workspace?project=${data.projectId}&job=${data.jobId}`, { replace: true });
    } catch (e) {
      console.error(e);
    }
  };

  const handleSendChat = async (customMessage?: string) => {
    const msg = customMessage || chatInput;
    if (!msg.trim() || isProcessing || !project) return;
    if (!customMessage) setChatInput('');
    setIsProcessing(true);

    try {
      const res = await fetch('/api/bud/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...accountHeaders },
        body: JSON.stringify({
          projectId: project.id,
          message: msg
        })
      });

      if (!res.ok) throw new Error('Falha ao enviar instrução');
      const data = await res.json();
      navigate(`/workspace?project=${project.id}&job=${data.jobId}`, { replace: true });
    } catch (err: any) {
      alert('Erro: ' + err.message);
      setIsProcessing(false);
    }
  };

  const handleAutoRepair = async () => {
    if (!project || actionLock) return;
    setActionLock('REPAIRING');
    setActionFeedback({ message: 'BUD diagnosticando e aplicando autocorreção nos arquivos...', type: 'info' });
    try {
      const res = await fetch(`/api/projects/${project.id}/repair`, { method: 'POST' });
      const data = await res.json();
      setActionFeedback({ message: data.message || 'Correção aplicada com sucesso!', type: 'success' });
      if (data.readiness) {
        setProject(prev => prev ? { ...prev, readiness: data.readiness } : null);
      }
    } catch (e: any) {
      setActionFeedback({ message: 'Falha no reparo: ' + e.message, type: 'error' });
    } finally {
      setActionLock(null);
      setTimeout(() => setActionFeedback(null), 4000);
    }
  };

  const handleManualBuild = async () => {
    if (!project || actionLock) return;
    setActionLock('BUILDING');
    setActionFeedback({ message: 'Compilando e verificando integridade de código...', type: 'info' });
    try {
      const res = await fetch(`/api/projects/${project.id}/build`, { method: 'POST' });
      const data = await res.json();
      setActionFeedback({ message: data.message || 'Build compilado com 0 erros!', type: 'success' });
    } catch (e: any) {
      setActionFeedback({ message: 'Falha no build: ' + e.message, type: 'error' });
    } finally {
      setActionLock(null);
      setTimeout(() => setActionFeedback(null), 4000);
    }
  };

  const handleManualTest = async () => {
    if (!project || actionLock) return;
    setActionLock('TESTING');
    setActionFeedback({ message: 'Executando testes funcionais e de componentes...', type: 'info' });
    try {
      const res = await fetch(`/api/projects/${project.id}/test`, { method: 'POST' });
      const data = await res.json();
      setActionFeedback({ message: `${data.testsPassed} testes executados e aprovados com sucesso!`, type: 'success' });
    } catch (e: any) {
      setActionFeedback({ message: 'Falha nos testes: ' + e.message, type: 'error' });
    } finally {
      setActionLock(null);
      setTimeout(() => setActionFeedback(null), 4000);
    }
  };

  const handleManualQA = async () => {
    if (!project || actionLock) return;
    setActionLock('QA');
    setActionFeedback({ message: 'Executando auditoria completa em 6 dimensões de QA...', type: 'info' });
    try {
      const res = await fetch(`/api/projects/${project.id}/qa`, { method: 'POST' });
      const data = await res.json();
      setActionFeedback({ message: `Auditoria concluída com pontuação ${data.readiness.score}/100!`, type: 'success' });
      if (data.readiness) {
        setProject(prev => prev ? { ...prev, readiness: data.readiness } : null);
      }
    } catch (e: any) {
      setActionFeedback({ message: 'Falha no QA: ' + e.message, type: 'error' });
    } finally {
      setActionLock(null);
      setTimeout(() => setActionFeedback(null), 4000);
    }
  };

  const handleManualDeploy = async (target: 'cloud_run' | 'vercel' | 'netlify' = 'cloud_run') => {
    if (!project || actionLock) return;
    setActionLock('DEPLOYING');
    setActionFeedback({ message: `Validando publicação na ${target}...`, type: 'info' });
    try {
      const res = await fetch(`/api/projects/${project.id}/deploy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target })
      });
      const data = await res.json();
      if (!res.ok || !data.success || data.deployment?.state === 'FAILED') {
        setActionFeedback({ message: data.message || data.deployment?.logs?.at(-1) || `Configure a credencial da ${target} para publicar.`, type: 'error' });
      } else {
        setActionFeedback({ message: `Publicação concluída: ${data.deployment.url}`, type: 'success' });
      }
    } catch (e: any) {
      setActionFeedback({ message: 'Falha no deploy: ' + e.message, type: 'error' });
    } finally {
      setActionLock(null);
      setTimeout(() => setActionFeedback(null), 5000);
    }
  };

  const handleOpenPublishKit = async () => {
    if (!project) return;
    setActionFeedback({ message: 'Preparando kit final para GitHub, Vercel e Netlify...', type: 'info' });
    try {
      const res = await fetch(`/api/projects/${project.id}/publish-kit`);
      if (!res.ok) throw new Error('Não foi possível preparar o kit');
      setPublishKit(await res.json());
      setActionFeedback({ message: 'Kit pronto. Escolha onde publicar ou compartilhar.', type: 'success' });
    } catch (e: any) {
      setActionFeedback({ message: 'Falha ao preparar publicação: ' + e.message, type: 'error' });
    }
  };

  const handleSyncGitHub = async () => {
    if (!project) return;
    setActionFeedback({ message: 'Consultando sincronização com GitHub...', type: 'info' });
    try {
      const res = await fetch(`/api/projects/${project.id}/github/sync`, { method: 'POST' });
      const data = await res.json();
      setActionFeedback({ message: data.message, type: data.success ? 'success' : 'info' });
    } catch (e: any) {
      setActionFeedback({ message: 'Erro ao consultar GitHub: ' + e.message, type: 'error' });
    } finally {
      setTimeout(() => setActionFeedback(null), 5000);
    }
  };

  const handleOpenNewTab = () => {
    if (project) {
      window.open(`/preview/${project.id}`, '_blank', 'noopener,noreferrer');
    }
  };

  const copyCode = () => {
    if (project?.files && project.files[selectedFile]) {
      navigator.clipboard.writeText(project.files[selectedFile].content);
      setCopiedFile(true);
      setTimeout(() => setCopiedFile(false), 2000);
    }
  };

  const exportZip = async () => {
    if (!project) return;
    setActionFeedback({ message: 'Gerando pacote de exportação no servidor...', type: 'info' });
    try {
      const res = await fetch(`/api/projects/${project.id}/export`, { method: 'POST' });
      if (!res.ok) throw new Error('Falha ao exportar projeto');
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${(project.name || 'projeto').toLowerCase().replace(/\s+/g, '-')}-bundle.json`;
      a.click();
      setActionFeedback({ message: 'Download do projeto concluído!', type: 'success' });
    } catch (e: any) {
      setActionFeedback({ message: 'Falha na exportação: ' + e.message, type: 'error' });
    } finally {
      setTimeout(() => setActionFeedback(null), 3000);
    }
  };

  // Resizing mouse move handlers
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingLeft) {
        const newWidth = Math.max(220, Math.min(320, e.clientX));
        setLeftSidebarWidth(newWidth);
      } else if (isDraggingRight) {
        const newWidth = Math.max(280, Math.min(520, window.innerWidth - e.clientX));
        setBudSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsDraggingLeft(false);
      setIsDraggingRight(false);
    };

    if (isDraggingLeft || isDraggingRight) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingLeft, isDraggingRight]);

  const currentFileContent = project?.files?.[selectedFile]?.content || '// Arquivo sendo gerado pelo BUD...';
  const logsList = job?.logs || [];
  const qaReportsList = job?.qaReport || [];
  const projectHistory = project?.brain?.history || [];

  return (
    <div className="flex flex-col h-screen bg-[#07090E] text-slate-200 overflow-hidden font-sans select-none">
      {/* ===================== RESPONSIVE HEADER ===================== */}
      <header
        className="h-14 border-b border-slate-800/90 bg-slate-950/90 px-3 sm:px-4 flex items-center justify-between flex-shrink-0 z-20"
        style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
      >
        <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
          <button
            onClick={() => navigate('/')}
            className="flex items-center space-x-2 text-white hover:text-blue-400 transition flex-shrink-0 min-h-[44px] min-w-[44px] justify-center"
            title="Voltar para a Landing Page"
          >
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center font-black text-xs text-white shadow-md shadow-blue-600/30">
              <Cpu className="w-4 h-4" />
            </div>
            <span className="font-extrabold text-sm tracking-tight hidden sm:inline">ENGRENAGEM AI</span>
          </button>

          <span className="text-slate-600 hidden sm:inline">/</span>

          <span className="font-bold text-xs sm:text-sm text-slate-200 truncate max-w-[130px] sm:max-w-xs">
            {project?.name || 'Iniciando Projeto...'}
          </span>

          {/* Status Badge */}
          {job && (
            <span
              className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold flex items-center gap-1.5 flex-shrink-0 ${
                job.status === 'READY'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : job.status === 'FAILED'
                  ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                  : 'bg-blue-500/10 text-blue-400 border border-blue-500/20 animate-pulse'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  job.status === 'READY' ? 'bg-emerald-400' : 'bg-blue-400'
                }`}
              ></span>
              <span className="hidden xs:inline">{job.status}</span>
            </span>
          )}
        </div>

        {/* Action Toolbar (Desktop/Tablet) */}
        <div className="hidden md:flex items-center space-x-1 bg-slate-900/90 border border-slate-800 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={handleManualBuild}
            disabled={!!actionLock}
            className={`px-2.5 py-1 rounded-lg transition flex items-center gap-1 ${
              actionLock === 'BUILDING' ? 'bg-blue-600 text-white animate-pulse' : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
            title="Executar Compilação Real de Build"
          >
            <span>🔨 Build</span>
          </button>
          <button
            onClick={handleManualTest}
            disabled={!!actionLock}
            className={`px-2.5 py-1 rounded-lg transition flex items-center gap-1 ${
              actionLock === 'TESTING' ? 'bg-blue-600 text-white animate-pulse' : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
            title="Executar Suíte de Testes"
          >
            <span>🧪 Testes</span>
          </button>
          <button
            onClick={handleManualQA}
            disabled={!!actionLock}
            className={`px-2.5 py-1 rounded-lg transition flex items-center gap-1 ${
              actionLock === 'QA' ? 'bg-blue-600 text-white animate-pulse' : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
            title="Auditoria Completa em 6 Dimensões de QA"
          >
            <span>🔍 QA</span>
          </button>
          <button
            onClick={handleAutoRepair}
            disabled={!!actionLock}
            className={`px-2.5 py-1 rounded-lg transition flex items-center gap-1 ${
              actionLock === 'REPAIRING' ? 'bg-blue-600 text-white animate-pulse' : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
            title="Diagnosticar e Reparar Automaticamente com BUD"
          >
            <span>🔧 Corrigir</span>
          </button>
          <button
            onClick={() => handleManualDeploy('cloud_run')}
            disabled={!!actionLock}
            className={`px-2.5 py-1 rounded-lg transition flex items-center gap-1 ${
              actionLock === 'DEPLOYING' ? 'bg-emerald-600 text-white animate-pulse' : 'text-emerald-400 hover:text-emerald-300 hover:bg-slate-800'
            }`}
            title="Publicar / Deploy no Cloud Run"
          >
            <span>🚀 Deploy</span>
          </button>
        </div>

        {/* Top Header Actions */}
        <div className="flex items-center space-x-1.5 sm:space-x-2 flex-shrink-0">
          {project && (
            <button
              onClick={handleOpenNewTab}
              className="min-h-[40px] px-2.5 py-1.5 text-slate-400 hover:text-white hover:bg-slate-900 rounded-xl border border-slate-800 transition flex items-center gap-1.5 text-xs font-semibold"
              title="Abrir Preview em Nova Aba Independente"
            >
              <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden sm:inline">Nova Aba</span>
            </button>
          )}

          <button
            onClick={exportZip}
            className="min-h-[40px] px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-850 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
            title="Exportar Arquivos do Projeto"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Exportar</span>
          </button>
        </div>
      </header>

      {/* Global Action Feedback Notification Banner */}
      {actionFeedback && (
        <div className={`px-4 py-2 text-xs font-semibold flex items-center justify-between z-30 transition-all ${
          actionFeedback.type === 'success'
            ? 'bg-emerald-600/90 text-white'
            : actionFeedback.type === 'error'
            ? 'bg-red-600/90 text-white'
            : 'bg-blue-600/90 text-white'
        }`}>
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
            <span>{actionFeedback.message}</span>
          </div>
          <button
            onClick={() => setActionFeedback(null)}
            className="text-white hover:text-slate-200 text-xs px-2 py-0.5 rounded"
          >
            ✕
          </button>
        </div>
      )}

      {/* ===================== MOBILE VIEW (SCREEN < 768PX) ===================== */}
      {isMobile ? (
        <div
          className="flex-1 flex flex-col min-w-0 overflow-hidden relative"
          style={{ paddingBottom: 'calc(62px + env(safe-area-inset-bottom, 8px))' }}
        >
          {/* TAB 1: PREVIEW (Mobile Fullscreen) */}
          {mobileTab === 'preview' && (
            <div className="flex-1 flex flex-col h-full bg-[#0A0D14]">
              {project ? (
                <PreviewStage
                  project={project}
                  onAutoRepair={handleAutoRepair}
                  onOpenLogs={() => setMobileTab('more')}
                  isMobileHost={true}
                />
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-slate-500 font-mono text-xs">
                  <Loader2 className="w-5 h-5 animate-spin text-blue-500 mb-2" />
                  <span>Carregando Preview...</span>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: BUD CHAT (Mobile Conversational App Style) */}
          {mobileTab === 'bud' && (
            <div className="flex-1 flex flex-col h-full bg-slate-950">
              {/* Chat Header */}
              <div className="h-10 px-4 border-b border-slate-850 bg-slate-900/80 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping"></span>
                  <span className="font-bold text-white">BUD Conversational</span>
                </div>
                <span className="text-[10px] text-emerald-400 font-mono font-bold">ONLINE</span>
              </div>

              {/* Chat Message Stream */}
              <div className="flex-1 overflow-y-auto p-3 space-y-3 text-xs">
                <div className="bg-slate-900 border border-slate-800 p-3 rounded-2xl text-slate-300 space-y-1.5">
                  <div className="font-bold text-blue-400 flex items-center gap-1.5">
                    <Cpu className="w-4 h-4" /> BUD Agent
                  </div>
                  <p className="leading-relaxed">
                    O que você gostaria de construir ou modificar nesta aplicação?
                  </p>
                  {/* Quick Pills */}
                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {[
                      'Trocar cor principal',
                      'Adicionar cupom de 10%',
                      'Inserir botão WhatsApp',
                      'Mais opções'
                    ].map((pill) => (
                      <button
                        key={pill}
                        onClick={() => handleSendChat(pill)}
                        className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] px-2.5 py-1 rounded-full border border-slate-700 active:scale-95 transition"
                      >
                        {pill}
                      </button>
                    ))}
                  </div>
                </div>

                {projectHistory.map((hist) => (
                  <div key={hist.id} className="space-y-1.5">
                    <div className="bg-blue-600/30 border border-blue-500/40 text-blue-100 p-3 rounded-2xl ml-auto max-w-[85%] font-medium">
                      {hist.prompt}
                    </div>
                    <div className="bg-slate-900 border border-slate-800 p-3 rounded-2xl text-slate-300 text-xs">
                      <div className="text-emerald-400 font-bold mb-1 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> {hist.changesSummary}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Código compilado e atualizado no sandbox.
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={chatMessagesEndRef} />
              </div>

              {/* Chat Input Bar */}
              <div className="p-2 border-t border-slate-850 bg-slate-950/95">
                <div className="relative flex items-center">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                    disabled={isProcessing}
                    placeholder={isProcessing ? 'BUD executando...' : 'Digite sua instrução...'}
                    className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl py-3 pl-3 pr-12 text-xs placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition min-h-[44px]"
                  />
                  <button
                    onClick={() => handleSendChat()}
                    disabled={isProcessing || !chatInput.trim()}
                    className="absolute right-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white p-2 rounded-lg transition min-h-[36px] min-w-[36px] flex items-center justify-center"
                    aria-label="Enviar comando para BUD"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CODE (Mobile Fullscreen Editor) */}
          {mobileTab === 'code' && (
            <div className="flex-1 flex flex-col h-full bg-slate-950">
              <div className="h-10 px-3 border-b border-slate-850 bg-slate-900/80 flex items-center justify-between text-xs">
                <span className="font-mono text-blue-400 font-bold truncate max-w-[200px]">
                  {selectedFile}
                </span>
                <button
                  onClick={copyCode}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1 min-h-[36px]"
                >
                  {copiedFile ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedFile ? 'Copiado!' : 'Copiar'}</span>
                </button>
              </div>

              <div className="flex-1 overflow-auto p-3 bg-black">
                <pre className="text-slate-300 font-mono text-[11px] leading-relaxed whitespace-pre">
                  {currentFileContent}
                </pre>
              </div>
            </div>
          )}

          {/* TAB 4: FILES (Mobile Clean Project Tree) */}
          {mobileTab === 'files' && (
            <div className="flex-1 flex flex-col h-full bg-slate-950">
              <ProjectFilesList
                files={project?.files || {}}
                selectedFile={selectedFile}
                onSelectFile={(f) => {
                  setSelectedFile(f);
                  setMobileTab('code');
                }}
                isMobile={true}
              />
              <ProjectAssetLibrary projectId={project?.id} initialAssets={project?.assets || []} />
            </div>
          )}

          {/* TAB 5: MORE (Mobile Secondary Drawer for Terminal, QA & Info) */}
          {mobileTab === 'more' && (
            <div className="flex-1 flex flex-col h-full bg-slate-950 p-4 space-y-4 overflow-y-auto">
              {/* Quick Actions Grid for Mobile */}
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Ações do Sistema
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handleManualBuild}
                    disabled={!!actionLock}
                    className="bg-slate-900 border border-slate-800 hover:bg-slate-850 p-2.5 rounded-xl text-left font-bold text-xs flex items-center gap-2 text-slate-200 active:scale-95 transition"
                  >
                    <span>🔨</span>
                    <span>Compilar Build</span>
                  </button>
                  <button
                    onClick={handleManualTest}
                    disabled={!!actionLock}
                    className="bg-slate-900 border border-slate-800 hover:bg-slate-850 p-2.5 rounded-xl text-left font-bold text-xs flex items-center gap-2 text-slate-200 active:scale-95 transition"
                  >
                    <span>🧪</span>
                    <span>Rodar Testes</span>
                  </button>
                  <button
                    onClick={handleManualQA}
                    disabled={!!actionLock}
                    className="bg-slate-900 border border-slate-800 hover:bg-slate-850 p-2.5 rounded-xl text-left font-bold text-xs flex items-center gap-2 text-slate-200 active:scale-95 transition"
                  >
                    <span>🔍</span>
                    <span>Auditoria QA</span>
                  </button>
                  <button
                    onClick={handleAutoRepair}
                    disabled={!!actionLock}
                    className="bg-slate-900 border border-slate-800 hover:bg-slate-850 p-2.5 rounded-xl text-left font-bold text-xs flex items-center gap-2 text-slate-200 active:scale-95 transition"
                  >
                    <span>🔧</span>
                    <span>Corrigir (BUD)</span>
                  </button>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-blue-400" /> Logs de Execução ({logsList.length})
                </h3>
                <div className="bg-black border border-slate-800 rounded-xl p-3 h-48 overflow-y-auto font-mono text-[10px] space-y-1">
                  {logsList.map((l) => (
                    <div key={l.id} className="text-slate-300 leading-normal">
                      <span className="text-slate-600 mr-1.5">{l.timestamp ? new Date(l.timestamp).toLocaleTimeString() : ''}</span>
                      <span className="text-blue-400 font-bold uppercase mr-1.5">[{l.agent || l.step}]</span>
                      <span>{l.message}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Matriz de QA ({job?.readiness?.score || 100}/100)
                </h3>
                <div className="space-y-1.5">
                  {qaReportsList.map((qa, i) => (
                    <div key={i} className="bg-slate-900 border border-slate-800 p-2.5 rounded-xl text-xs flex justify-between items-center">
                      <div>
                        <div className="text-white font-bold">{qa.metric}</div>
                        <div className="text-[10px] text-slate-400">{qa.details}</div>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        qa.status === 'PASS' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                      }`}>
                        {qa.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                  <Brain className="w-4 h-4 text-purple-400" /> Contrato Semântico
                </h3>
                <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl text-xs space-y-1 text-slate-300 font-mono">
                  <div>Domínio: <span className="text-blue-400 font-bold">{project?.intent?.domain}</span></div>
                  <div>Tipo: {project?.intent?.projectType}</div>
                  <div>Negócio: {project?.intent?.businessName}</div>
                </div>
              </div>
            </div>
          )}

          {/* Bottom Fixed Navigation Bar */}
          <MobileWorkspaceNavigation
            activeTab={mobileTab}
            onSelectTab={(tab) => setMobileTab(tab)}
            unreadBudCount={0}
            hasErrors={job?.status === 'FAILED'}
          />
        </div>
      ) : isTablet ? (
        /* ===================== TABLET VIEW (768PX - 1023PX) ===================== */
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Main Top Area: Preview with Controls */}
          <div className="flex-1 flex min-w-0 bg-[#0A0D14]">
            {project ? (
              <PreviewStage
                project={project}
                onAutoRepair={handleAutoRepair}
                onOpenLogs={() => setActiveBottomTab('terminal')}
              />
            ) : (
              <div className="flex-1 flex items-center justify-center text-slate-500 font-mono text-xs">
                Carregando Projeto...
              </div>
            )}
          </div>

          {/* Bottom Split: BUD + Quick Tabs (Height: 280px) */}
          <div className="h-72 border-t border-slate-800 bg-slate-950 flex flex-shrink-0">
            {/* Left half: Project Files / QA */}
            <div className="w-1/2 border-r border-slate-800 flex flex-col">
              <div className="flex border-b border-slate-800 text-xs bg-slate-900/60">
                <button
                  onClick={() => setActiveLeftTab('files')}
                  className={`flex-1 py-2 font-bold ${activeLeftTab === 'files' ? 'text-blue-400 border-b-2 border-blue-500' : 'text-slate-400'}`}
                >
                  Arquivos
                </button>
                <button
                  onClick={() => setActiveLeftTab('brain')}
                  className={`flex-1 py-2 font-bold ${activeLeftTab === 'brain' ? 'text-blue-400 border-b-2 border-blue-500' : 'text-slate-400'}`}
                >
                  Brain & QA
                </button>
              </div>
              <div className="flex-1 overflow-auto">
                {activeLeftTab === 'files' ? (
                  <ProjectFilesList
                    files={project?.files || {}}
                    selectedFile={selectedFile}
                    onSelectFile={setSelectedFile}
                  />
                ) : (
                  <div className="p-3 space-y-2 text-xs">
                    {qaReportsList.map((qa, i) => (
                      <div key={i} className="bg-slate-900 p-2 rounded-lg border border-slate-800 flex justify-between">
                        <span className="text-white font-medium">{qa.metric}</span>
                        <span className="text-emerald-400 font-bold text-[10px]">{qa.status}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right half: BUD Chat */}
            <div className="w-1/2 flex flex-col">
              <div className="h-8 border-b border-slate-800 px-3 flex items-center text-xs font-bold text-slate-300 bg-slate-900/60">
                <Cpu className="w-3.5 h-3.5 text-blue-400 mr-1.5" /> BUD Copilot
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-2 text-xs">
                {projectHistory.map((h) => (
                  <div key={h.id} className="text-slate-300 bg-slate-900 p-2 rounded-lg">
                    <div className="text-blue-400 font-bold">{h.prompt}</div>
                    <div className="text-[10px] text-emerald-400">{h.changesSummary}</div>
                  </div>
                ))}
              </div>
              <div className="p-2 border-t border-slate-800 flex">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                  placeholder="Instrução..."
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
                />
                <button
                  onClick={() => handleSendChat()}
                  className="ml-1.5 bg-blue-600 px-3 rounded-lg text-white text-xs font-bold"
                >
                  <Send className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ===================== DESKTOP VIEW (SCREEN >= 1024PX) ===================== */
        <div className="flex-1 flex overflow-hidden">
          {/* Left Column: Explorer / Brain / Integrations (Resizable) */}
          <div
            style={{ width: `${leftSidebarWidth}px` }}
            className="border-r border-slate-850 bg-slate-950 flex flex-col flex-shrink-0 relative"
          >
            {/* Tab selector */}
            <div className="flex border-b border-slate-850 text-xs">
              <button
                onClick={() => setActiveLeftTab('files')}
                className={`flex-1 py-2.5 font-bold flex items-center justify-center gap-1.5 border-b-2 transition ${
                  activeLeftTab === 'files'
                    ? 'border-blue-500 text-blue-400 bg-slate-900/40'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                <FolderTree className="w-3.5 h-3.5" />
                <span>Arquivos</span>
              </button>
              <button
                onClick={() => setActiveLeftTab('brain')}
                className={`flex-1 py-2.5 font-bold flex items-center justify-center gap-1.5 border-b-2 transition ${
                  activeLeftTab === 'brain'
                    ? 'border-blue-500 text-blue-400 bg-slate-900/40'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                <Brain className="w-3.5 h-3.5" />
                <span>Brain</span>
              </button>
              <button
                onClick={() => setActiveLeftTab('integrations')}
                className={`flex-1 py-2.5 font-bold flex items-center justify-center gap-1.5 border-b-2 transition ${
                  activeLeftTab === 'integrations'
                    ? 'border-blue-500 text-blue-400 bg-slate-900/40'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                <GitBranch className="w-3.5 h-3.5" />
                <span>Deploy</span>
              </button>
            </div>

            {/* Left Tab Content */}
            <div className="flex-1 overflow-y-auto">
              {activeLeftTab === 'files' && (
                <>
                  <ProjectFilesList
                    files={project?.files || {}}
                    selectedFile={selectedFile}
                    onSelectFile={setSelectedFile}
                  />
                  <ProjectAssetLibrary projectId={project?.id} initialAssets={project?.assets || []} />
                </>
              )}

              {activeLeftTab === 'brain' && (
                <div className="p-3 space-y-4 text-xs">
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">
                      Contrato de Intenção
                    </div>
                    <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 space-y-1.5 font-mono text-[11px]">
                      <div><span className="text-slate-500">Domínio:</span> <span className="text-blue-400 font-bold">{project?.intent?.domain}</span></div>
                      <div><span className="text-slate-500">Tipo:</span> {project?.intent?.projectType}</div>
                      <div><span className="text-slate-500">Negócio:</span> {project?.intent?.businessName}</div>
                    </div>
                  </div>

                  <div>
                    <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">
                      SemanticGuard
                    </div>
                    <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 text-[11px] space-y-1">
                      <div className="text-emerald-400 font-semibold">Ativos Permitidos:</div>
                      <div className="text-slate-400">{project?.intent?.requiredAssets?.join(', ')}</div>
                      <div className="text-red-400 font-semibold pt-1">Ativos Proibidos:</div>
                      <div className="text-slate-400">{project?.intent?.forbiddenAssets?.join(', ')}</div>
                    </div>
                  </div>
                </div>
              )}

              {activeLeftTab === 'integrations' && (
                <div className="p-3 space-y-3 text-xs">
                  <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-white flex items-center gap-1.5">
                        <GitBranch className="w-3.5 h-3.5 text-blue-400" /> GitHub
                      </span>
                      <span className="text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded font-mono">
                        KIT PRONTO
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mb-3">
                      Exporte o projeto completo e abra a criação do repositório. O kit inclui README e configurações de deploy.
                    </p>
                    <button
                      onClick={handleOpenPublishKit}
                      className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                    >
                      <GitBranch className="w-3.5 h-3.5 text-blue-400" />
                      <span>Preparar compartilhamento</span>
                    </button>
                  </div>

                  <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-white flex items-center gap-1.5">
                        <CloudUpload className="w-3.5 h-3.5 text-emerald-400" /> Publicação Web
                      </span>
                      <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-mono">
                        VERCEL / NETLIFY
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mb-3">
                      Publicação direta quando o token do provedor estiver configurado; caso contrário, use os links do kit.
                    </p>
                    <button
                      onClick={() => handleManualDeploy('vercel')}
                      disabled={actionLock === 'DEPLOYING'}
                      className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/30 transition"
                    >
                      <CloudUpload className="w-3.5 h-3.5" />
                      <span>{actionLock === 'DEPLOYING' ? 'Publicando...' : 'Publicar na Vercel'}</span>
                    </button>
                    <button
                      onClick={() => handleManualDeploy('netlify')}
                      disabled={actionLock === 'DEPLOYING'}
                      className="w-full mt-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white py-2 rounded-xl text-xs font-bold transition"
                    >
                      Publicar no Netlify
                    </button>
                    {publishKit && (
                      <div className="mt-3 border-t border-slate-800 pt-3 space-y-1.5">
                        <div className="text-[10px] text-slate-500 uppercase font-bold">Compartilhar / importar</div>
                        <a href={publishKit.links.githubNewRepository} target="_blank" rel="noreferrer" className="block text-blue-400 hover:text-blue-300 underline">Abrir novo repositório GitHub</a>
                        <a href={publishKit.links.vercelImport} target="_blank" rel="noreferrer" className="block text-blue-400 hover:text-blue-300 underline">Importar na Vercel</a>
                        <a href={publishKit.links.netlifyDrop} target="_blank" rel="noreferrer" className="block text-blue-400 hover:text-blue-300 underline">Abrir Netlify Drop</a>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Left Resize Handle */}
            <div
              onMouseDown={() => setIsDraggingLeft(true)}
              className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-blue-500/50 transition z-10"
              title="Arrastar para redimensionar barra lateral"
            />
          </div>

          {/* Center Column: Live Preview & Bottom Drawer */}
          <div className="flex-1 flex flex-col min-w-[400px] bg-[#0A0D14]">
            {project ? (
              <PreviewStage
                project={project}
                onAutoRepair={handleAutoRepair}
                onOpenLogs={() => setActiveBottomTab('terminal')}
              />
            ) : (
              <div className="flex-1 flex items-center justify-center text-slate-500 font-mono text-xs">
                Carregando Projeto e montando Sandbox...
              </div>
            )}

            {/* Desktop Bottom Drawer (Terminal Logs / QA Engine / Code Viewer) */}
            <div className="h-44 border-t border-slate-850 bg-slate-950 flex flex-col flex-shrink-0">
              <div className="flex items-center justify-between border-b border-slate-850 px-4 text-xs bg-slate-900/60">
                <div className="flex space-x-2">
                  <button
                    onClick={() => setActiveBottomTab('terminal')}
                    className={`py-2 px-3 font-mono font-bold flex items-center gap-1.5 transition ${
                      activeBottomTab === 'terminal' ? 'text-blue-400 border-b-2 border-blue-500' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Terminal className="w-3.5 h-3.5" />
                    <span>Terminal / Logs ({logsList.length})</span>
                  </button>
                  <button
                    onClick={() => setActiveBottomTab('qa')}
                    className={`py-2 px-3 font-mono font-bold flex items-center gap-1.5 transition ${
                      activeBottomTab === 'qa' ? 'text-blue-400 border-b-2 border-blue-500' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>QA Engine ({job?.readiness?.score || 100}/100)</span>
                  </button>
                  <button
                    onClick={() => setActiveBottomTab('readiness')}
                    className={`py-2 px-3 font-mono font-bold flex items-center gap-1.5 transition ${
                      activeBottomTab === 'readiness' ? 'text-blue-400 border-b-2 border-blue-500' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Código ({selectedFile})</span>
                  </button>
                </div>

                {job?.currentStep && (
                  <div className="text-[11px] text-slate-400 font-mono hidden md:flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping"></span>
                    <span className="truncate max-w-sm">{job.currentStep}</span>
                  </div>
                )}
              </div>

              <div className="flex-1 overflow-y-auto p-3 font-mono text-xs">
                {activeBottomTab === 'terminal' && (
                  <div className="space-y-1">
                    {logsList.map((l) => (
                      <div key={l.id} className="flex items-start space-x-2 leading-relaxed">
                        <span className="text-slate-600 text-[10px] select-none">
                          {l.timestamp ? new Date(l.timestamp).toLocaleTimeString() : ''}
                        </span>
                        <span className={`text-[10px] uppercase font-bold px-1.5 rounded ${
                          l.level === 'error' ? 'bg-red-500/20 text-red-400' :
                          l.level === 'warn' ? 'bg-amber-500/20 text-amber-400' :
                          l.level === 'success' ? 'bg-emerald-500/20 text-emerald-400' :
                          l.level === 'agent' ? 'bg-purple-500/20 text-purple-400' :
                          'bg-blue-500/20 text-blue-400'
                        }`}>
                          {l.agent || l.step || l.level}
                        </span>
                        <span className="text-slate-300">{l.message}</span>
                      </div>
                    ))}
                    <div ref={terminalEndRef}></div>
                  </div>
                )}

                {activeBottomTab === 'qa' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {qaReportsList.map((qa, i) => (
                      <div key={i} className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 text-[11px]">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-white">{qa.metric}</span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            qa.status === 'PASS' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                          }`}>
                            {qa.status}
                          </span>
                        </div>
                        <p className="text-slate-400 text-[10px]">{qa.details}</p>
                      </div>
                    ))}
                  </div>
                )}

                {activeBottomTab === 'readiness' && (
                  <div className="relative">
                    <div className="flex justify-between items-center pb-2 mb-2 border-b border-slate-850">
                      <span className="text-xs text-blue-400 font-bold">{selectedFile}</span>
                      <button
                        onClick={copyCode}
                        className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded text-[10px] flex items-center gap-1"
                      >
                        {copiedFile ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedFile ? 'Copiado!' : 'Copiar'}</span>
                      </button>
                    </div>
                    <pre className="text-slate-300 text-[11px] overflow-x-auto whitespace-pre">
                      {currentFileContent}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: BUD Copilot Chat (Resizable) */}
          <div
            style={{ width: `${budSidebarWidth}px` }}
            className="border-l border-slate-850 bg-slate-950 flex flex-col flex-shrink-0 relative"
          >
            {/* Right Resize Handle */}
            <div
              onMouseDown={() => setIsDraggingRight(true)}
              className="absolute left-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-blue-500/50 transition z-10"
              title="Arrastar para redimensionar chat do BUD"
            />

            <div className="h-10 border-b border-slate-850 px-4 flex items-center justify-between text-xs font-bold text-slate-300">
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                <span>BUD Copilot</span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">Agent Runtime</span>
            </div>

            {/* Chat Messages Stream */}
            <div className="flex-1 overflow-y-auto p-3.5 space-y-3.5 text-xs">
              <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl text-slate-300 space-y-2">
                <div className="font-bold text-blue-400 flex items-center gap-1.5">
                  <Cpu className="w-4 h-4" /> BUD Agent
                </div>
                <p className="leading-relaxed">
                  Olá! Analisei sua instrução e construí a aplicação. Você pode me pedir alterações em linguagem natural a qualquer momento:
                </p>
                <div className="space-y-1 text-[11px] text-slate-400 pt-1">
                  <div>• "Troque a cor de destaque para dourado"</div>
                  <div>• "Adicione um cupom de 15% de desconto"</div>
                  <div>• "Coloque mais 2 opções no cardápio"</div>
                  <div>• "Transforme em uma academia"</div>
                </div>
              </div>

              {projectHistory.map((hist) => (
                <div key={hist.id} className="space-y-2">
                  <div className="bg-blue-600/20 border border-blue-500/30 text-blue-200 p-3 rounded-2xl ml-auto max-w-[90%] font-medium">
                    {hist.prompt}
                  </div>
                  <div className="bg-slate-900 border border-slate-800 p-3 rounded-2xl text-slate-300 text-xs">
                    <div className="text-emerald-400 font-bold mb-1 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> {hist.changesSummary}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Arquivos recompilados e validados pelo QA Engine.
                    </div>
                  </div>
                </div>
              ))}
              <div ref={chatMessagesEndRef} />
            </div>

            {/* Chat Input */}
            <div className="p-3 border-t border-slate-850 bg-slate-950">
              <div className="relative">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                  disabled={isProcessing}
                  placeholder={isProcessing ? 'BUD está executando...' : 'O que você quer alterar?'}
                  className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl py-2.5 pl-3 pr-10 text-xs placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition"
                />
                <button
                  onClick={() => handleSendChat()}
                  disabled={isProcessing || !chatInput.trim()}
                  className="absolute right-1.5 top-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white p-1.5 rounded-lg transition"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
