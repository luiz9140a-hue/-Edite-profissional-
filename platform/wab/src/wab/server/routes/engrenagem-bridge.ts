import type { Request, Response } from 'express';

function isBundle(value: unknown): value is { schemaVersion: 1; source: 'engrenagem-visual-document'; documentId: string; root: unknown } {
  const candidate = value as Record<string, unknown> | null;
  return Boolean(
    candidate &&
      candidate.schemaVersion === 1 &&
      candidate.source === 'engrenagem-visual-document' &&
      typeof candidate.documentId === 'string' &&
      candidate.root,
  );
}

export function importEngrenagemBundle(req: Request, res: Response) {
  if (!isBundle(req.body)) {
    return res.status(400).json({ error: 'Bundle Engrenagem inválido.' });
  }
  return res.json({
    accepted: true,
    documentId: req.body.documentId,
    schemaVersion: req.body.schemaVersion,
    receivedAt: new Date().toISOString(),
  });
}
