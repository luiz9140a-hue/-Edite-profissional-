export type BuildResult = { ok: boolean; size: number; issues: string[]; output: string };

export function buildHtml(html: string): BuildResult {
  const issues: string[] = [];
  const doc = new DOMParser().parseFromString(html, 'text/html');
  if (doc.querySelector('parsererror')) issues.push('HTML inválido');
  if (!doc.querySelector('html')) issues.push('Falta <html>');
  if (!doc.querySelector('head')) issues.push('Falta <head>');
  if (!doc.querySelector('body')) issues.push('Falta <body>');
  const cleaned = html.replace(/<!--[\s\S]*?-->/g, '');
  const minified = cleaned.replace(/>\s+</g, '><');
  return {
    ok: issues.length === 0,
    size: new Blob([minified]).size,
    issues,
    output: issues.length ? html : minified,
  };
}

