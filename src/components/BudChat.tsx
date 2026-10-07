import { useState } from 'react';
import { applyAction, parseIntent } from '../lib/bud';

type Message = { role: 'user' | 'bud'; text: string };

export default function BudChat({
  html,
  setHtml,
  onRunQa,
  onRunBuild,
  onLog,
}: {
  html: string;
  setHtml: (h: string) => void;
  onRunQa: () => void;
  onRunBuild: () => void;
  onLog: (msg: string, kind?: 'ok' | 'warn' | 'err') => void;
}) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'bud',
      text: 'Pronto. Peça alterações reais: <i>troque o título do hero para "..."</i>, <i>mude a cor da CTA para verde</i>, <i>rode qa</i>, <i>rode build</i>.',
    },
  ]);

  function send() {
    const text = input.trim();
    if (!text) return;
    setMessages((m) => [...m, { role: 'user', text }]);
    const action = parseIntent(text);

    if (action.kind === 'run-qa') {
      onRunQa();
      setMessages((m) => [...m, { role: 'bud', text: 'QA executado. Veja o painel inferior.' }]);
    } else if (action.kind === 'run-build') {
      onRunBuild();
      setMessages((m) => [...m, { role: 'bud', text: 'Build executado. Veja o painel inferior.' }]);
    } else {
      const r = applyAction(html, action);
      if (r.changed) {
        setHtml(r.html);
        onLog(`patch aplicado: ${action.kind}`, 'ok');
      }
      setMessages((m) => [...m, { role: 'bud', text: r.message }]);
    }
    setInput('');
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
            placeholder="Peça uma alteração ao BUD..."
          />
          <div className="compose-footer">
            <span className="hint">Enter envia · Shift+Enter nova linha</span>
            <button className="send" onClick={send}>➤</button>
          </div>
        </div>
      </div>
    </aside>
  );
}

