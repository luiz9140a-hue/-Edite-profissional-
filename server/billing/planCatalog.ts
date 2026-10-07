export type PlanId = 'free' | 'creator' | 'studio' | 'admin_lifetime';

export interface PlanDefinition {
  id: PlanId;
  name: string;
  dailyCredits: number;
  publicSites: number;
  priceCents: number;
  currency: 'BRL';
  lifetime: boolean;
  features: string[];
}

export const PLAN_CATALOG: Record<PlanId, PlanDefinition> = {
  free: { id: 'free', name: 'Teste', dailyCredits: 5, publicSites: 1, priceCents: 0, currency: 'BRL', lifetime: false, features: ['5 créditos diários', '1 site público'] },
  creator: { id: 'creator', name: 'Creator', dailyCredits: 100, publicSites: 2, priceCents: 4900, currency: 'BRL', lifetime: false, features: ['100 créditos diários', '2 sites públicos', 'Exportação Vercel/Netlify'] },
  studio: { id: 'studio', name: 'Studio', dailyCredits: 500, publicSites: 10, priceCents: 14900, currency: 'BRL', lifetime: false, features: ['500 créditos diários', '10 sites públicos', 'Equipe e prioridade'] },
  admin_lifetime: { id: 'admin_lifetime', name: 'Admin Vitalício', dailyCredits: Number.MAX_SAFE_INTEGER, publicSites: Number.MAX_SAFE_INTEGER, priceCents: 0, currency: 'BRL', lifetime: true, features: ['Acesso vitalício', 'Sem limite operacional', 'Controle administrativo'] }
};

export function getPlan(id?: string): PlanDefinition {
  return PLAN_CATALOG[(id as PlanId) || 'free'] || PLAN_CATALOG.free;
}
