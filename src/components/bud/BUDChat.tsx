import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

type Message = { role: 'user' | 'assistant'; content: string };
type BudChatProps = { projectId?: string };

const stageLabels: Record<string, string> = {
  QUEUED: 'BUD enfileirando', ANALYZING: 'BUD analisando', PLANNING: 'BUD planejando',
  RESEARCHING: 'BUD pesquisando', EXECUTING: 'BUD construindo', BUILDING: 'BUD compilando',
  TESTING: 'BUD testando', QA: 'BUD validando', REPAIRING: 'BUD corrigindo', READY: 'Projeto pronto'
};

export default function BUDChat({ projectId: explicitProjectId }: BudChatProps) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Olá! Sou o BUD Supervisor. Descreva o que você quer criar ou alterar.' }
  ]);
  const [input, setInput] = useState('');
  const [jobStatus, setJobStatus] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  const pollJob = async (jobId: string) => {
    for (let attempt = 0; attempt < 240; attempt += 1) {
      const response = await fetch(`/api/generation/jobs/${encodeURIComponent(jobId)}`);
      if (!response.ok) throw new Error('Não foi possível acompanhar o job.');
      const job = await response.json() as { status: string; error?: string; projectId?: string };
      setJobStatus(job.status);
      if (job.status === 'READY') {
        setMessages(prev => [...prev, { role: 'assistant', content: 'Projeto pronto e validado. O preview já pode ser aberto.' }]);
        return job;
      }
      if (job.status === 'FAILED' || job.status === 'CANCELLED') {
        throw new Error(job.error || 'O job terminou sem aprovação.');
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    throw new Error('Tempo limite de acompanhamento excedido.');
  };

  const sendMessage = async () => {
    const message = input.trim();
    if (!message || isSending) return;
    setIsSending(true);
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: message }]);
    try {
      const projectId = explicitProjectId || searchParams.get('project');
      const endpoint = projectId ? '/api/bud/run' : '/api/generation/jobs';
      const body = projectId ? { projectId, message } : { prompt: message };
      const response = await fetch(endpoint, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Falha ao iniciar o BUD.');
      setJobStatus(data.status || 'QUEUED');
      if (!projectId && data.projectId && data.jobId) {
        navigate(`/workspace?project=${data.projectId}&job=${data.jobId}`, { replace: true });
      }
      await pollJob(data.jobId);
    } catch (error: any) {
      setMessages(prev => [...prev, { role: 'assistant', content: error?.message || 'Não foi possível executar o BUD.' }]);
    } finally {
      setIsSending(false);
      setJobStatus(null);
    }
  };

  return (
    <div className="flex flex-col h-full border-l border-gray-800 bg-gray-950">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => <div key={index} className={`p-3 rounded-lg ${message.role === 'user' ? 'bg-blue-900 ml-auto' : 'bg-gray-800'}`}>{message.content}</div>)}
        {jobStatus && <div className="text-sm text-blue-400">{stageLabels[jobStatus] || `BUD • ${jobStatus}`}...</div>}
      </div>
      <div className="p-4 border-t border-gray-800">
        <input value={input} onChange={event => setInput(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') void sendMessage(); }} className="w-full p-2 rounded bg-gray-900 text-white" placeholder="Diga ao BUD o que criar..." disabled={isSending} />
        <button onClick={() => void sendMessage()} disabled={isSending} className="mt-2 w-full bg-blue-600 p-2 rounded disabled:opacity-50">{isSending ? 'Executando...' : 'Enviar'}</button>
      </div>
    </div>
  );
}
