import { getPlan } from './planCatalog';

export type ApiProvider = 'bud_generation' | 'nominatim_leads' | 'overpass_places' | 'deployment';
const usage = new Map<string, { day: string; total: number; byProvider: Record<string, number> }>();

export interface CreditReservation { allowed: boolean; charged: number; remaining: number; provider: ApiProvider; day: string; }

export function reserveApiCredits(uid: string, planId: string | undefined, provider: ApiProvider, cost: number): CreditReservation {
  const day = new Date().toISOString().slice(0, 10);
  const key = uid || 'anonymous';
  const current = usage.get(key)?.day === day ? usage.get(key)! : { day, total: 0, byProvider: {} };
  const plan = getPlan(planId);
  const allowed = plan.id === 'admin_lifetime' || current.total + cost <= plan.dailyCredits;
  if (allowed) {
    current.total += cost;
    current.byProvider[provider] = (current.byProvider[provider] || 0) + cost;
    usage.set(key, current);
  }
  return { allowed, charged: allowed ? cost : 0, remaining: plan.id === 'admin_lifetime' ? Number.MAX_SAFE_INTEGER : Math.max(0, plan.dailyCredits - current.total), provider, day };
}

export function getApiUsage(uid: string, planId?: string) {
  const day = new Date().toISOString().slice(0, 10);
  const current = usage.get(uid || 'anonymous');
  return { day, total: current?.day === day ? current.total : 0, byProvider: current?.day === day ? current.byProvider : {}, dailyLimit: getPlan(planId).dailyCredits };
}
