export default function FileTree({
  files,
  active,
  onSelect,
}: {
  files: Record<string, string>;
  active: string;
  onSelect: (f: string) => void;
}) {
  const list = Object.keys(files).sort();
  return (
    <aside className="left">
      <div className="section-title">projeto</div>
      {list.map((f) => (
        <div
          key={f}
          className={'tree-item ' + (active === f ? 'active' : '')}
          onClick={() => onSelect(f)}
        >
          <div className="tree-left">
            <span className="tree-icon">◇</span>
            <span>{f}</span>
          </div>
        </div>
      ))}
    </aside>
  );
}

