export type QaCheck = { label: string; ok: boolean; detail?: string };

export function runQa(html: string): { checks: QaCheck[]; passed: number; total: number } {
  const checks: QaCheck[] = [];
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const parserError = doc.querySelector('parsererror');
  checks.push({ label: 'HTML bem formado', ok: !parserError, detail: parserError?.textContent?.slice(0, 120) });
  checks.push({ label: 'DOCTYPE presente', ok: /<!doctype html>/i.test(html) });
  checks.push({ label: 'tag <html>', ok: !!doc.documentElement });
  checks.push({ label: 'tag <head>', ok: !!doc.head });
  checks.push({ label: 'tag <body>', ok: !!doc.body });
  checks.push({ label: 'meta viewport', ok: !!doc.querySelector('meta[name="viewport"]') });
  checks.push({ label: 'meta charset', ok: !!doc.querySelector('meta[charset]') });
  checks.push({ label: '<title> não vazio', ok: !!doc.querySelector('title')?.textContent?.trim() });
  checks.push({ label: 'imagens com alt', ok: Array.from(doc.querySelectorAll('img')).every((i) => i.hasAttribute('alt')) });
  checks.push({ label: 'links com href', ok: Array.from(doc.querySelectorAll('a')).every((a) => a.hasAttribute('href')) });
  checks.push({ label: 'iframe com sandbox', ok: Array.from(doc.querySelectorAll('iframe')).every((f) => f.hasAttribute('sandbox')) });
  checks.push({ label: 'sem <script> inline com eval', ok: !/<script[^>]*>[^<]*eval\(/i.test(html) });
  const passed = checks.filter((c) => c.ok).length;
  return { checks, passed, total: checks.length };
}

