# Cody no Edite Profissional

O Cody é uma ferramenta opcional de desenvolvimento. Ele ajuda a entender, revisar e corrigir o código no VS Code usando o contexto deste repositório. Ele **não é uma dependência do site** e não participa do login, da API ou do BUD em produção.

## Ativação

1. Abra o repositório no VS Code.
2. Instale a extensão recomendada `Sourcegraph Cody` (`sourcegraph.cody-ai`).
3. Faça login no Cody somente dentro do VS Code, se a extensão solicitar.
4. Abra a pasta raiz do repositório para que o Cody enxergue o contexto completo.
5. Use `@` para mencionar arquivos específicos, por exemplo `@server.ts` ou `@core/bud/JobEngine.ts`.

As regras compartilhadas ficam em `.sourcegraph/edite-profissional.rule.md`. Elas orientam o Cody a fazer alterações pequenas, preservar a arquitetura e não reintroduzir Firebase/Firestore.

## Comandos úteis no Cody

Use estes pedidos no chat do Cody:

- `Analise @server.ts e @core/bud/JobEngine.ts. Não altere arquivos. Explique o fluxo do BUD.`
- `Revise somente o arquivo selecionado. Faça a menor correção possível e não mexa na arquitetura.`
- `Procure imports que possam quebrar funções ESM na Vercel. Não corrija ainda; liste os arquivos.`
- `Crie testes para este endpoint sem adicionar Firebase, Firestore ou dependências externas.`
- `Revise este diff como QA. Verifique typecheck, build e compatibilidade com Vercel.`

## Limites

- O Cody não foi adicionado ao bundle da aplicação.
- Nenhuma chave do Cody é armazenada neste repositório.
- Nenhuma rota ou componente de produção depende dele.
- A autenticação externa do Cody é separada da autenticação local do site.
