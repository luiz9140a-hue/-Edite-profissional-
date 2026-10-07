export default function Topbar({
  onQa,
  onBuild,
  onExport,
  onSave,
}: {
  onQa: () => void;
  onBuild: () => void;
  onExport: () => void;
  onSave: () => void;
}) {
  return (
    <header className="topbar">
      <div className="brand">
        <div className="brand-mark">EP</div>
        <span>Edite Profissional</span>
      </div>
      <div className="actions">
        <button className="btn ghost" onClick={onQa}>✓ QA</button>
        <button className="btn ghost" onClick={onBuild}>⚙ Build</button>
        <button className="btn" onClick={onExport}>↧ Exportar .zip</button>
        <button className="btn primary" onClick={onSave}>Salvar</button>
      </div>
    </header>
  );
}

