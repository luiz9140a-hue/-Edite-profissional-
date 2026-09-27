import React, { useState, useEffect, useRef } from 'react';
import {
  RotateCw,
  ExternalLink,
  Laptop,
  Tablet,
  Smartphone,
  AlertTriangle,
  Wrench,
  Activity,
  Terminal,
  RefreshCw,
  CheckCircle2
} from 'lucide-react';
import { Project } from '../../types/engrenagem';
import ResponsivePreviewController, {
  DeviceMode,
  PhonePreset,
  Orientation,
  PHONE_PRESETS
} from './ResponsivePreviewController';

interface Props {
  project: Project;
  onAutoRepair?: () => void;
  onOpenLogs?: () => void;
  isMobileHost?: boolean;
}

export default function PreviewStage({
  project,
  onAutoRepair,
  onOpenLogs,
  isMobileHost = false
}: Props) {
  const [deviceMode, setDeviceMode] = useState<DeviceMode>('desktop');
  const [phonePreset, setPhonePreset] = useState<PhonePreset>('390');
  const [orientation, setOrientation] = useState<Orientation>('portrait');
  const [previewHealth, setPreviewHealth] = useState<'ONLINE' | 'OFFLINE' | 'CRASHED' | 'CHECKING'>('CHECKING');
  const [previewKey, setPreviewKey] = useState<number>(Date.now());
  const [restartsCount, setRestartsCount] = useState<number>(0);
  const [runtimeError, setRuntimeError] = useState<{
    type: string;
    file?: string;
    line?: number;
    message: string;
  } | null>(null);
  const [isRestarting, setIsRestarting] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Health check on project mount or key change
  useEffect(() => {
    let isMounted = true;

    const runHealthCheck = async () => {
      try {
        const res = await fetch(`/api/projects/${project.id}/preview/health`);
        if (res.ok && isMounted) {
          const data = await res.json();
          setPreviewHealth(data.health === 'ONLINE' ? 'ONLINE' : 'OFFLINE');
        } else if (isMounted) {
          setPreviewHealth('OFFLINE');
        }
      } catch (err) {
        if (isMounted) setPreviewHealth('OFFLINE');
      }
    };

    runHealthCheck();
    const interval = setInterval(runHealthCheck, 6000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [project.id, previewKey]);

  // Listen to message events from iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (!event.data) return;

      if (event.data.type === 'PREVIEW_RUNTIME_ERROR') {
        console.warn('[PreviewStage] Erro capturado no iframe do projeto:', event.data);
        setRuntimeError({
          type: event.data.errorType || 'RUNTIME_ERROR',
          file: event.data.file || 'src/App.tsx',
          line: event.data.line,
          message: event.data.message || 'Exceção não tratada no código do projeto gerado.'
        });
        setPreviewHealth('CRASHED');
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleManualRestart = async () => {
    setIsRestarting(true);
    try {
      const res = await fetch(`/api/projects/${project.id}/preview/restart`, { method: 'POST' });
      const data = await res.json();
      setRestartsCount(data.restartsCount || restartsCount + 1);
      setRuntimeError(null);
      setPreviewKey(Date.now());
      setPreviewHealth('ONLINE');
    } catch (e) {
      console.error('Falha ao reiniciar preview:', e);
    } finally {
      setIsRestarting(false);
    }
  };

  const handleOpenNewTab = () => {
    window.open(`/preview/${project.id}`, '_blank', 'noopener,noreferrer');
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch((err) => console.error(err));
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch((err) => console.error(err));
      setIsFullscreen(false);
    }
  };

  // Compute dimensions based on device mode
  const currentPhoneDim = PHONE_PRESETS[phonePreset][orientation];

  return (
    <div
      ref={containerRef}
      className={`flex-1 flex flex-col min-w-0 bg-[#0A0D14] relative overflow-hidden ${
        isFullscreen ? 'p-0' : ''
      }`}
    >
      {/* Top Controller Bar (Hidden on Mobile Host to maximize screen) */}
      {!isMobileHost && (
        <ResponsivePreviewController
          deviceMode={deviceMode}
          setDeviceMode={setDeviceMode}
          phonePreset={phonePreset}
          setPhonePreset={setPhonePreset}
          orientation={orientation}
          setOrientation={setOrientation}
          onReload={handleManualRestart}
          onOpenNewTab={handleOpenNewTab}
          onToggleFullscreen={toggleFullscreen}
          isReloading={isRestarting}
        />
      )}

      {/* Main Preview Stage Area */}
      <div className="flex-1 flex items-center justify-center p-2 sm:p-4 overflow-auto relative">
        {/* Error / Crash State (Zero White Screen!) */}
        {runtimeError ? (
          <div className="w-full max-w-lg bg-slate-950 border border-red-500/30 rounded-2xl p-6 flex flex-col items-center justify-center text-center shadow-2xl">
            <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 mb-4">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <span className="text-[10px] uppercase tracking-wider font-mono font-bold bg-red-500/20 text-red-400 px-3 py-1 rounded-full mb-2 border border-red-500/30">
              Preview {previewHealth}
            </span>

            <h3 className="text-xl font-black text-white mb-2">
              Erro em tempo de execução no projeto
            </h3>

            <p className="text-slate-400 text-xs max-w-md mb-4 leading-relaxed">
              O BUD isolou o erro dentro do sandbox do preview. O Workspace principal continua 100% ativo e operacional.
            </p>

            <div className="w-full bg-slate-900 border border-slate-800 p-3.5 rounded-xl text-left font-mono text-xs text-red-400 mb-6 space-y-1">
              <div><span className="text-slate-500 font-bold">Tipo:</span> {runtimeError.type}</div>
              {runtimeError.file && <div><span className="text-slate-500 font-bold">Arquivo:</span> {runtimeError.file}</div>}
              <div><span className="text-slate-500 font-bold">Mensagem:</span> {runtimeError.message}</div>
            </div>

            <div className="flex flex-wrap gap-2.5 justify-center">
              {onAutoRepair && (
                <button
                  onClick={onAutoRepair}
                  className="bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold px-5 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-blue-600/30 transition min-h-[44px]"
                >
                  <Wrench className="w-4 h-4" />
                  <span>BUD Corrigir Automaticamente</span>
                </button>
              )}

              <button
                onClick={handleManualRestart}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 transition min-h-[44px]"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reiniciar Preview</span>
              </button>

              {onOpenLogs && (
                <button
                  onClick={onOpenLogs}
                  className="bg-slate-900 hover:bg-slate-850 text-slate-300 border border-slate-800 font-medium px-4 py-2 rounded-xl text-xs flex items-center gap-2 transition min-h-[44px]"
                >
                  <Terminal className="w-3.5 h-3.5" />
                  <span>Ver Logs</span>
                </button>
              )}
            </div>
          </div>
        ) : isMobileHost ? (
          /* Mobile Host: Direct Fullscreen Preview with no outer frame */
          <div className="w-full h-full bg-black rounded-xl overflow-hidden border border-slate-850 flex flex-col">
            <iframe
              key={previewKey}
              ref={iframeRef}
              src={`/api/projects/${project.id}/preview-html?t=${previewKey}`}
              title={`Preview ${project.name}`}
              className="flex-1 w-full h-full border-none bg-black"
              sandbox="allow-scripts allow-forms allow-popups allow-modals"
            />
          </div>
        ) : deviceMode === 'phone' ? (
          /* Phone Mode: Sleek Smartphone Bezel with exact viewport dimensions */
          <div
            style={{
              width: `${currentPhoneDim.width + 24}px`,
              height: `${currentPhoneDim.height + 48}px`,
              maxHeight: '92vh'
            }}
            className="transition-all duration-300 bg-slate-900 rounded-[44px] p-3 shadow-2xl border-4 border-slate-700/80 flex flex-col relative items-center justify-between flex-shrink-0"
          >
            {/* Speaker & Dynamic Island Notch */}
            <div className="w-24 h-4 bg-black rounded-full mb-1 flex items-center justify-center space-x-1.5 flex-shrink-0">
              <span className="w-2 h-2 rounded-full bg-slate-800"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-slate-900"></span>
            </div>

            {/* Inner Screen Sandbox */}
            <div
              style={{
                width: `${currentPhoneDim.width}px`,
                height: `${currentPhoneDim.height}px`
              }}
              className="rounded-[32px] overflow-hidden bg-black flex-1 relative w-full border border-slate-800"
            >
              <iframe
                key={previewKey}
                ref={iframeRef}
                src={`/api/projects/${project.id}/preview-html?t=${previewKey}`}
                title={`Preview Phone ${project.name}`}
                className="w-full h-full border-none bg-black"
                sandbox="allow-scripts allow-forms allow-popups allow-modals"
              />
            </div>

            {/* Simulated Home Indicator Bar */}
            <div className="w-32 h-1 bg-slate-600/70 rounded-full mt-2 flex-shrink-0"></div>
          </div>
        ) : deviceMode === 'tablet' ? (
          /* Tablet Mode: 768px Width Frame */
          <div className="w-[768px] h-full max-w-full transition-all duration-300 rounded-2xl overflow-hidden shadow-2xl border border-slate-800 bg-black flex flex-col">
            <div className="h-6 bg-slate-900 border-b border-slate-800 px-3 flex items-center justify-between text-[10px] text-slate-400 select-none flex-shrink-0">
              <div className="flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-red-500/80"></span>
                <span className="w-2 h-2 rounded-full bg-amber-500/80"></span>
                <span className="w-2 h-2 rounded-full bg-emerald-500/80"></span>
              </div>
              <span className="font-mono text-slate-400">Tablet (768 × 1024)</span>
              <div></div>
            </div>

            <iframe
              key={previewKey}
              ref={iframeRef}
              src={`/api/projects/${project.id}/preview-html?t=${previewKey}`}
              title={`Preview Tablet ${project.name}`}
              className="flex-1 w-full h-full border-none bg-black"
              sandbox="allow-scripts allow-forms allow-popups allow-modals"
            />
          </div>
        ) : (
          /* Desktop Mode: 100% Fluid Frame */
          <div className="w-full h-full transition-all duration-300 rounded-2xl overflow-hidden shadow-2xl border border-slate-800 bg-black flex flex-col">
            <div className="h-6 bg-slate-900 border-b border-slate-800 px-3 flex items-center justify-between text-[10px] text-slate-400 select-none flex-shrink-0">
              <div className="flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-red-500/80"></span>
                <span className="w-2 h-2 rounded-full bg-amber-500/80"></span>
                <span className="w-2 h-2 rounded-full bg-emerald-500/80"></span>
              </div>
              <span className="font-mono text-slate-400 truncate max-w-[280px]">
                https://sandbox.engrenagem.ai/preview/{project.id}
              </span>
              <div className="flex items-center space-x-1 font-mono text-[10px] text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <span>ONLINE</span>
              </div>
            </div>

            <iframe
              key={previewKey}
              ref={iframeRef}
              src={`/api/projects/${project.id}/preview-html?t=${previewKey}`}
              title={`Preview Desktop ${project.name}`}
              className="flex-1 w-full h-full border-none bg-black"
              sandbox="allow-scripts allow-forms allow-popups allow-modals"
            />
          </div>
        )}
      </div>
    </div>
  );
}
