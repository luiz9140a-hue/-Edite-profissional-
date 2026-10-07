import type { VisualDocument, VisualNode } from '../../src/types/visual.ts';

export interface BridgeHealth {
  status: 'embedded' | 'connected' | 'degraded';
  bridge: 'engrenagem-platform-bridge';
  target: string;
  checkedAt: string;
}

export interface PlatformNode {
  id: string;
  kind: VisualNode['type'];
  component: string;
  props: Record<string, unknown>;
  styles: Record<string, string | number>;
  children: PlatformNode[];
}

export interface PlatformBundle {
  schemaVersion: 1;
  source: 'engrenagem-visual-document';
  documentId: string;
  name: string;
  route: string;
  version: number;
  updatedAt: string;
  publishedAt?: string;
  root: PlatformNode;
}

export interface BridgeSyncResult {
  documentId: string;
  version: number;
  target: string;
  syncedAt: string;
  requestId: string;
  idempotencyKey: string;
  bundle: PlatformBundle;
}

export function toPlatformNode(node: VisualNode): PlatformNode {
  return {
    id: node.id,
    kind: node.type,
    component: node.component,
    props: { ...node.props },
    styles: { ...node.styles },
    children: node.children.map(toPlatformNode),
  };
}

export function toPlatformBundle(document: VisualDocument): PlatformBundle {
  return {
    schemaVersion: 1,
    source: 'engrenagem-visual-document',
    documentId: document.id,
    name: document.name,
    route: document.route,
    version: document.version,
    updatedAt: document.updatedAt,
    publishedAt: document.publishedAt,
    root: toPlatformNode(document.root),
  };
}
