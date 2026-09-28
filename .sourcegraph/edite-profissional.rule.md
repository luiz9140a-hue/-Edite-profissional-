---
title: Edite Profissional — regras do BUD
description: Regras de segurança e arquitetura para o Cody ao analisar ou editar este repositório.
tags:
  - bud
  - vercel
  - typescript
  - react
  - express
---

# Contexto do projeto

Este repositório contém o Edite Profissional e o motor BUD, com frontend React/Vite e API Express em funções serverless da Vercel.

## Regras obrigatórias

- Faça alterações pequenas, isoladas e reversíveis. Não reestruture o projeto inteiro para corrigir um problema local.
- Preserve as rotas existentes e a compatibilidade com React, TypeScript, Express e Vercel.
- Não reintroduza Firebase, Firestore ou `firebase-admin` sem solicitação explícita do proprietário.
- Não importe Vite ou Rolldown no caminho carregado por uma função serverless. Vite deve ficar restrito ao servidor local de desenvolvimento.
- Use imports locais ESM explícitos quando o runtime da Vercel exigir a extensão `.ts`.
- Não coloque chaves, tokens, senhas ou credenciais no frontend, em commits ou em arquivos de configuração públicos.
- Antes de concluir uma alteração, execute `npx tsc --noEmit --pretty false` e `npx vite build`.
- Para alterações de API, teste primeiro o endpoint diretamente com `curl` e registre o status HTTP e o corpo da resposta.
- Não declare um recurso como resolvido sem testar o fluxo real no deployment da Vercel.

## Fluxo de correção do BUD

1. Identifique o erro exato nos logs.
2. Altere somente o arquivo ou módulo responsável.
3. Rode typecheck e build localmente.
4. Faça um teste da API local.
5. Publique uma alteração pequena.
6. Teste a URL pública e registre o resultado.
