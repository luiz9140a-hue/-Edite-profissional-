import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary capturou uma exceção:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#07090E] text-slate-100 flex flex-col items-center justify-center p-6 text-center font-sans">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 mb-6">
            <AlertTriangle className="w-8 h-8" />
          </div>

          <h2 className="text-2xl font-black text-white mb-2">
            {this.props.fallbackTitle || 'Ocorreu um erro no Workspace'}
          </h2>

          <p className="text-slate-400 text-sm max-w-md mb-6 leading-relaxed">
            O BUD detectou uma instabilidade na interface e impediu o encerramento da aplicação. Os dados do projeto continuam salvos com segurança.
          </p>

          {this.state.error && (
            <div className="w-full max-w-lg bg-slate-900 border border-slate-800 p-4 rounded-xl text-left font-mono text-xs text-red-400 mb-6 overflow-x-auto">
              <div className="font-bold mb-1">Erro:</div>
              <div>{this.state.error.toString()}</div>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-2.5 rounded-xl text-xs flex items-center gap-2 transition"
            >
              <RotateCw className="w-4 h-4" />
              <span>Recarregar Página</span>
            </button>
            <button
              onClick={() => window.location.href = '/'}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold px-6 py-2.5 rounded-xl text-xs flex items-center gap-2 transition"
            >
              <Home className="w-4 h-4" />
              <span>Voltar ao Início</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
