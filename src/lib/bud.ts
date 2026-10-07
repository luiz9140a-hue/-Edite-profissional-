export type BudAction =
  | { kind: 'set-hero-title'; value: string }
  | { kind: 'set-cta-color'; value: string }
  | { kind: 'run-qa' }
  | { kind: 'run-build' }
  | { kind: 'noop'; value: string };

export function parseIntent(text: string): BudAction {
  const t = text.toLowerCase().trim();

  if (/(hero|t[íi]tulo)/.test(t) && /(troque|mude|altere|defina|coloque|para)/.test(t)) {
    const m = text.match(/["'“”]([^"'“”]+)["'“”]/);
    return { kind: 'set-hero-title', value: m?.[1] ?? 'Sorria com confiança.' };
  }

  if (/(cor|cta|bot[ãa]o)/.test(t)) {
    if (/verde/.test(t)) return { kind: 'set-cta-color', value: '#16a34a' };
    if (/azul/.test(t)) return { kind: 'set-cta-color', value: '#2563eb' };
    if (/vermelh/.test(t)) return { kind: 'set-cta-color', value: '#dc2626' };
    if (/roxo/.test(t)) return { kind: 'set-cta-color', value: '#7c3aed' };
    const hex = text.match(/#[0-9a-f]{3,8}/i);
    if (hex) return { kind: 'set-cta-color', value: hex[0] };
    return { kind: 'set-cta-color', value: '#16a34a' };
  }

  if (/(rode|roda|execute).*qa|qa.*(rode|roda|execute)/.test(t)) return { kind: 'run-qa' };
  if (/(rode|roda|execute).*build|build.*(rode|roda|execute)/.test(t)) return { kind: 'run-build' };

  return { kind: 'noop', value: text };
}

export function applyAction(
  html: string,
  action: BudAction
): { html: string; message: string; changed: boolean } {
  switch (action.kind) {
    case 'set-hero-title': {
      const re = /(<h[12][^>]*id=["']hero-title["'][^>]*>)([\s\S]*?)(<\/h[12]>)/i;
      if (re.test(html)) {
        return { html: html.replace(re, `$1${action.value}$3`), message: `Título do hero → <b>${action.value}</b>.`, changed: true };
      }
      const re2 = /(<h[12][^>]*>)([\s\S]*?)(<\/h[12]>)/i;
      if (re2.test(html)) {
        return { html: html.replace(re2, `$1${action.value}$3`), message: `Título principal → <b>${action.value}</b>.`, changed: true };
      }
      return { html, message: 'Nenhum <h1>/<h2> encontrado.', changed: false };
    }
    case 'set-cta-color': {
      const re = /(\.site-cta\s*\{[^}]*?background\s*:\s*)([^;]+)(;)/;
      if (re.test(html)) {
        return { html: html.replace(re, `$1${action.value}$3`), message: `Cor da CTA → <b>${action.value}</b>.`, changed: true };
      }
      return { html, message: 'Nenhuma regra .site-cta encontrada.', changed: false };
    }
    case 'run-qa':
      return { html, message: 'QA executado.', changed: false };
    case 'run-build':
      return { html, message: 'Build executado.', changed: false };
    default:
      return {
        html,
        message: 'Não entendi. Exemplos: "troque o título do hero para \'...\'", "mude a cor da CTA para verde", "rode qa", "rode build".',
        changed: false,
      };
  }
}

