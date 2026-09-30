import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Eye, Layers3, Save, Send, Plus, Trash2 } from 'lucide-react';
import type { VisualDocument, VisualNode } from '../../types/visual';
import { budClient } from '../../lib/budClient';
import VisualRenderer from './VisualRenderer';

function walk(node: VisualNode, result: VisualNode[] = []) {
  result.push(node);
  node.children.forEach(child => walk(child, result));
  return result;
}

export default function BuilderPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const documentId = params.get('document') || 'starter-document';
  const [document, setDocument] = useState<VisualDocument | null>(null);
  const [selectedId, setSelectedId] = useState('hero');
  const [message, setMessage] = useState('');
  const nodes = useMemo(() => document ? walk(document.root) : [], [document]);
  const selected = nodes.find(node => node.id === selectedId);

  useEffect(() => {
    budClient.getVisualDocument(documentId)
      .then(data => {
        const doc = data as VisualDocument;
        setDocument({ ...doc, id: documentId });
      })
      .catch(() => setMessage('Não foi possível carregar o documento visual.'));
  }, [documentId]);

  const updateSelected = (patch: Partial<VisualNode>) => {
    if (!document || !selected) return;
    const next = structuredClone(document);
    const target = walk(next.root).find(node => node.id === selected.id);
    if (!target) return;
    Object.assign(target, patch);
    setDocument(next);
  };

  const save = async () => {
    if (!document) return;
    const saved = await budClient.saveVisualDocument(document.id, {
      name: document.name,
      route: document.route,
      root: document.root,
    });
    setDocument({ ...document, ...(saved as object), id: document.id } as VisualDocument);
    setMessage('Documento salvo.');
  };

  const publish = async () => {
    if (!document) return;
    try {
      await budClient.saveVisualDocument(document.id, {
        name: document.name,
        route: document.route,
        root: document.root,
      });
      const published = await budClient.publishVisualDocument(documentId);
      setDocument({ ...document, ...(published as object), id: document.id } as VisualDocument);
      setMessage('Publicação criada.');
    } catch (error: any) {
      setMessage(error?.message || 'Falha ao publicar.');
    }
  };

  const addText = () => {
    if (!document) return;
    const next = structuredClone(document);
    next.root.children.push({ id: `text-${Date.now()}`, type: 'text', component: 'Text', props: { text: 'Novo bloco de texto' }, styles: { color: '#e2e8f0', fontSize: 18 }, children: [] });
    setDocument(next);
    setMessage('Bloco adicionado. Salve para persistir.');
  };

  return (
    <div className="builder-shell">
      <header className="builder-topbar">
        <button className="icon-button" onClick={() => navigate('/workspace')} aria-label="Voltar"><ArrowLeft size={18} /></button>
        <div><strong>{document?.name || 'Builder'}</strong><span className="muted"> / editor visual</span></div>
        <div className="builder-actions"><button onClick={addText}><Plus size={16} /> Bloco</button><button onClick={save}><Save size={16} /> Salvar</button><button className="primary" onClick={publish}><Send size={16} /> Publicar</button></div>
      </header>
      <main className="builder-grid">
        <aside className="builder-panel layers-panel"><div className="panel-title"><Layers3 size={16} /> Camadas</div>{nodes.map(node => <button key={node.id} className={`layer-row ${selectedId === node.id ? 'selected' : ''}`} onClick={() => setSelectedId(node.id)}>{node.component}<small>{node.id}</small></button>)}</aside>
        <section className="builder-canvas"><div className="canvas-toolbar"><span><Eye size={15} /> Preview responsivo</span><span className="muted">{document ? `v${document.version}` : 'carregando...'}</span></div><div className="canvas-stage">{document && <VisualRenderer root={document.root} />}</div></section>
        <aside className="builder-panel properties-panel"><div className="panel-title">Propriedades</div>{selected ? <><label>Componente<input value={selected.component} onChange={event => updateSelected({ component: event.target.value })} /></label><label>Texto/label<input value={String(selected.props.text ?? selected.props.label ?? '')} onChange={event => updateSelected({ props: { ...selected.props, [selected.component === 'Text' ? 'text' : 'label']: event.target.value } })} /></label><label>Cor<input value={String(selected.styles.color ?? '#ffffff')} onChange={event => updateSelected({ styles: { ...selected.styles, color: event.target.value } })} /></label><label>Tamanho<input value={String(selected.styles.fontSize ?? '')} onChange={event => updateSelected({ styles: { ...selected.styles, fontSize: event.target.value } })} /></label><button className="danger-button" onClick={() => setMessage('Exclusão de nó será habilitada na próxima etapa.')}><Trash2 size={15} /> Excluir nó</button></> : <p className="muted">Selecione uma camada.</p>}</aside>
      </main>
      {message && <div className="builder-toast">{message}</div>}
    </div>
  );
}
