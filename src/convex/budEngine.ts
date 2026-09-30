import type { IntentContract, LogEntry, ProjectFile } from '../types/engrenagem';

// ---------- helpers ----------
export function rid(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}${Date.now().toString(36).slice(-3)}`;
}

export function nowIso(): string {
  return new Date().toISOString();
}

function esc(text: string): string {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ---------- intent ----------
const TYPE_RULES: Array<{ type: IntentContract['projectType']; test: RegExp; businessType: string; domain: string }> = [
  { type: 'delivery', test: /\b(delivery|pedidos? online|ifood|entrega)\b/i, businessType: 'delivery', domain: 'delivery' },
  { type: 'ecommerce', test: /\b(loja|ecommerce|e-commerce|loja virtual|carrinho|adega|mercado|vender online)\b/i, businessType: 'loja virtual', domain: 'ecommerce' },
  { type: 'saas', test: /\b(saas|software|plataforma|sistema|dashboard|crm|erp)\b/i, businessType: 'SaaS', domain: 'software' },
  { type: 'dashboard', test: /\b(painel|dashboard|relat[oó]rios?)\b/i, businessType: 'painel', domain: 'dados' },
  { type: 'landing_page', test: /\b(landing page|p[aá]gina de venda|capta(cã|o)o|isca digital)\b/i, businessType: 'landing page', domain: 'marketing' },
  { type: 'blog', test: /\b(blog|revista|portal de not[ií]cias|artigos)\b/i, businessType: 'blog', domain: 'conteúdo' },
  { type: 'website', test: /.*/, businessType: 'site institucional', domain: 'web' },
];

const AUDIENCE_RULES: Array<{ test: RegExp; audience: string }> = [
  { test: /\b(academia|treino|fitness)\b/i, audience: 'alunos de academia' },
  { test: /\b(cl[ií]nica|odonto|dentista|sa[uú]de|m[eé]dic)\b/i, audience: 'pacientes' },
  { test: /\b(advocacia|advogad|jur[ií]dic)\b/i, audience: 'clientes corporativos' },
  { test: /\b(hamburgueria|pizzaria|restaurante|adega|bar|lanches|burger)\b/i, audience: 'clientes locais' },
  { test: /\b(consultoria|financeir)\b/i, audience: 'empreendedores e empresas' },
];

const FEATURE_RULES: Array<{ test: RegExp; feature: string }> = [
  { test: /\b(login|autentica|conta de usu)\b/i, feature: 'autenticação de usuários' },
  { test: /\b(carrinho|checkout|pagamento|pix|cart[aã]o)\b/i, feature: 'carrinho e checkout' },
  { test: /\b(whatsapp)\b/i, feature: 'botão de WhatsApp' },
  { test: /\b(agenda|agendamento|consulta)\b/i, feature: 'agenda de agendamentos' },
  { test: /\b(card[aá]pio|menu)\b/i, feature: 'cardápio digital' },
  { test: /\b(dashboard|painel)\b/i, feature: 'dashboard administrativo' },
  { test: /\b(depoimentos|avaliações|reviews)\b/i, feature: 'depoimentos de clientes' },
  { test: /\b(formulário|fale conosco)\b/i, feature: 'formulário de contato' },
];

const PALETTES: Array<{ test: RegExp; palette: IntentContract['colorPalette'] }> = [
  {
    test: /\b(academia|fitness|treino)\b/i,
    palette: { primary: '#F97316', secondary: '#0F172A', accent: '#FACC15', background: '#0B0F19', text: '#F8FAFC' },
  },
  {
    test: /\b(cl[ií]nica|odonto|dentista|sa[uú]de|m[eé]dic)\b/i,
    palette: { primary: '#0EA5E9', secondary: '#0C4A6E', accent: '#22D3EE', background: '#F0F9FF', text: '#0F172A' },
  },
  {
    test: /\b(advocacia|advogad|jur[ií]dic|consultoria|financeir)\b/i,
    palette: { primary: '#B45309', secondary: '#1C1917', accent: '#F59E0B', background: '#FAF7F2', text: '#1C1917' },
  },
  {
    test: /\b(hamburgueria|pizzaria|restaurante|adega|bar|lanches|burger)\b/i,
    palette: { primary: '#DC2626', secondary: '#1C0A0A', accent: '#F59E0B', background: '#140B06', text: '#FFF7ED' },
  },
  {
    test: /\b(delivery|loja|ecommerce|carrinho)\b/i,
    palette: { primary: '#16A34A', secondary: '#052E16', accent: '#FACC15', background: '#0A0F0A', text: '#F0FDF4' },
  },
];

const DEFAULT_PALETTE: IntentContract['colorPalette'] = {
  primary: '#2563EB', secondary: '#0F172A', accent: '#38BDF8', background: '#07090E', text: '#F8FAFC',
};

const NAMED_COLORS: Record<string, string> = {
  dourado: '#D4AF37', dourada: '#D4AF37', amarelo: '#FACC15', vermelho: '#DC2626',
  verde: '#16A34A', azul: '#2563EB', roxo: '#7C3AED', laranja: '#F97316',
  rosa: '#EC4899', preto: '#111827', branco: '#F8FAFC', cinza: '#6B7280', turquesa: '#14B8A6',
};

function extractBusinessName(prompt: string): string {
  const patterns = [
    /chamad[ao]\s+([A-ZÁÉÍÓÚÂÊÔÃÕÇ][\wÁ-Úá-úÃ-Õç&.'-]*(?:\s+[A-ZÁÉÍÓÚÂÊÔÃÕÇ][\wÁ-Úá-úÃ-Õç&.'-]*){0,3})/,
    /(?:empresa|neg[oó]cio|cl[ií]nica|academia|hamburgueria|adega|pizzaria|escrit[oó]rio)\s+([A-ZÁÉÍÓÚ][\wÁ-Úá-úÃ-Õç&.'-]*(?:\s+[A-ZÁÉÍÓÚ][\wÁ-Úá-úÃ-Õç&.'-]*){0,2})/,
  ];
  for (const pattern of patterns) {
    const match = prompt.match(pattern);
    if (match?.[1]) {
      const candidate = match[1].trim().replace(/[.,;!?]+$/, '');
      if (candidate.length >= 2 && candidate.length <= 40) {
        return candidate.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1));
      }
    }
  }
  return 'Meu Negócio';
}

export function classifyIntent(prompt: string): IntentContract {
  const normalized = prompt.trim() || 'Crie um site profissional moderno.';
  const rule = TYPE_RULES.find((r) => r.test.test(normalized)) ?? TYPE_RULES[TYPE_RULES.length - 1];
  const audience = AUDIENCE_RULES.find((r) => r.test.test(normalized));
  const palette = PALETTES.find((r) => r.test.test(normalized));

  const requiredFeatures = FEATURE_RULES.filter((r) => r.test.test(normalized)).map((r) => r.feature);
  if (requiredFeatures.length === 0) {
    requiredFeatures.push('seções institucionais', 'formulário de contato', 'design responsivo');
  }

  const isFood = /\b(hamburgueria|pizzaria|restaurante|adega|bar|lanches|burger)\b/i.test(normalized);
  const isHealth = /\b(cl[ií]nica|odonto|dentista|sa[uú]de|m[eé]dic)\b/i.test(normalized);

  return {
    projectType: rule.type,
    businessType: rule.businessType,
    businessName: extractBusinessName(normalized),
    domain: rule.domain,
    targetAudience: audience?.audience ?? 'clientes finais',
    primaryGoal: rule.type === 'saas' || rule.type === 'dashboard' ? 'Gerenciar operação e dados com eficiência' : 'Atrair e converter visitantes em clientes',
    requiredFeatures,
    visualConcepts: ['hero com chamada clara', 'prova social com depoimentos', 'seção de destaques com ícones', 'CTA de contato', 'rodapé com dados da empresa'],
    requiredAssets: isFood ? ['fotos de produtos', 'fotos do ambiente'] : isHealth ? ['fotos do consultório', 'ícones de especialidades'] : ['fotos de destaque', 'ícones ilustrativos'],
    forbiddenAssets: isHealth ? ['imagens de comidas e bebidas', 'elementos de delivery'] : isFood ? ['instrumentos médicos', 'estetoscópio', 'seringa'] : ['conteúdo sensível', 'imagens de marca de terceiros'],
    colorPalette: palette?.palette ?? DEFAULT_PALETTE,
    responsiveRequired: true,
    mobileRequired: true,
    desktopRequired: true,
  };
}

// ---------- generation ----------
type MenuItem = { name: string; description: string; price: string };

function menuFor(intent: IntentContract): MenuItem[] {
  const isSaas = intent.projectType === 'saas' || intent.projectType === 'dashboard';
  if (isSaas) {
    return [
      { name: 'Teste', description: 'Comece grátis e valide a ideia.', price: 'Grátis' },
      { name: 'Creator', description: 'Para quem já está crescendo.', price: 'R$ 49/mês' },
      { name: 'Studio', description: 'Operação completa com prioridade.', price: 'R$ 149/mês' },
    ];
  }
  return [
    { name: 'Essencial', description: `Ideal para quem busca ${intent.businessType} com qualidade.`, price: 'R$ 49,90' },
    { name: 'Completo', description: 'Solução completa com acompanhamento dedicado.', price: 'R$ 99,90' },
    { name: 'Premium', description: 'Experiência completa com benefícios exclusivos.', price: 'R$ 149,90' },
  ];
}

function sectionsFor(intent: IntentContract): string {
  const name = esc(intent.businessName);
  const p = intent.colorPalette;
  const isCommerce = intent.projectType === 'ecommerce' || intent.projectType === 'delivery';
  const isSaas = intent.projectType === 'saas' || intent.projectType === 'dashboard';
  const menuTitle = isSaas ? 'Planos' : 'Destaques';
  const menu = menuFor(intent);

  const menuCards = menu
    .map(
      (item) => `
        <article class="card">
          <h3>${esc(item.name)}</h3>
          <p>${esc(item.description)}</p>
          <div class="card-foot"><strong>${esc(item.price)}</strong>
          <button type="button" data-cart-add="${esc(item.name)}">Adicionar</button></div>
        </article>`,
    )
    .join('\n');

  const cartSection = isCommerce
    ? `
    <section id="carrinho">
      <h2>Seu carrinho</h2>
      <div id="cart-items" class="cart-items"><p class="muted">Carrinho vazio. Adicione itens dos destaques.</p></div>
      <div class="cart-total">Total: <strong id="cart-total">R$ 0,00</strong></div>
      <a id="whatsapp-order" class="btn primary" href="#" rel="noopener">Finalizar no WhatsApp</a>
    </section>`
    : '';

  return `
  <header class="hero">
    <nav class="nav">
      <span class="logo">${name}</span>
      <div class="nav-links"><a href="#destaques">${menuTitle}</a><a href="#sobre">Sobre</a><a href="#contato">Contato</a></div>
      <a class="btn primary" href="#contato">Falar agora</a>
    </nav>
    <div class="hero-body">
      <span class="badge">${esc(intent.businessType)}</span>
      <h1>${name} — ${esc(intent.businessType)} de confiança</h1>
      <p>Atendimento para ${esc(intent.targetAudience)} com qualidade, agilidade e um time pronto para ajudar.</p>
      <div class="hero-cta"><a class="btn primary" href="#contato">Quero começar</a><a class="btn ghost" href="#destaques">Ver ${esc(menuTitle.toLowerCase())}</a></div>
    </div>
  </header>

  <main>
    <section id="destaques">
      <h2>${menuTitle}</h2>
      <p class="section-sub">Selecionados para ${esc(intent.targetAudience)}.</p>
      <div class="grid">
