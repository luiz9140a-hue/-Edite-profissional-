import React from 'react';
import type { VisualNode } from '../../types/visual';

function renderNode(node: VisualNode): React.ReactNode {
  const style = node.styles as React.CSSProperties;
  const children = node.children.map(child => <React.Fragment key={child.id}>{renderNode(child)}</React.Fragment>);

  if (node.component === 'Text') {
    return <p style={{ margin: 0, ...style }}>{String(node.props.text ?? '')}</p>;
  }

  if (node.component === 'Button') {
    return <button type="button" style={{ border: 0, cursor: 'pointer', ...style }}>{String(node.props.label ?? 'Button')}</button>;
  }

  if (node.component === 'Image') {
    return <img src={String(node.props.src ?? '')} alt={String(node.props.alt ?? '')} style={{ maxWidth: '100%', ...style }} />;
  }

  return <section style={style}>{children}</section>;
}

export default function VisualRenderer({ root }: { root: VisualNode }) {
  return <div className="visual-renderer">{renderNode(root)}</div>;
}
