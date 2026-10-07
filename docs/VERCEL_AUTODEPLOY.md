# Tráfego automático e deploy

## Fluxo de requisições

Cada requisição recebe um `x-request-id`. As rotas da ponte usam limite de tráfego e `Idempotency-Key`; duas sincronizações do mesmo documento são serializadas para evitar que um publish sobrescreva um save concorrente.

```text
Browser/CI
  ↓ x-request-id + Idempotency-Key
/api/platform/documents/:id/sync
  ↓ fila por documento
PlatformBundle
  ↓ PLATFORM_WAB_URL, quando definido
WAB /api/bridge/import
```

Sem `PLATFORM_WAB_URL`, a ponte funciona em `embedded://platform/wab`, o que permite desenvolver e testar sem derrubar o aplicativo. Com a variável definida, falhas do WAB retornam `502` e não são tratadas como publicação bem-sucedida.

## Vercel

O projeto atual está ligado ao GitHub por integração Git da Vercel. Cada push na branch `main` deve criar um deployment. A configuração versionada é:

- `vercel.json`: build Vite, `npm run build`, saída `dist` e fallback SPA;
- `api/[...path].ts`: função serverless única que reutiliza `createApp()`;
- `.vercelignore`: evita enviar `node_modules`, artefatos gerados e dependências do Studio para o build do app principal.

O deployment antigo falhou com `unused_function` porque usava uma configuração de funções que não correspondia ao diretório `api`. A configuração atual não declara esse padrão inválido; a função existente é descoberta diretamente em `api/[...path].ts`.

## Variáveis necessárias

```text
PLATFORM_WAB_URL=https://studio.exemplo.com
```

Essa variável só deve ser adicionada na Vercel quando o endpoint WAB estiver publicado e protegido. O valor não deve ser commitado no GitHub.

## Verificação pós-push

```bash
npm ci
npm run lint
npm run build
curl https://SEU_DOMINIO/api/health
curl https://SEU_DOMINIO/api/platform/health
```

A Vercel deve apontar o deployment para o commit da branch `main`. O código da plataforma continua na raiz para desenvolvimento e evolução, mas não é compilado pelo build Vite do produto até existir um segundo projeto de Studio com seu próprio comando.