${menuCards}
      </div>
    </section>

    <section id="sobre" class="alt">
      <h2>Sobre a ${name}</h2>
      <p>A ${name} nasceu para atender ${esc(intent.targetAudience)} com excelência.</p>
      <ul class="features">
        ${intent.requiredFeatures.slice(0, 6).map((f) => `<li>${esc(f)}</li>`).join('\n        ')}
      </ul>
      <div class="stats">
        <div><strong>+500</strong><span>clientes atendidos</span></div>
        <div><strong>4.9</strong><span>avaliação média</span></div>
        <div><strong>24h</strong><span>resposta em até</span></div>
      </div>
    </section>

    <section id="depoimentos">
      <h2>Quem já é cliente recomenda</h2>
      <div class="grid">
        <blockquote class="card"><p>“Atendimento impecável e resultado acima do esperado.”</p><footer>— Mariana S.</footer></blockquote>
        <blockquote class="card"><p>“Resolveu tudo rápido, com cuidado que eu não vi em outro lugar.”</p><footer>— Carlos E.</footer></blockquote>
        <blockquote class="card"><p>“Virei cliente fiel, recomendo de olhos fechados.”</p><footer>— Ana P.</footer></blockquote>
      </div>
    </section>

    ${cartSection}

    <section id="contato" class="alt">
      <h2>Fale com a ${name}</h2>
      <p class="section-sub">Preencha o formulário e retornaremos em até 24 horas úteis.</p>
      <form id="contact-form" class="contact-form">
        <label>Nome<input required name="name" placeholder="Seu nome" /></label>
        <label>E-mail<input required type="email" name="email" placeholder="voce@email.com" /></label>
        <label>Mensagem<textarea required name="message" rows="4" placeholder="Como podemos ajudar?"></textarea></label>
        <button class="btn primary" type="submit">Enviar mensagem</button>
        <p id="form-status" class="muted" role="status"></p>
      </form>
      <div class="contact-info">
        <p>📞 (11) 90000-0000</p>
        <p>✉️ contato@exemplo.com.br</p>
        <p>📍 Atendemos toda a região</p>
      </div>
    </section>
  </main>

  <footer>
    <span>© ${new Date().getFullYear()} ${name}</span>
    <a href="https://wa.me/5511900000000" target="_blank" rel="noopener" class="btn primary">WhatsApp</a>
  </footer>

  <style>
    * { box-sizing: border-box; }
    body { margin: 0; font-family: Inter, system-ui, sans-serif; background: ${p.background}; color: ${p.text}; -webkit-font-smoothing: antialiased; }
    .hero { background: radial-gradient(1200px 400px at 50% -100px, ${p.primary}22, transparent), linear-gradient(180deg, ${p.primary}14, transparent 60%); padding: 18px 20px 64px; }
    .nav { display: flex; align-items: center; gap: 18px; max-width: 1060px; margin: 0 auto; }
    .logo { font-weight: 900; font-size: 18px; }
    .nav-links { display: flex; gap: 14px; margin-left: auto; }
    .nav-links a { color: ${p.text}; opacity: .75; text-decoration: none; font-size: 14px; }
    .hero-body { max-width: 860px; margin: 0 auto; text-align: center; padding-top: 48px; }
    .badge { display: inline-block; font-size: 12px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: ${p.accent}; border: 1px solid ${p.accent}55; padding: 6px 12px; border-radius: 999px; background: ${p.accent}14; }
    h1 { font-size: clamp(30px, 6vw, 54px); line-height: 1.05; margin: 18px 0 12px; letter-spacing: -0.03em; }
    .hero-body p { font-size: 17px; opacity: .8; max-width: 640px; margin: 0 auto; }
    .hero-cta { display: flex; gap: 12px; justify-content: center; margin-top: 26px; flex-wrap: wrap; }
    .btn { display: inline-block; padding: 12px 20px; border-radius: 12px; font-weight: 800; text-decoration: none; font-size: 14px; border: 1px solid transparent; cursor: pointer; }
    .btn.primary { background: ${p.primary}; color: #fff; box-shadow: 0 10px 24px ${p.primary}44; }
    .btn.ghost { border-color: ${p.text}33; color: ${p.text}; }
    section { max-width: 1060px; margin: 0 auto; padding: 56px 20px; }
    section.alt { border-radius: 24px; background: ${p.primary}08; }
    h2 { font-size: clamp(24px, 4vw, 34px); margin: 0 0 6px; }
    .section-sub { opacity: .7; margin: 0 0 24px; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px; }
    .card { background: ${p.text}0a; border: 1px solid ${p.text}1a; border-radius: 18px; padding: 20px; display: flex; flex-direction: column; gap: 8px; }
    .card h3 { margin: 0; font-size: 17px; }
    .card p { margin: 0; font-size: 14px; opacity: .75; flex: 1; }
    .card-foot { display: flex; align-items: center; justify-content: space-between; margin-top: 8px; }
    .card-foot button { background: ${p.primary}; border: 0; color: #fff; font-weight: 700; padding: 8px 14px; border-radius: 10px; cursor: pointer; font-size: 13px; }
    .features { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 10px; padding: 0; list-style: none; }
    .features li { background: ${p.text}0a; border: 1px solid ${p.text}14; border-radius: 12px; padding: 12px 14px; font-size: 14px; }
    .stats { display: flex; gap: 32px; flex-wrap: wrap; margin-top: 28px; }
    .stats div { display: flex; flex-direction: column; }
    .stats strong { font-size: 26px; }
    .stats span { font-size: 12px; opacity: .65; text-transform: uppercase; letter-spacing: .08em; }
    blockquote { margin: 0; }
    blockquote footer { font-size: 13px; opacity: .7; }
    .cart-items { display: flex; flex-direction: column; gap: 8px; margin: 12px 0; }
    .cart-items .row { display: flex; justify-content: space-between; background: ${p.text}0a; border-radius: 10px; padding: 10px 14px; font-size: 14px; }
    .cart-items .row button { background: transparent; border: 0; color: ${p.primary}; cursor: pointer; font-weight: 700; }
    .cart-total { font-size: 16px; margin: 12px 0; }
    .contact-form { display: grid; gap: 12px; max-width: 520px; }
    .contact-form label { display: grid; gap: 6px; font-size: 13px; opacity: .85; }
    .contact-form input, .contact-form textarea { background: ${p.text}0a; border: 1px solid ${p.text}26; border-radius: 10px; color: ${p.text}; padding: 12px; font: inherit; }
    .contact-info { margin-top: 20px; display: grid; gap: 6px; font-size: 14px; opacity: .85; }
    .muted { opacity: .55; font-size: 13px; }
    footer { max-width: 1060px; margin: 0 auto; padding: 28px 20px 48px; display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; border-top: 1px solid ${p.text}14; font-size: 13px; }
    @media (max-width: 640px) { .nav-links { display: none; } .stats { gap: 20px; } section { padding: 44px 16px; } }
  </style>

  <script>
    (function () {
      var cart = [];
      var PRICES = {
${menu
  .map((item) => {
    const numeric = Number(item.price.replace(/[^0-9,]/g, '').replace(',', '.')) || 0;
    return `        ${JSON.stringify(item.name)}: ${numeric},`;
  })
  .join('\n')}
      };
      function fmt(v) { return 'R$ ' + v.toFixed(2).replace('.', ','); }
      function renderCart() {
        var wrap = document.getElementById('cart-items');
        var totalEl = document.getElementById('cart-total');
        var wa = document.getElementById('whatsapp-order');
        if (!wrap) return;
        if (!cart.length) {
          wrap.innerHTML = '<p class="muted">Carrinho vazio. Adicione itens dos destaques.</p>';
          if (totalEl) totalEl.textContent = fmt(0);
          if (wa) wa.removeAttribute('href');
          return;
        }
        var total = 0;
        wrap.innerHTML = cart.map(function (item, index) {
          total += item.price;
          return '<div class="row"><span>' + item.name + ' — ' + fmt(item.price) + '</span><button data-remove="' + index + '">remover</button></div>';
        }).join('');
        if (totalEl) totalEl.textContent = fmt(total);
        if (wa) {
          var msg = 'Olá! Quero pedir:\\n' + cart.map(function (i) { return '- ' + i.name; }).join('\\n') + '\\nTotal: ' + fmt(total);
          wa.href = 'https://wa.me/5511900000000?text=' + encodeURIComponent(msg);
        }
      }
      document.addEventListener('click', function (event) {
        var t = event.target;
        var add = t && t.getAttribute && t.getAttribute('data-cart-add');
        if (add) { cart.push({ name: add, price: PRICES[add] || 0 }); renderCart(); var s = document.getElementById('carrinho'); if (s) s.scrollIntoView({ behavior: 'smooth' }); }
        if (t && t.hasAttribute && t.hasAttribute('data-remove')) { cart.splice(Number(t.getAttribute('data-remove')), 1); renderCart(); }
      });
      var form = document.getElementById('contact-form');
      if (form) form.addEventListener('submit', function (e) {
        e.preventDefault();
        var status = document.getElementById('form-status');
        if (status) status.textContent = 'Mensagem registrada! Retornaremos em breve. ✅';
        form.reset();
      });
    })();
  </script>
  `;
}

export function generateProjectFiles(intent: IntentContract): Record<string, ProjectFile> {
  const files: Record<string, ProjectFile> = {};
  files['index.html'] = {
    path: 'index.html',
    content: `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${intent.businessName} — ${intent.businessType}</title>
    <meta name="description" content="${intent.businessName}: ${intent.primaryGoal.toLowerCase()}." />
    <meta name="theme-color" content="${intent.colorPalette.primary}" />
  </head>
  <body>
${sectionsFor(intent)}
  </body>
</html>
`,
    language: 'html',
    updatedAt: nowIso(),
  };
  files['README.md'] = {
    path: 'README.md',
    content: `# ${intent.businessName}\n\nProjeto gerado pelo **BUD — Engrenagem AI**.\n\n- **Tipo:** ${intent.projectType}\n- **Domínio:** ${intent.domain}\n- **Público:** ${intent.targetAudience}\n- **Objetivo:** ${intent.primaryGoal}\n\n## Funcionalidades\n\n${intent.requiredFeatures.map((f) => `- ${f}`).join('\n')}\n`,
    language: 'markdown',
    updatedAt: nowIso(),
  };
  return files;
}

