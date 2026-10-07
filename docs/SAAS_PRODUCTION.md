# Engrenagem AI — base de produto SaaS

Esta base separa interface, servidor, geração, autenticação, planos, publicação e dados.

## Pastas principais

- `src/auth`: login Google, GitHub, e-mail/senha, sessão e rota protegida.
- `server/billing`: catálogo de planos e regras de créditos.
- `core/bud`: orquestração de geração e edição.
- `server/engines`: intenção, geração, QA e reparo.
- `src/components/workspace`: painel do usuário, preview, código, logs e publicação.
- `firestore.rules`: isolamento por usuário e acesso administrativo via custom claim.

## Admin vitalício

Não coloque uma senha de administrador no frontend. O caminho seguro é:

1. Criar a conta do proprietário no Firebase Authentication.
2. Definir custom claim `{ admin: true }` usando um script servidor com Firebase Admin SDK.
3. Configurar `ADMIN_UIDS` no ambiente do backend para rotinas administrativas.
4. Configurar `VITE_ADMIN_EMAILS` somente para exibir o selo visual; autorização real deve usar custom claims no backend e nas regras do Firestore.

## Planos e créditos

O catálogo inicial está em `server/billing/planCatalog.ts`:

- Teste: 5 créditos/dia e 1 site público.
- Creator: 100 créditos/dia e 2 sites públicos.
- Studio: 500 créditos/dia e 10 sites públicos.
- Admin vitalício: reservado ao proprietário, sem limite operacional.

A cobrança deve chamar um provedor externo em modo seguro, e somente o webhook assinado do provedor deve alterar `subscriptions/{uid}`. Nunca libere plano apenas por um preço enviado pelo navegador.

## Próxima ativação de pagamentos

Configure `STRIPE_SECRET_KEY` e `STRIPE_WEBHOOK_SECRET`, crie os Price IDs dos planos e implemente:

- `POST /api/billing/checkout`: cria uma sessão vinculada ao UID autenticado.
- `POST /api/billing/webhook`: valida assinatura, processa `checkout.session.completed`, `invoice.paid` e `customer.subscription.deleted`.
- Atualização de `subscriptions/{uid}` feita somente pelo backend.

## Deploy

`vercel.json`, `netlify.toml` e `README.md` são adicionados a cada projeto gerado. O deploy automático somente deve ser ativado depois de configurar os tokens do provedor e um servidor backend com verificação de identidade.

## APIs gratuitas e créditos

O ledger em `server/billing/apiCreditLedger.ts` desconta consumo por provedor: geração BUD custa 5 créditos, edição BUD custa 1 crédito, e busca de leads Nominatim custa 2 créditos. Lugares Overpass e publicação ficam preparados para integrações futuras.

A busca de leads usa Nominatim para buscas iniciadas diretamente pelo usuário, com cache e no máximo uma requisição por segundo. O mapa usa Leaflet e tiles OpenStreetMap com atribuição visível. Nominatim não deve ser usado como serviço genérico de geocodificação por uma plataforma no-code, nem para uso pesado ou scraping; os tiles OSM também são best-effort e não oferecem SLA. Para um produto comercial com muitos clientes, mantenha o adaptador trocável e migre para um provedor OSM comercial ou uma instância própria antes de escalar.

Referências: [política Nominatim](https://operations.osmfoundation.org/policies/nominatim/), [política de tiles](https://operations.osmfoundation.org/policies/tiles/) e [limites Overpass](https://dev.overpass-api.de/overpass-doc/en/preface/commons.html).

## VisualEngine

O pipeline visual usa três camadas: biblioteca fotográfica verificada para termos comuns, pesquisa semântica na Wikimedia Commons com filtro anti-placeholder e geração sob demanda com Gemini Image no servidor. O modelo padrão é `gemini-3.1-flash-image`; `gemini-2.5-flash-image` pode ser usado via `GEMINI_IMAGE_MODEL` quando necessário. `Veo` é uma API de vídeo, não o caminho certo para hero images; pode ser adicionada depois para vídeos de campanha.

O usuário pode escrever “foto realista”, “render 3D”, “hero visual” ou “imagem de academia” para ativar a geração. A chave fica somente no backend. Sem `GEMINI_API_KEY`, o sistema continua funcionando com fotos reais da biblioteca e busca externa.

## Biblioteca de mídia estilo builder

Na criação inicial, o usuário pode anexar múltiplas imagens, vídeos e áudios pela galeria/arquivos do dispositivo. Os arquivos são preservados no projeto como assets próprios, aparecem no preview em uma seção de mídia e podem ser administrados depois no painel **Biblioteca de mídia** do workspace. Cada arquivo é validado por MIME type e tamanho máximo de 20 MB, sem exposição de caminhos locais do dispositivo.

## Jornada Primeiro Cliente

Contas autenticadas têm a rota `/beginner`, acessível pelo botão **Primeiro cliente**. O coach guia o iniciante em cinco etapas: escolher nicho e região, buscar negócios públicos, conferir o lead no mapa, criar uma prévia comercial e copiar uma mensagem de prospecção. O telefone precisa ser confirmado pelo usuário antes de abrir o WhatsApp; o link é criado com a mensagem editável e o DDD informado.

O sistema usa Nominatim/OpenStreetMap para descoberta pública e abre o mapa correspondente. Ele não raspa nem copia automaticamente dados protegidos do Google Maps. Isso evita violar termos de uso e também reduz o risco de enviar uma mensagem para o contato errado. O iniciante deve confirmar o telefone e usar somente informações públicas e contato comercial permitido.

Esta estrutura é uma base séria para venda e escala; não é uma garantia de faturamento. Antes de cobrar clientes, faça revisão de segurança, LGPD, termos, antifraude, observabilidade, backup e teste de carga.
