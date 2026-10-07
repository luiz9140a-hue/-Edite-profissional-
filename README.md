# Edite Profissional

Editor multi-arquivo com preview React real, QA, build no navegador e exportação .zip.

## Rodar local
npm install
npm run dev

## Deploy na Vercel
1. Suba o projeto no GitHub
2. Conecte o repositório na Vercel
3. A Vercel publica automaticamente a cada push

## O que funciona
- Editor CodeMirror multi-arquivo (HTML, CSS, TS/TSX, JS/JSX)
- Preview em dois modos: HTML e React (esbuild-wasm no navegador)
- QA real com DOMParser (12 checagens)
- Build real no navegador
- Exportar .zip real com JSZip
- Salvar em disco com File System Access API
- BUD aplica patches reais no HTML
- Terminal: help, qa, build, export, save, clear

