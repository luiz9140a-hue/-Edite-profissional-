export default function handler(_req: any, res: any) {
  res.setHeader('content-type', 'application/json');
  res.statusCode = 200;
  res.end(JSON.stringify({ ok: true }));
}