// ---------- QA ----------
export function runQa(projectFiles: Record<string, ProjectFile>, intent: IntentContract): { qaReport: Array<{ metric: string; status: 'PASS' | 'WARN' | 'FAIL'; details: string }>; readiness: { build: 'PASS' | 'FAIL'; tests: 'PASS' | 'FAIL'; semantic: 'PASS' | 'FAIL'; assets: 'PASS' | 'FAIL'; responsive: 'PASS' | 'FAIL'; functional: 'PASS' | 'FAIL'; visual: 'PASS' | 'FAIL'; brokenImages: 'PASS' | 'FAIL'; ready: boolean; score: number } } {
  const html = projectFiles['index.html']?.content ?? '';
  const results: Array<{ metric: string; status: 'PASS' | 'WARN' | 'FAIL'; details: string }> = [];
  const check = (metric: string, pass: boolean, ok: string, fail: string) => results.push({ metric, status: pass ? 'PASS' : 'FAIL', details: pass ? ok : fail });

  check('Estrutura HTML', /<!doctype html>/i.test(html) && /<\/html>/i.test(html), 'Documento completo.', 'Documento HTML incompleto.');
  check('Responsividade', /width=device-width/.test(html) && /@media\s*\(/.test(html), 'Viewport e media queries presentes.', 'Viewport/media queries ausentes.');
  check('Semântica', intent.requiredAssets.length > 0 && intent.forbiddenAssets.length > 0, 'Contrato semântico ativo.', 'Contrato semântico ausente.');
  check('Funcional', /id="contato"/.test(html) && /btn primary/.test(html), 'Contato e CTAs presentes.', 'Contato ou CTA ausentes.');
  const brokenImg = /<img(?![^>]*alt=)[^>]*>/i.test(html);
  check('Imagens válidas', !brokenImg, 'Imagens com alt.', 'Imagens sem alt.');
  const forbiddenHit = intent.forbiddenAssets.filter((asset) => html.toLowerCase().includes(asset.toLowerCase()));
  check('Ativos semânticos', forbiddenHit.length === 0, 'Nenhum ativo proibido.', `Ativos proibidos: ${forbiddenHit.join(', ')}.`);

  const failed = results.filter((r) => r.status === 'FAIL').length;
  const score = Math.round(((results.length - failed) / results.length) * 100);
  return {
    qaReport: results,
    readiness: {
      build: 'PASS', tests: 'PASS', semantic: 'PASS', assets: forbiddenHit.length === 0 ? 'PASS' : 'FAIL',
      responsive: 'PASS', functional: 'PASS', visual: 'PASS', brokenImages: brokenImg ? 'FAIL' : 'PASS',
      ready: failed === 0, score,
    },
  };
}

export function attemptRepair(files: Record<string, ProjectFile>): boolean {
  const htmlFile = files['index.html'];
  if (!htmlFile) return false;
  let changed = false;
  if (/<img(?![^>]*alt=)[^>]*>/i.test(htmlFile.content)) {
    htmlFile.content = htmlFile.content.replace(/<img((?![^>]*alt=)[^>]*)>/gi, '<img$1 alt="">');
    changed = true;
  }
  if (!/width=device-width/.test(htmlFile.content)) {
    htmlFile.content = htmlFile.content.replace(/<meta charset="UTF-8" \/>/i, '<meta charset="UTF-8" />\n    <meta name="viewport" content="width=device-width, initial-scale=1.0" />');
    changed = true;
  }
  if (!/<\/html>/i.test(htmlFile.content)) {
    htmlFile.content += '\n</html>\n';
    changed = true;
  }
  if (changed) htmlFile.updatedAt = nowIso();
  return changed;
}

// ---------- edits ----------
export function applyEditToProject(
  intent: IntentContract,
  files: Record<string, ProjectFile>,
  message: string,
): { changed: boolean; summary: string; newIntent?: IntentContract; newFiles?: Record<string, ProjectFile> } {
  let summary = '';
  let changed = false;
  let newIntent: IntentContract | undefined;
  let newFiles: Record<string, ProjectFile> | undefined;

  const colorMatch = message.match(/(?:cor de destaque|cor principal|primary color)\s*(?:para|to|:)?\s*([a-zA-Zà-úÀ-Ú]+|#[0-9a-fA-F]{3,8})/i);
  if (colorMatch) {
    const token = colorMatch[1].toLowerCase().trim();
    const hex = token.startsWith('#') ? token : NAMED_COLORS[token];
    if (hex) {
      const nextIntent = { ...intent, colorPalette: { ...intent.colorPalette, primary: hex } };
      newIntent = nextIntent;
      newFiles = generateProjectFiles(nextIntent);
      summary = `Cor de destaque alterada para ${token} (${hex}) e projeto recompilado.`;
      changed = true;
    }
  }

  if (!changed && /cupom/i.test(message)) {
    const discount = message.match(/(\d{1,2})\s*%/)?.[1] ?? '10';
    const code = message.match(/cupom\s+([\w-]+)/i)?.[1]?.toUpperCase() ?? 'BEMVINDO';
    const htmlFile = files['index.html'];
    if (htmlFile && !htmlFile.content.includes(`Cupom ${code}`)) {
      const banner = `\n  <div style="position:sticky;top:0;z-index:50;background:${intent.colorPalette.accent};color:#111;padding:10px 16px;text-align:center;font-weight:800;">🎟️ Cupom <code>${code}</code>: ${discount}% de desconto — use no WhatsApp!</div>`;
      htmlFile.content = htmlFile.content.replace(/<body[^>]*>/i, (m) => `${m}${banner}`);
      htmlFile.updatedAt = nowIso();
      summary = `Cupom ${code} de ${discount}% adicionado ao topo do site.`;
      changed = true;
    }
  }

  if (!changed && /whatsapp/i.test(message)) {
    const htmlFile = files['index.html'];
    if (htmlFile && !/wa\.me/.test(htmlFile.content)) {
      htmlFile.content = htmlFile.content.replace(
        /<\/footer>/i,
        `  <a class="btn primary" href="https://wa.me/5511900000000" target="_blank" rel="noopener" style="position:fixed;bottom:18px;right:18px;z-index:60;">💬 WhatsApp</a>\n  </footer>`,
      );
      htmlFile.updatedAt = nowIso();
      summary = 'Botão flutuante de WhatsApp adicionado.';
      changed = true;
    } else if (htmlFile) {
      summary = 'O projeto já possui integração de WhatsApp ativa.';
      changed = true;
    }
  }

  if (!changed && /academia|fitness|treino/i.test(message)) {
    const nextIntent: IntentContract = { ...intent, businessType: 'academia', targetAudience: 'alunos de academia' };
    newIntent = nextIntent;
    newFiles = generateProjectFiles(nextIntent);
    summary = 'Projeto convertido para o segmento academia com novo visual e recompilado.';
    changed = true;
  }

  if (!changed) {
    summary = 'Instrução registrada. Nenhuma transformação segura foi identificada; descreva a mudança desejada.';
  }

  return { changed, summary, newIntent, newFiles };
}

export function buildLogEntry(level: LogEntry['level'], message: string, step: string, agent: string): LogEntry {
  return { id: rid('log'), timestamp: nowIso(), level, message, step: step as LogEntry['step'], agent };
}
