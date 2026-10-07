import { useState } from 'react';

export type LogLine = { time: string; text: string; kind?: 'ok' | 'warn' | 'err' };

export default function BottomPanel({
  logs,
  qaOutput,
  buildOutput,
  onCommand,
}: {
  logs: LogLine[];
  qaOutput: string;
  buildOutput: string;
  onCommand: (cmd: string) => void;
}) {
  const [tab, setTab] = useState<'logs' | 'terminal' | 'qa' | 'build'>('logs');
  const [term, setTerm] = useState<string[]>([]);
  const [cmd, setCmd] = useState('');

  function run(c: string) {
    if (!c.trim()) return;
    setTerm((t) => [...t, `$ ${c}`]);
    onCommand(c);
    setCmd('');
  }

  const tabs: Array<typeof tab> = ['logs', 'terminal', 'qa', 'build'];

  return (
    <div className="bottom">
      <div className="bottom-nav">
        {tabs.map((t) => (
          <button
            key={t}
            className={'bottom-tab ' + (tab === t ? 'active' : '')}
            onClick={() => setTab(t)}
          >
            {t[0].toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>
      <div className="bottom-content">
        {tab === 'logs' && (
          <div className="bottom-panel active">
            {logs.map((l, i) => (
              <div key={i}>
                <span className="muted">{l.time}</span>{' '}
                <span className={l.kind === 'ok' ? 'log-ok' : l.kind === 'warn' ? 'log-warn' : l.kind === 'err' ? 'log-err' : ''}>
                  {l.text}
                </span>
              </div>
            ))}
          </div>
        )}
        {tab === 'terminal' && (
          <div className="bottom-panel active">
            <div className="muted">Comandos: help · qa · build · export · save · clear</div>
            {term.map((l, i) => <div key={i}>{l}</div>)}
            <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
              <input
                value={cmd}
                onChange={(e) => setCmd(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && run(cmd)}
                placeholder="digite um comando..."
                style={{ flex: 1 }}
              />
              <button className="mini" onClick={() => run(cmd)}>Run</button>
            </div>
          </div>
        )}
        {tab === 'qa' && <div className="bottom-panel active" dangerouslySetInnerHTML={{ __html: qaOutput }} />}
        {tab === 'build' && <div className="bottom-panel active" dangerouslySetInnerHTML={{ __html: buildOutput }} />}
      </div>
    </div>
  );
}

