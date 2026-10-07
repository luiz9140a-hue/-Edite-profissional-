export type VisualNodeType = 'element' | 'text' | 'component' | 'slot';

export interface VisualNode {
  id: string;
  type: VisualNodeType;
  component: string;
  props: Record<string, unknown>;
  styles: Record<string, string | number>;
  children: VisualNode[];
}

export interface VisualDocument {
  id: string;
  name: string;
  route: string;
  version: number;
  root: VisualNode;
  updatedAt: string;
  publishedAt?: string;
}
