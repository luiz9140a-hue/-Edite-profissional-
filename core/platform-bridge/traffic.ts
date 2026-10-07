import { randomUUID } from 'node:crypto';

const recentRequests = new Map<string, { count: number; resetAt: number }>();
const inFlight = new Map<string, Promise<unknown>>();

export function requestId(input?: string) {
  return input && /^[a-zA-Z0-9._:-]{1,120}$/.test(input) ? input : randomUUID();
}

export function allowRequest(bucket: string, limit = 60, windowMs = 60_000) {
  const now = Date.now();
  const current = recentRequests.get(bucket);
  if (!current || current.resetAt <= now) {
    recentRequests.set(bucket, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (current.count >= limit) return false;
  current.count += 1;
  return true;
}

export async function serializeByKey<T>(key: string, task: () => Promise<T>): Promise<T> {
  const prior = inFlight.get(key);
  if (prior) return prior as Promise<T>;
  const current = task().finally(() => inFlight.delete(key));
  inFlight.set(key, current);
  return current;
}
