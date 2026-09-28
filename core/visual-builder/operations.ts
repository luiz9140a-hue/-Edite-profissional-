import type { VisualDocument, VisualNode } from '../../src/types/visual.ts';

export type VisualOperation =
  | { type: 'insert'; parentId: string; node: VisualNode; index?: number }
  | { type: 'remove'; nodeId: string }
  | { type: 'update'; nodeId: string; patch: Partial<Pick<VisualNode, 'component' | 'props' | 'styles'>> };

function visit(root: VisualNode, callback: (node: VisualNode, parent?: VisualNode) => boolean, parent?: VisualNode): boolean {
  if (callback(root, parent)) return true;
  return root.children.some(child => visit(child, callback, root));
}

export function applyOperation(document: VisualDocument, operation: VisualOperation): VisualDocument {
  const next = structuredClone(document);
  if (operation.type === 'update') {
    visit(next.root, node => {
      if (node.id !== operation.nodeId) return false;
      node.component = operation.patch.component ?? node.component;
      node.props = operation.patch.props ? { ...node.props, ...operation.patch.props } : node.props;
      node.styles = operation.patch.styles ? { ...node.styles, ...operation.patch.styles } : node.styles;
      return true;
    });
  }
  if (operation.type === 'remove' && operation.nodeId !== next.root.id) {
    visit(next.root, (node, parent) => {
      if (node.id !== operation.nodeId || !parent) return false;
      parent.children = parent.children.filter(child => child.id !== operation.nodeId);
      return true;
    });
  }
  if (operation.type === 'insert') {
    visit(next.root, node => {
      if (node.id !== operation.parentId) return false;
      const index = operation.index === undefined ? node.children.length : Math.max(0, Math.min(operation.index, node.children.length));
      node.children.splice(index, 0, operation.node);
      return true;
    });
  }
  next.version += 1;
  next.updatedAt = new Date().toISOString();
  return next;
}
