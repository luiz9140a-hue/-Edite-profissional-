# Arquitetura da cidade — Engrenagem AI

Este repositório não será refeito como uma cópia literal do Plasmic. A cidade será construída dentro da aplicação existente, preservando o motor BUD e adicionando uma plataforma visual modular.

## Planta da raiz

```text
.
├── api/                         Entrada serverless da Vercel
├── core/                        Domínio e motores de negócio
│   ├── bud/                     Geração, chat, intake e comandos
│   ├── event-engine/            Eventos e ações
│   ├── interaction-registry/   Auditoria de interações
│   ├── planning/                Planejamento
│   ├── preview-engine/          Preview e logs
│   ├── project-forge/           Intenção, classificação e projetos
│   ├── provider-router/         Seleção de provedores
│   ├── providers/               GitHub e deployment
│   ├── qa/                      QA funcional e interações
│   ├── repair-engine/           Reparo automático
│   ├── responsive-engine/       Regras por breakpoint
│   ├── supreme-build/           Orquestração principal
│   ├── tool-registry/           Catálogo de ferramentas
│   └── visual-builder/          Documento, operações e componentes visuais
├── infrastructure/              Recursos externos e sandbox
├── server/                      API, persistência, billing, leads e engines
├── src/                         Aplicação React e telas
│   ├── auth/                    Login e proteção de rotas
│   ├── components/              UI do produto
│   │   ├── builder/             Editor visual e renderer
│   │   ├── beginner/            Jornada primeiro cliente
│   │   ├── layout/              Landing e navegação
│   │   ├── preview/             Preview isolado
│   │   └── workspace/           Workspace existente
│   ├── lib/                     Firebase e utilitários
│   └── types/                   Contratos TypeScript
├── docs/                        Plantas, auditorias e operação
├── firestore.rules              Segurança do Firestore
├── vercel.json                  Build e fallback SPA
└── package.json                 Ferramentas e scripts da obra
```

## Fluxo de água e luz

```text
Browser → Vite/React → API Express → domínio core → persistência/serviços externos
   ↑             ↓             ↓               ↓
preview ← renderer ← documento visual ← operações/versionamento/publicação
```

## Camadas funcionais

### 1. Fundação

A raiz de execução é Vite + React 19 + TypeScript. O `server.ts` serve a API e, localmente, monta o middleware do Vite. Na Vercel, `api/[...path].ts` reutiliza `createApp()` como função serverless.

### 2. Motor existente

O BUD continua responsável por intake, geração, edição, QA, reparo, assets, preview e deployment. Esse motor não deve ser removido; ele é o prédio de automação da cidade.

### 3. Cidade visual

`core/visual-builder` é a nova camada declarativa. O documento visual é uma árvore de nós com componente, props, estilos e filhos. Operações são aplicadas à árvore e geram uma nova versão.

A API já expõe:

- `GET /api/visual/documents/:id`
- `PUT /api/visual/documents/:id`
- `POST /api/visual/documents/:id/operations`
- `POST /api/visual/documents/:id/publish`
- `GET /api/visual/components`

### 4. Editor e renderer

`src/components/builder/BuilderPage.tsx` fornece camadas, canvas, propriedades, salvar e publicar. `VisualRenderer.tsx` converte a árvore em React. A próxima camada deve adicionar seleção por canvas, drag-and-drop, undo/redo, slots e variantes.

### 5. Persistência

A primeira implementação funciona sem credenciais externas e mantém o documento na instância do processo. Para produção, o próximo passo é persistir documentos, versões e publicações no Firestore já usado pelo projeto, com `ownerId`, `projectId` e regras por usuário.

### 6. Assets e integrações

O projeto já possui biblioteca de mídia, Firebase, busca pública, provedores de GitHub/deploy e geração de imagens. Os adaptadores devem permanecer atrás de interfaces, para que trocar Firebase, Vercel, Nominatim ou provedor de IA não exija reescrever o editor.

## Ordem de construção

1. Documento + operações + registry.
2. Persistência Firestore com isolamento por usuário.
3. Editor drag-and-drop e histórico.
4. Renderer de produção e rotas públicas.
5. Assets, data sources e bindings.
6. Codegen e SDK de integração.
7. colaboração, branches, permissões e observabilidade.

Cada camada só é considerada pronta depois de lint, build, smoke test da API e teste de fluxo na interface.
