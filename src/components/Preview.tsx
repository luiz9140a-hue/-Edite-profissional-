import { useEffect, useRef, useState } from 'react';

export default function Preview({
  html,
  mode,
  onModeChange,
}: {
  html: string;
  mode: 'static' | 'bundle';
  onModeChange: (m: 'static' | 'bundle') => void;
}) {
  const ref = useRef<HTMLIFrameElement>(null);
  const [device, setDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');

  useEffect(() => {
    const f = ref.current;
    if (!f) return;
    const doc = f.contentDocument;
    if (!doc) return;
    doc.open();
    doc.write(html);
    doc.close();
  }, [html]);

  const maxWidth = device === 'mobile' ? 340 : device === 'tablet' ? 430 : 520;

  return (
    <div className="preview">
      <div className="preview-toolbar">
        <div className="devices">
          {(['desktop', 'tablet', 'mobile'] as const).map((d) => (
            <button
              key={d}
              className={'device ' + (device === d ? 'active' : '')}
              onClick={() => setDevice(d)}
            >
              {d === 'desktop' ? 'Desktop' : d === 'tablet' ? 'Tablet' : 'Celular'}
            </button>
          ))}
        </div>
        <div className="devices">
          <button className={'device ' + (mode === 'static' ? 'active' : '')} onClick={() => onModeChange('static')}>HTML</button>
          <button className={'device ' + (mode === 'bundle' ? 'active' : '')} onClick={() => onModeChange('bundle')}>React</button>
        </div>
        <div className="preview-status"><span className="dot" /> LOCAL_READY</div>
      </div>
      <div className="preview-canvas">
        <iframe
          ref={ref}
          className="preview-frame"
          style={{ maxWidth }}
          sandbox="allow-scripts allow-forms allow-modals"
          title="preview"
        />
      </div>
    </div>
  );
}

