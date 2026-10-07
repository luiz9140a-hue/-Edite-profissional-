import { useState } from 'react';
import { callBud, BudMessage } from '../lib/bud';

type Message = { role: 'user' | 'bud'; text: string };

export default function BudChat({
  html,
  setHtml,
  onLog,
}: {
  html: string;
  setHtml: (h: string) => void;
  onLog: (msg: string, kind?: 'ok' | 'warn' | 'err') => void;
}) {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'bud',
      text: 'Olá! Sou o BUD. Digite o que você quer criar. Exemplo: <i>"Quero um SaaS para barbearia com página de agendamento"</i> e eu gero o site completo.',
    },
  ]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;

    setMessages((m) => [...m, { role: 'user', text }]);
    setInput('');
    setLoading(true);
    onLog('bud.request · enviando para Gemini', 'ok');

    const history: BudMessage[] = messages.map((m) => ({
      role: m.role,
      content: m.text,
    }));
    history.push({ role: 'user', content: text });

    const { html: newHtml, error } = await callBud(history, html);

    setLoading(false);

    if (error) {
      setMessages((m) => [...m, { role: 'bud', text: `Erro: ${error}` }]);
      onLog(`bud.error · ${error}`, 'err');
      return;
    }

    if (newHtml) {
      setHtml(newHtml);
      setMessages((m) => [...m, { role: 'bud', text: 'Pronto! Site gerado. Veja o preview ao lado.' }]);
      onLog('bud.success · site gerado', 'ok');
    }
  }

  return (
    <aside className="right">
      <div className="bud-head">
        <div className="bud-title">
          <div className="bud-brand">
            <div className="bud-orb">B</div>
            <div>
              <strong>BUD</strong>
              <div className="bud-sub">Build, Understand and Deploy</div>
            </div>
          </div>
          <span className="state"><span className="dot" /> online</span>
        </div>
      </div>
      <div className="chat">
        {messages.map((m, i) => (
          <div key={i} className={'msg ' + m.role} dangerouslySetInnerHTML={{ __html: m.text }} />
        ))}
        {loading && <div className="msg bud"><i>Gerando com Gemini…</i></div>}
      </div>
      <div className="composer">
        <div className="composerbox">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder="Ex: Quero um SaaS para barbearia..."
            disabled={loading}
          />
          <div className="compose-footer">
            <span className="hint">Enter envia · Shift+Enter nova linha</span>
            <button className="send" onClick={send} disabled={loading}>
              {loading ? '…' : '➤'}
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
