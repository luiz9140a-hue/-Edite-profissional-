import * as esbuild from 'esbuild-wasm';

let initialized = false;

export async function ensureEsbuild() {
  if (initialized) return;
  await esbuild.initialize({
    wasmURL: 'https://unpkg.com/esbuild-wasm@0.24.0/esbuild.wasm',
    worker: true,
  });
  initialized = true;
}

export async function bundleProject(
  files: Record<string, string>,
  entry = 'src/main.tsx'
): Promise<{ html: string; errors: string[] }> {
  await ensureEsbuild();

  const plugin: esbuild.Plugin = {
    name: 'virtual-fs',
    setup(build) {
      build.onResolve({ filter: /.*/ }, (args) => {
        if (args.path.startsWith('.') || args.path.startsWith('/')) {
          const base = args.importer ? args.importer.replace(/[^/]+$/, '') : '/';
          const p = new URL(args.path, 'file://' + base).pathname.replace(/^\//, '');
          return { path: p, namespace: 'vfs' };
        }
        return { path: args.path, namespace: 'vfs' };
      });
      build.onLoad({ filter: /.*/, namespace: 'vfs' }, (args) => {
        const content = files[args.path];
        if (content == null) return { errors: [{ text: `arquivo não encontrado: ${args.path}` }] };
        const ext = args.path.split('.').pop()!;
        const loader =
          ext === 'tsx' ? 'tsx' :
          ext === 'ts' ? 'ts' :
          ext === 'jsx' ? 'jsx' :
          ext === 'js' ? 'js' :
          ext === 'css' ? 'css' : 'text';
        return { contents: content, loader };
      });
    },
  };

  const result = await esbuild.build({
    entryPoints: [entry],
    bundle: true,
    write: false,
    outdir: 'out',
    format: 'esm',
    jsx: 'automatic',
    plugins: [plugin],
    define: { 'process.env.NODE_ENV': '"development"' },
    logLevel: 'silent',
  });

  const js = result.outputFiles.find((f) => f.path.endsWith('.js'))?.text ?? '';
  const css = result.outputFiles.find((f) => f.path.endsWith('.css'))?.text ?? '';
  const indexHtml = files['index.html'] ?? '<!doctype html><html><body><div id="root"></div></body></html>';
  const html = indexHtml
    .replace(/<script[^>]*src=["'][^"']*main\.tsx["'][^>]*><\/script>/i, '')
    .replace('</body>', `<style>${css}</style><script type="module">${js}</script></body>`);

  return { html, errors: [] };
}

