import type { VisualDocument, VisualNode } from '../../src/types/visual.ts';

const documents = new Map<string, VisualDocument>();

function node(id: string, component: string, children: VisualNode[] = [], props: Record<string, unknown> = {}, styles: Record<string, string | number> = {}): VisualNode {
  return { id, type: component === 'Text' ? 'text' : 'component', component, props, styles, children };
}

function defaultDocument(id = 'starter-document'): VisualDocument {
  return {
    id,
    name: 'Minha primeira página',
    route: '/',
    version: 1,
    updatedAt: new Date().toISOString(),
    root: node('root', 'Page', [
      node('hero', 'Section', [
        node('title', 'Text', [], { text: 'Construa sua cidade digital' }, { fontSize: 48, fontWeight: 800, color: '#f8fafc' }),
        node('subtitle', 'Text', [], { text: 'Editor visual, publicação e código em um só lugar.' }, { fontSize: 18, color: '#94a3b8' }),
        node('cta', 'Button', [], { label: 'Começar agora' }, { background: '#8b5cf6', color: '#ffffff', padding: '12px 18px', borderRadius: 10 })
      ], {}, { padding: 64, background: '#0f172a', borderRadius: 24 })
    ])
  };
}

export function getDocument(id: string): VisualDocument {
  if (!documents.has(id)) documents.set(id, defaultDocument(id));
  return documents.get(id)!;
}

export function saveDocument(input: VisualDocument): VisualDocument {
  const next: VisualDocument = { ...input, version: Math.max(1, input.version + 1), updatedAt: new Date().toISOString() };
  documents.set(next.id, next);
  return next;
}

export function publishDocument(id: string): VisualDocument {
  const current = getDocument(id);
  const next = { ...current, publishedAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  documents.set(id, next);
  return next;
}

function findNode(root: VisualNode, id: string): VisualNode | null {
  if (root.id === id) return root;
  for (const child of root.children) {
    const match = findNode(child, id);
    if (match) return match;
  }
  return null;
}

export function updateNode(id: string, nodeId: string, patch: Partial<Pick<VisualNode, 'props' | 'styles' | 'component'>>): VisualDocument | null {
  const current = getDocument(id);
  const target = findNode(current.root, nodeId);
  if (!target) return null;
  if (patch.component) target.component = patch.component;
  if (patch.props) target.props = { ...target.props, ...patch.props };
  if (patch.styles) target.styles = { ...target.styles, ...patch.styles };
  return saveDocument(current);
}
