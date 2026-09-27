# Relatório de auditoria — Engrenagem AI

**Branch:** `fix/firebase-vercel`  
**Commits:** `caceeda` (correções) e `b7703b6` (relatório)  
**Data:** 2026-09-27

## Resultado

A aplicação foi auditada de ponta a ponta. O fluxo principal de criação agora percorre `QUEUED → ANALYZING → PLANNING → RESEARCHING → EXECUTING → BUILDING → TESTING → QA → READY` e foi validado com criação real em aproximadamente 3 segundos.

## Correções aplicadas

- Jobs e projetos passaram a ser persistidos no Firestore quando as credenciais server-side estão configuradas na Vercel.
- A API aguarda a conclusão do pipeline antes de responder, evitando jobs abandonados por funções serverless encerradas cedo demais.
- Jobs e projetos podem ser recuperados do Firestore em novas instâncias da Vercel.
- Chamadas externas de Wikimedia e Gemini receberam timeout para evitar execução indefinidamente pendurada.
- O Workspace passou a enviar a identidade e o plano do usuário ao criar e editar projetos.
- Foi adicionado handler catch-all `api/[...path].ts` para rotas profundas na Vercel.
- O endpoint de planos deixou de retornar placeholder e passou a usar o catálogo real.
- O Firebase Web SDK aceita configuração do projeto correto via variáveis `VITE_FIREBASE_*`.
- O Vite aceita somente os hosts locais e do sandbox autorizado.
- Corrigido o import do `ProjectAssetLibrary` e removidos espaços finais detectados pelo `git diff --check`.

## Validações executadas

- `npm run lint`: aprovado.
- `npm run build`: aprovado.
- Auditoria interna de interações: **38/38 conectadas**, 100% de cobertura, zero handlers/rotas/API quebrados.
- Bateria ponta a ponta: **29 verificações, 0 falhas**.
- Testados: billing, intake, command router, criação, edição, consulta de job/projeto, arquivos, preview, health, logs, build, testes, QA, reparo, assets, comandos permitidos/bloqueados, publish kit, GitHub, deploy sem credencial, exportação e cancelamento de job finalizado.
- Inspeção visual do host público do sandbox: aprovada após correção de `allowedHosts`.

## Configuração necessária antes do deploy final

O repositório histórico contém um fallback Firebase de `engrenagem-ai-production`, enquanto a imagem fornecida anteriormente indica `edite-profissional`. Para usar o projeto correto, configure na Vercel as variáveis públicas `VITE_FIREBASE_*` e uma credencial server-side (`FIREBASE_SERVICE_ACCOUNT_JSON` ou o trio `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`). Não coloque credenciais privadas no GitHub.
