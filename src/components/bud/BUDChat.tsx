import { useState } from 'react';
import { db } from '../../lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

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
    if (!input.trim() || isSending) return;
    setIsSending(true);
    setMessages(prev => [...prev, { role: 'user', content: input }]);

    try {
      // Call API
      const res = await fetch('/api/bud/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: 'demo', message: input })
      });
      if (!res.ok) throw new Error('Falha ao enviar mensagem ao BUD');

      const { jobId } = await res.json();

      // Track Status
      const unsubscribe = onSnapshot(doc(db, 'generation_jobs', jobId), (doc) => {
        const status = doc.data()?.status;
        setJobStatus(status);
        if (status === 'READY') {
          unsubscribe();
          setJobStatus(null);
          setMessages(prev => [...prev, { role: 'assistant', content: 'Projeto pronto!' }]);
        }
      });
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Erro ao conectar com BUD. Tente novamente.' }]);
    } finally {
      setIsSending(false);
      setInput('');
    }
  };

  return (
    <div className="flex flex-col h-full border-l border-gray-800 bg-gray-950">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m, i) => (
          <div key={i} className={`p-3 rounded-lg ${m.role === 'user' ? 'bg-blue-900 ml-auto' : 'bg-gray-800'}`}>
            {m.content}
          </div>
        ))}
        {jobStatus && <div className="text-sm text-blue-400">BUD • {jobStatus}...</div>}
      </div>
      <div className="p-4 border-t border-gray-800">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          className="w-full p-2 rounded bg-gray-900 text-white"
          placeholder="Diga ao BUD o que criar..."
          disabled={isSending}
        />
        <button
          onClick={sendMessage}
          disabled={isSending}
          className="mt-2 w-full bg-blue-600 p-2 rounded disabled:opacity-50"
        >
          {isSending ? 'Enviando...' : 'Enviar'}
        </button>
      </div>
    </div>
  );
}
