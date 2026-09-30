import { v } from 'convex/values';
import { action } from './_generated/server';

interface Lead {
  id: string;
  name: string;
  address: string;
  lat: number;
  lon: number;
  mapUrl: string;
  category?: string;
}

export const searchLeads = action({
  args: { query: v.string(), near: v.string() },
  handler: async (_ctx, args): Promise<{ leads: Lead[] }> => {
    const UA = 'EngrenagemAI/1.0 (lead discovery; contact via platform)';

    async function geocode(q: string): Promise<{ lat: number; lon: number } | null> {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(q)}`, {
          headers: { 'User-Agent': UA, 'Accept-Language': 'pt-BR' },
          signal: controller.signal,
        });
        clearTimeout(timeout);
        if (!res.ok) return null;
        const data = (await res.json()) as Array<{ lat: string; lon: string }>;
        if (!data[0]) return null;
        return { lat: Number(data[0].lat), lon: Number(data[0].lon) };
      } catch {
        return null;
      }
    }

    const place = await geocode(args.near);
    const lat = place?.lat ?? -23.5505;
    const lon = place?.lon ?? -46.6333;

    const overpassQuery = `[out:json][timeout:20];nwr(around:2500,${lat},${lon})[name][~"^(amenity|shop|office|healthcare|leisure)$"~".*"];out center 30;`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);
    try {
      const res = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': UA },
        body: `data=${encodeURIComponent(overpassQuery)}`,
        signal: controller.signal,
      });
      if (!res.ok) throw new Error(`Overpass HTTP ${res.status}`);
      const data = (await res.json()) as {
        elements: Array<{ type: string; id: number; lat?: number; lon?: number; center?: { lat: number; lon: number }; tags?: Record<string, string> }>;
      };

      const leads: Lead[] = data.elements
        .filter((e) => e.tags?.name)
        .slice(0, 12)
        .map((e) => {
          const eLat = e.lat ?? e.center?.lat ?? lat;
          const eLon = e.lon ?? e.center?.lon ?? lon;
          const name = e.tags?.name ?? 'Negócio';
          const street = [e.tags?.['addr:street'], e.tags?.['addr:housenumber']].filter(Boolean).join(', ');
          const city = e.tags?.['addr:city'] ?? args.near;
          return {
            id: `${e.type}/${e.id}`,
            name,
            address: street ? `${street} — ${city}` : city,
            lat: eLat,
            lon: eLon,
            mapUrl: `https://www.openstreetmap.org/?mlat=${eLat}&mlon=${eLon}#map=18/${eLat}/${eLon}`,
            category: e.tags?.amenity ?? e.tags?.shop ?? e.tags?.office ?? e.tags?.healthcare ?? e.tags?.leisure,
          };
        });

      return { leads };
    } finally {
      clearTimeout(timeout);
    }
  },
});
