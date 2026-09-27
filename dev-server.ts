import { createServer } from 'vite';
import { createApp } from './server.ts';

const app = await createApp();
const vite = await createServer({
  server: { middlewareMode: true },
  appType: 'spa'
});
app.use(vite.middlewares);

const port = 3000;
app.listen(port, () => {
  console.log(`Engrenagem AI Dev Server operacional na porta ${port}`);
});
