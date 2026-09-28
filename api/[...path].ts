import { createApp } from '../server.ts';

let appPromise: ReturnType<typeof createApp> | undefined;

export default async function handler(req: any, res: any) {
  appPromise ||= createApp();
  const app = await appPromise;
  return app(req, res);
}
