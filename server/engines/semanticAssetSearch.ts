import { IntentContract } from '../../src/types/engrenagem';
import { validateAndGetSemanticAssets, VerifiedAsset } from './semanticAssetGuard';

const BLOCKED_TERMS = ['placeholder', 'logo', 'icon', 'clipart', 'cartoon', 'drawing', 'illustration', 'diagram', 'screenshot', 'template', 'vector'];

function queryFor(intent: IntentContract): string {
  const primary = intent.domain === 'fitness' ? 'gym fitness workout' : intent.domain === 'healthcare' ? 'dental clinic healthcare' : intent.domain === 'blog' ? 'technology editorial photo' : intent.domain === 'food_delivery' ? 'restaurant food' : intent.visualConcepts.slice(0, 3).join(' ');
  return `${primary} ${intent.requiredAssets.slice(0, 2).join(' ')}`.slice(0, 180);
}

export async function searchRealVisualAssets(intent: IntentContract): Promise<{ assets: VerifiedAsset[]; rejectedReasons: string[]; source: string }> {
  const local = validateAndGetSemanticAssets(intent);
  if (local.assets.length >= 3) return { ...local, source: 'verified-library' };

  try {
    const url = new URL('https://commons.wikimedia.org/w/api.php');
    url.searchParams.set('action', 'query'); url.searchParams.set('generator', 'search'); url.searchParams.set('gsrsearch', queryFor(intent));
    url.searchParams.set('gsrnamespace', '6'); url.searchParams.set('gsrlimit', '10'); url.searchParams.set('prop', 'imageinfo');
    url.searchParams.set('iiprop', 'url|size'); url.searchParams.set('iiurlwidth', '1200'); url.searchParams.set('format', 'json');
    const response = await fetch(url, { headers: { 'User-Agent': 'EngrenagemAI/1.0 (visual-asset-research; contact-admin)' } });
    if (!response.ok) throw new Error(`Wikimedia Commons respondeu ${response.status}`);
    const data = await response.json() as { query?: { pages?: Record<string, { pageid: number; title: string; imageinfo?: Array<{ thumburl?: string; width?: number; height?: number; descriptionurl?: string }> }> } };
    const remote = Object.values(data.query?.pages || {}).map((page, index) => {
      const info = page.imageinfo?.[0];
      const title = page.title.replace(/^File:/i, '').replace(/\.[^.]+$/, '');
      return info?.thumburl ? { id: `commons-${page.pageid}`, category: intent.domain, semanticTags: [...intent.visualConcepts, ...intent.requiredAssets], url: info.thumburl, alt: title, width: info.width || 1200, height: info.height || 800, index } : null;
    }).filter((asset): asset is VerifiedAsset & { index: number } => Boolean(asset) && !BLOCKED_TERMS.some(term => asset!.alt.toLowerCase().includes(term)) && !asset!.url.includes('Special:FilePath'))
      .sort((a, b) => a.index - b.index).slice(0, 3).map(({ index: _index, ...asset }) => asset);
    if (remote.length) return { assets: [...remote, ...local.assets].slice(0, 5), rejectedReasons: local.rejectedReasons, source: 'Wikimedia Commons + verified-library' };
  } catch (error: any) {
    local.rejectedReasons.push(`Pesquisa remota de imagens indisponível; fallback para biblioteca verificada: ${error.message}`);
  }
  return { ...local, source: 'verified-library-fallback' };
}
