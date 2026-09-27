export default async function handler(req: any, res: any) {
  try {
    const { createApp } = await import('../../server');
    return (await createApp())(req, res);
  } catch (error: any) {
    return res.status(500).json({ error: error?.message || String(error), stack: error?.stack });
  }
}
