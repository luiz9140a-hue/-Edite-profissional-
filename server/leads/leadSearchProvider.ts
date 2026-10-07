export interface LeadResult {
  id: string;
  name: string;
  address: string;
  lat: number;
  lon: number;
  category?: string;
  mapUrl: string;
}

const cache = new Map<string, { expiresAt: number; results: LeadResult[] }>();
let lastRequestAt = 0;

function sleep(ms: number) { return new Promise(resolve => setTimeout(resolve, ms)); }

export async function searchPublicLeads(query: string, near?: string): Promise<LeadResult[]> {
  const normalized = `${query.trim()} ${near?.trim() || ''}`.trim().slice(0, 180);
  if (normalized.length < 3) throw new Error('Informe um nicho e uma região para buscar leads.');
  const cacheKey = normalized.toLowerCase();
  const cached = cache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return cached.results;

  // Nominatim público exige identificação e no máximo uma requisição por segundo.
  const wait = Math.max(0, 1100 - (Date.now() - lastRequestAt));
  if (wait) await sleep(wait);
  lastRequestAt = Date.now();
  const url = new URL('https://nominatim.openstreetmap.org/search');
  url.searchParams.set('q', normalized);
  url.searchParams.set('format', 'jsonv2');
  url.searchParams.set('limit', '10');
  url.searchParams.set('addressdetails', '1');
  const response = await fetch(url, { headers: { 'User-Agent': 'EngrenagemAI/1.0 (lead-search; contact-admin)' } });
  if (!response.ok) throw new Error(`Nominatim respondeu ${response.status}. Tente novamente mais tarde.`);
  const payload = await response.json() as Array<{ place_id: number; display_name: string; lat: string; lon: string; type?: string }>;
  const results = payload.map(item => ({
    id: String(item.place_id), name: item.display_name.split(',')[0] || 'Local público', address: item.display_name,
    lat: Number(item.lat), lon: Number(item.lon), category: item.type,
    mapUrl: `https://www.openstreetmap.org/?mlat=${item.lat}&mlon=${item.lon}#map=18/${item.lat}/${item.lon}`
  }));
  cache.set(cacheKey, { expiresAt: Date.now() + 10 * 60 * 1000, results });
  return results;
}
