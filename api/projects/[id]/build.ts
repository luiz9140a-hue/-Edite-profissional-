import { createApp } from '../../../server';
const appPromise = createApp();
export default async function handler(req: any, res: any) {
  return (await appPromise)(req, res);
}
