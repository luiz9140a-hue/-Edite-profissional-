import { useState } from 'react';

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

export default function BUDChat() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Olá! Sou o BUD. Descreva o que você quer criar e eu planejarei e construirei para você.' }
  ]);
  const [input, setInput] = useState('');
  const [jobStatus, setJobStatus] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  const sendMessage = async () => {
    const message = input.trim();
    if (!message || isSending) return;
    setIsSending(true);
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: message }]);

    try {
      const res = await fetch('/api/generation/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-account-id': 'local-chat', 'x-plan-id': 'free' },
        body: JSON.stringify({ prompt: message })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Falha ao enviar mensagem ao BUD');
      setJobStatus(data.status || 'QUEUED');
      setMessages(prev => [...prev, { role: 'assistant', content: `Projeto iniciado. Job: ${data.jobId}` }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'assistant', content: error instanceof Error ? error.message : 'Erro ao conectar com o BUD.' }]);
    } finally {
      setJobStatus(null);
      setIsSending(false);
    }
  };

  return (
    <div className="flex flex-col h-full border-l border-gray-800 bg-gray-950">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m, i) => <div key={i} className={`p-3 rounded-lg ${m.role === 'user' ? 'bg-blue-900 ml-auto' : 'bg-gray-800'}`}>{m.content}</div>)}
        {jobStatus && <div className="text-sm text-blue-400">BUD • {jobStatus}...</div>}
      </div>
      <div className="p-4 border-t border-gray-800">
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()} className="w-full p-2 rounded bg-gray-900 text-white" placeholder="Diga ao BUD o que criar..." disabled={isSending} />
        <button onClick={sendMessage} disabled={isSending} className="mt-2 w-full bg-blue-600 p-2 rounded disabled:opacity-50">{isSending ? 'Enviando...' : 'Enviar'}</button>
      </div>
    </div>
  );
}
