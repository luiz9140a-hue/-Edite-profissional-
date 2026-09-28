import type { VisualDocument } from '../../src/types/visual.ts';
import { toPlatformBundle, type BridgeHealth, type BridgeSyncResult } from './contracts.ts';

const syncs = new Map<string, BridgeSyncResult>();

function targetUrl() {
  return process.env.PLATFORM_WAB_URL?.replace(/\/$/, '') || 'embedded://platform/wab';
}

export async function checkPlatformHealth(): Promise<BridgeHealth> {
  const target = targetUrl();
  if (target.startsWith('embedded://')) {
    return { status: 'embedded', bridge: 'engrenagem-platform-bridge', target, checkedAt: new Date().toISOString() };
  }
  try {
    const response = await fetch(`${target}/api/health`, { signal: AbortSignal.timeout(3000) });
    return { status: response.ok ? 'connected' : 'degraded', bridge: 'engrenagem-platform-bridge', target, checkedAt: new Date().toISOString() };
  } catch {
    return { status: 'degraded', bridge: 'engrenagem-platform-bridge', target, checkedAt: new Date().toISOString() };
  }
}

export async function syncDocument(document: VisualDocument): Promise<BridgeSyncResult> {
  const bundle = toPlatformBundle(document);
  const result: BridgeSyncResult = {
    documentId: document.id,
    version: document.version,
    target: targetUrl(),
    syncedAt: new Date().toISOString(),
    bundle,
  };
  const target = targetUrl();
  if (!target.startsWith('embedded://')) {
    const response = await fetch(`${target}/api/bridge/import`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(bundle),
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) throw new Error(`WAB bridge import failed: ${response.status}`);
  }
  syncs.set(document.id, result);
  return result;
}

export function getLastSync(documentId: string) {
  return syncs.get(documentId) ?? null;
}
