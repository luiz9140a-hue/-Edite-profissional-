export default function Landing({ onStart }: { onStart: () => void }) {
  return (
    <section className="landing show">
      <div className="landing-grid">
        <div>
          <div className="kicker">BUD — Build, Understand and Deploy</div>
          <h1>Crie e edite sites com IA, sem perder o controle.</h1>
          <p>
            Edite múltiplos arquivos, veja o preview React real, rode QA, faça build no navegador e
            exporte um .zip pronto para publicar.
          </p>
          <div className="landing-actions">
            <button className="btn primary" onClick={onStart}>Abrir workspace →</button>
          </div>
        </div>
        <div className="hero-workspace">
          <div className="hw-top">
            <span className="hw-dot" /><span className="hw-dot" /><span className="hw-dot" />
          </div>
          <div className="hw-body">
            <div className="hw-side">
              <div className="hw-icon">⌁</div>
              <div className="hw-icon">□</div>
              <div className="hw-icon">△</div>
            </div>
            <div className="hw-main">
              <div className="hw-line" /><div className="hw-line w2" /><div className="hw-line w3" /><div className="hw-line" />
            </div>
            <div className="hw-right">
              <div className="hw-card"><b>Multi-arquivo</b></div>
              <div className="hw-card"><b>Preview React</b></div>
              <div className="hw-card"><b>Export .zip</b></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

