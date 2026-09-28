

## 16. Preparação adicional para o próximo deployment

Após a solicitação de deixar o sistema pronto para quando a quota da Vercel voltar, foram aplicadas novas correções locais:

### Build real do projeto gerado

- **Arquivo:** `core/bud/JobEngine.ts`.
- O estado `BUILDING` agora lê o `package.json` gerado e executa, no workspace isolado:
  - `npm install --no-audit --no-fund`;
  - `npm run lint`, quando o script existe;
  - `npm run typecheck`, quando o script existe;
  - `npm run build`.
- stdout/stderr resumidos, duração e exit code são registrados nos logs do Job.
- Qualquer falha marca o job como `FAILED`, emite `BUILD_FAILED` e bloqueia o QA/READY.

### Checkpoint Firestore

- **Arquivo:** `core/bud/JobEngine.ts`.
- O ciclo grava checkpoints de Job e Project via `saveJob`/`saveProject` quando o Firestore está configurado.
- Em modo local sem credenciais, a operação permanece best-effort e registra aviso; nenhum estado falso de persistência é declarado.
- A leitura de recuperação entre instâncias ainda requer a integração completa de `getJob`/`getProject` nos handlers, permanecendo pendência de produção.

### Sandbox

- **Arquivo:** `infrastructure/sandbox/sandboxManager.ts`.
- `validateCommand` agora rejeita comandos fora da allowlist antes de qualquer execução.
- Smoke test: comando `curl https://example.com` em projeto existente → **HTTP 403 BLOCKED**.

### Evidência do pipeline real

Novo teste local de geração de hamburgueria:

- job: `job-za1oorh`;
- projeto: `proj-jns3ufa`;
- status: `READY` após build real;
- `npm install` do projeto gerado: PASS;
- `npm run build` do projeto gerado: PASS;
- Vite gerado produziu `dist/index.html` e assets;
- projeto gerado: 12 arquivos;
- `GET /api/health`: HTTP 200.

A edição de projetos e o deployment externo continuam sem ser falsamente declarados: limites de créditos e quota Vercel são retornados como bloqueios reais.

## 17. Estado preparado para retomada

O código está no GitHub com a correção do `vercel.json` e a preparação local adicional aguarda commit/push desta etapa. Quando a quota da Vercel voltar, o próximo passo operacional será:

1. executar `npm run lint`, `npm run typecheck` e `npm run build`;
2. confirmar o commit na branch `main`;
3. criar/reexecutar deployment do projeto `edite-profissional`;
4. conferir deployment ID, commit SHA, build logs e `readyState`;
5. testar `/`, `/login`, `/workspace` e `/api/health` no domínio real.

Até essa verificação, o estado permanece **SUPREMEBUILDMOD BLOCKED**, não READY.
