import { getPlan, PlanId } from './planCatalog';

export interface AccountEntitlement {
  uid: string;
  email?: string;
  planId: PlanId;
  creditsUsedToday: number;
  sitesPublished: number;
  periodKey: string;
  updatedAt: string;
}

export function periodKey(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

export function createEntitlement(uid: string, planId: PlanId = 'free', email?: string): AccountEntitlement {
  return { uid, email, planId, creditsUsedToday: 0, sitesPublished: 0, periodKey: periodKey(), updatedAt: new Date().toISOString() };
}

export function normalizeEntitlement(account: AccountEntitlement): AccountEntitlement {
  if (account.periodKey !== periodKey()) return { ...account, creditsUsedToday: 0, periodKey: periodKey(), updatedAt: new Date().toISOString() };
  return account;
}

export function canGenerate(account: AccountEntitlement, cost = 1): boolean {
  const current = normalizeEntitlement(account);
  return current.planId === 'admin_lifetime' || current.creditsUsedToday + cost <= getPlan(current.planId).dailyCredits;
}

export function consumeCredit(account: AccountEntitlement, cost = 1): AccountEntitlement {
  const current = normalizeEntitlement(account);
  if (!canGenerate(current, cost)) throw new Error('Limite diário de créditos atingido. Faça upgrade para continuar.');
  return { ...current, creditsUsedToday: current.planId === 'admin_lifetime' ? current.creditsUsedToday : current.creditsUsedToday + cost, updatedAt: new Date().toISOString() };
}
