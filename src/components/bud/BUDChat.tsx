import { useEffect, useRef, useState } from 'react';

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

type Props = {
  projectId: string;
  onProjectReady?: () => void;
};

const STATUS_LABELS: Record<string, string> = {
  QUEUED: 'na fila',
  ANALYZING: 'analisando requisitos',
  PLANNING: 'planejando arquitetura',
  RESEARCHING: 'pesquisando ativos',
  EXECUTING: 'criando arquivos',
  BUILDING: 'compilando o projeto',
  TESTING: 'testando funcionalidades',
  QA: 'fazendo controle de qualidade',
  REPAIRING: 'corrigindo detalhes',
  READY: 'projeto pronto',
  FAILED: 'execução falhou'
};

export default function BUDChat({ projectId, onProjectReady }: Props) {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Sou o BUD Autonomous Engine. Defina um objetivo e eu coordenarei análise, código, testes, QA e Preview.' }
  ]);
  const [input, setInput] = useState('');
  const [jobStatus, setJobStatus] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (pollTimer.current) clearTimeout(pollTimer.current);
  }, []);

  const pollJob = async (jobId: string) => {
    try {
      const response = await fetch(`/api/generation/jobs/${jobId}`);
      if (!response.ok) throw new Error(`Não foi possível consultar o job (HTTP ${response.status})`);
      const job = await response.json() as { status: string; currentStep?: string };
      setJobStatus(job.status);

      if (job.status === 'READY') {
        setIsSending(false);
        setMessages(prev => [...prev, { role: 'assistant', content: 'Projeto pronto. O Preview foi atualizado com as alterações.' }]);
        onProjectReady?.();
        return;
      }
      if (job.status === 'FAILED' || job.status === 'CANCELLED') {
        setIsSending(false);
        setError(job.currentStep || 'O BUD não conseguiu concluir esta execução.');
        return;
      }

      pollTimer.current = setTimeout(() => void pollJob(jobId), 1200);
    } catch (err: any) {
      setIsSending(false);
      setError(err?.message || 'Falha ao consultar o progresso do BUD.');
    }
  };

  const sendMessage = async () => {
    const message = input.trim();
    if (!message || isSending || !projectId) return;

    setIsSending(true);
    setError(null);
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: message }]);

    try {
      const response = await fetch('/api/bud/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, message })
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || `Falha ao enviar comando (HTTP ${response.status})`);

      setJobStatus(payload.status || 'QUEUED');
      await pollJob(payload.jobId);
    } catch (err: any) {
      setIsSending(false);
      setError(err?.message || 'Não foi possível conectar ao BUD.');
      setMessages(prev => [...prev, { role: 'assistant', content: 'Não consegui executar esse comando. Verifique a mensagem de erro e tente novamente.' }]);
    }
  };

  return (
    <div className="flex flex-col h-full border-l border-gray-800 bg-gray-950">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div key={`${message.role}-${index}`} className={`max-w-[90%] p-3 rounded-lg ${message.role === 'user' ? 'bg-blue-900 ml-auto text-white' : 'bg-gray-800 text-slate-200'}`}>
            {message.content}
          </div>
        ))}
        {jobStatus && (
          <div className="text-sm text-blue-400">
            BUD Autonomous Engine • {STATUS_LABELS[jobStatus] || jobStatus}...
          </div>
        )}
        {error && <div className="text-sm text-red-400">{error}</div>}
      </div>
      <div className="p-4 border-t border-gray-800">
        <input
          value={input}
          onChange={event => setInput(event.target.value)}
          onKeyDown={event => { if (event.key === 'Enter') void sendMessage(); }}
          className="w-full p-2 rounded bg-gray-900 text-white outline-none focus:ring-2 focus:ring-blue-600"
          placeholder={isSending ? 'BUD executando...' : 'Defina o objetivo do motor autônomo...'}
          disabled={isSending || !projectId}
        />
        <button
          onClick={() => void sendMessage()}
          disabled={isSending || !input.trim() || !projectId}
          className="mt-2 w-full bg-blue-600 hover:bg-blue-500 p-2 rounded text-white disabled:opacity-50"
        >
          {isSending ? 'BUD executando...' : 'Executar objetivo'}
        </button>
      </div>
    </div>
  );
}
