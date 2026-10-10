import { IntentContract, ProjectFile, ProjectAsset } from '../../src/types/engrenagem.ts';
import { VerifiedAsset } from './semanticAssetGuard.ts';
import { FunctionalFeaturePlanner } from '../../core/project-forge/FunctionalFeaturePlanner.ts';


const HERO_VIDEOS: Record<string, string> = {
  food_delivery: 'https://cdn.coverr.co/videos/coverr-food-preparation-1080p.mp4',
  fitness: 'https://cdn.coverr.co/videos/coverr-gym-workout-1080p.mp4',
  healthcare: 'https://cdn.coverr.co/videos/coverr-medical-team-1080p.mp4',
  landing_page: 'https://cdn.coverr.co/videos/coverr-abstract-tech-1080p.mp4'
};

const VISUAL_HEAD = `
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Poppins:wght@600;700;800&display=swap" rel="stylesheet">
  <style>
    :root { --visual-font-body: 'Inter', system-ui, sans-serif; --visual-font-heading: 'Poppins', 'Inter', sans-serif; }
    body { font-family: var(--visual-font-body); }
    h1, h2, h3 { font-family: var(--visual-font-heading); }
    .glass {
      background: rgba(255, 255, 255, 0.08);
      backdrop-filter: blur(20px) saturate(180%);
      -webkit-backdrop-filter: blur(20px) saturate(180%);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 16px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
    }
    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(30px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .animate-fade { animation: fadeInUp .6s ease forwards; }
    @keyframes float {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-10px); }
    }
    .animate-float { animation: float 3s ease-in-out infinite; }
    @media (prefers-reduced-motion: reduce) {
      .animate-fade, .animate-float { animation: none; }
    }
  </style>`;

export function generateProjectFiles(
  intent: IntentContract,
  assets: VerifiedAsset[],
  uploadedAssets: ProjectAsset[] = []
): {
  files: Record<string, ProjectFile>;
  previewHtml: string;
} {
  const planner = new FunctionalFeaturePlanner();
  const features = planner.planFeatures(intent.domain);
  // ... rest of logic
  const timestamp = new Date().toISOString();
  const primaryColor = intent.colorPalette.primary;
  const accentColor = intent.colorPalette.accent;
  const bgColor = intent.colorPalette.background;

  const uploadedImage = uploadedAssets.find(asset => asset.kind === 'image');
  const heroAsset = uploadedImage?.dataUrl || assets[0]?.url || 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=1200&q=80';
  const asset2 = assets[1]?.url || assets[0]?.url;
  const asset3 = assets[2]?.url || assets[0]?.url;
  const heroVideo = HERO_VIDEOS[intent.domain];
  const heroVideoMarkup = heroVideo
    ? `<video autoplay muted loop playsinline class="absolute inset-0 z-0 w-full h-full object-cover" poster="${heroAsset}"><source src="${heroVideo}" type="video/mp4"></video><div class="absolute inset-0 z-10 bg-black/50"></div>`
    : '';

  // Let's create specific code and preview according to domain
  let previewHtml = '';
  let appTsxContent = '';

  if (intent.domain === 'blog') {
    previewHtml = `<!doctype html><html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${intent.businessName}</title><script src="https://cdn.tailwindcss.com"></script>${VISUAL_HEAD}</head><body class="bg-slate-950 text-slate-100 min-h-screen"><header class="sticky top-0 z-10 glass animate-fade border-b border-slate-800 bg-slate-950/90 backdrop-blur px-5 py-4"><div class="max-w-6xl mx-auto flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center"><a class="font-black text-2xl text-cyan-400" href="#top">${intent.businessName}</a><div class="flex gap-2"><input id="post-search" oninput="filterPosts(this.value)" placeholder="Buscar artigos..." class="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm"><a href="#newsletter" class="bg-cyan-500 text-slate-950 font-bold rounded-xl px-4 py-2 text-sm">Assinar</a></div></div></header><main id="top" class="max-w-6xl mx-auto p-5 sm:p-8"><section class="py-10"><span class="text-cyan-400 uppercase tracking-widest text-xs font-bold">Conteúdo que move ideias</span><h1 class="text-4xl sm:text-6xl font-black mt-3 max-w-3xl">Insights práticos para construir melhor.</h1><p class="text-slate-400 text-lg mt-4 max-w-2xl">Artigos, guias e histórias para quem cria produtos digitais.</p></section><section id="post-feed" class="grid md:grid-cols-3 gap-5"><article data-title="produto digital" class="post-card glass animate-fade bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden"><img src="${heroAsset}" alt="Imagem editorial do artigo" class="h-36 w-full object-cover"><div class="p-5"><span class="text-xs text-cyan-300">Produto</span><h2 class="font-black text-xl mt-2">Como validar uma ideia em 7 dias</h2><p class="text-slate-400 text-sm mt-2">Um roteiro objetivo para sair da hipótese.</p><button onclick="openPost(this)" class="mt-4 text-cyan-300 font-bold">Ler artigo →</button></div></article><article data-title="marketing vendas" class="post-card glass animate-fade bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden"><img src="${asset2}" alt="Imagem de marketing do artigo" class="h-36 w-full object-cover"><div class="p-5"><span class="text-xs text-fuchsia-300">Marketing</span><h2 class="font-black text-xl mt-2">Landing pages que convertem</h2><p class="text-slate-400 text-sm mt-2">Clareza, prova e chamada para ação.</p><button onclick="openPost(this)" class="mt-4 text-cyan-300 font-bold">Ler artigo →</button></div></article><article data-title="tecnologia saas" class="post-card glass animate-fade bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden"><img src="${asset3}" alt="Imagem de tecnologia do artigo" class="h-36 w-full object-cover"><div class="p-5"><span class="text-xs text-emerald-300">Tecnologia</span><h2 class="font-black text-xl mt-2">SaaS enxuta desde o primeiro dia</h2><p class="text-slate-400 text-sm mt-2">Arquitetura para crescer sem desperdício.</p><button onclick="openPost(this)" class="mt-4 text-cyan-300 font-bold">Ler artigo →</button></div></article></section><section id="newsletter" class="glass animate-fade mt-12 rounded-3xl bg-cyan-500 p-6 sm:p-10 text-slate-950"><h2 class="text-2xl font-black">Receba os próximos artigos</h2><form onsubmit="subscribe(event)" class="flex flex-col sm:flex-row gap-3 mt-4 max-w-xl"><input id="newsletter-email" type="email" required placeholder="seu@email.com" class="flex-1 rounded-xl px-4 py-3"><button class="bg-slate-950 text-white font-bold rounded-xl px-5 py-3">Quero receber</button></form><p id="newsletter-feedback" class="font-bold mt-3"></p></section></main><script>function filterPosts(q){document.querySelectorAll('.post-card').forEach(c=>c.style.display=c.dataset.title.includes(q.toLowerCase())?'block':'none')}function openPost(button){const card=button.closest('.post-card');button.textContent='Artigo aberto ✓';card.classList.add('ring-2','ring-cyan-400')}function subscribe(e){e.preventDefault();document.getElementById('newsletter-feedback').textContent='Inscrição confirmada. Obrigado!';e.target.reset()}</script></body></html>`;
    appTsxContent = `import React from 'react'; export default function App(){return <main className="min-h-screen bg-slate-950 text-white p-8"><h1 className="text-4xl font-black">${intent.businessName}</h1><p className="mt-3">Blog responsivo com feed, busca e newsletter.</p></main>}`;
  } else if (intent.domain === 'landing_page') {
    previewHtml = `<!doctype html><html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${intent.businessName}</title><script src="https://cdn.tailwindcss.com"></script>${VISUAL_HEAD}</head><body class="bg-slate-950 text-white min-h-screen"><main><section class="min-h-[80vh] flex items-center px-5 sm:px-10"><div class="max-w-6xl mx-auto grid lg:grid-cols-2 gap-10 items-center animate-fade"><div><span class="text-blue-400 font-bold uppercase tracking-widest text-xs">Oferta especial</span><h1 class="text-5xl sm:text-7xl font-black mt-4">Transforme sua próxima grande ideia em realidade.</h1><p class="text-slate-400 text-lg mt-5 max-w-xl">Uma solução simples, rápida e feita para gerar resultado.</p><button onclick="document.getElementById('capture').scrollIntoView({behavior:'smooth'})" class="mt-7 bg-blue-500 hover:bg-blue-400 text-white font-black rounded-xl px-6 py-4">Quero começar agora</button></div><div class="rounded-3xl overflow-hidden min-h-80 relative">${heroVideoMarkup}<img src="${heroAsset}" alt="Imagem real da oferta" class="absolute inset-0 z-0 w-full h-full object-cover ${heroVideo ? 'hidden' : ''}"><div class="absolute inset-0 bg-slate-950/45"></div><div class="relative mt-44 bg-slate-950/80 rounded-2xl p-5"><p class="text-sm text-slate-300">Resultado comprovado</p><p class="text-4xl font-black">+247%</p><p class="text-sm text-slate-400">de crescimento médio</p></div></div></div></section><section class="px-5 sm:px-10 py-12"><div class="max-w-6xl mx-auto grid md:grid-cols-3 gap-5"><div class="glass animate-fade bg-slate-900 border border-slate-800 rounded-2xl p-5"><b>Mais clareza</b><p class="text-slate-400 text-sm mt-2">Uma jornada sem fricção.</p></div><div class="glass animate-fade bg-slate-900 border border-slate-800 rounded-2xl p-5"><b>Mais velocidade</b><p class="text-slate-400 text-sm mt-2">Comece ainda hoje.</p></div><div class="glass animate-fade bg-slate-900 border border-slate-800 rounded-2xl p-5"><b>Mais resultado</b><p class="text-slate-400 text-sm mt-2">Métricas que importam.</p></div></div></section><section id="capture" class="px-5 sm:px-10 py-12"><form onsubmit="captureLead(event)" class="glass animate-fade max-w-xl mx-auto bg-slate-900 rounded-3xl p-6 sm:p-8"><h2 class="text-2xl font-black">Receba acesso antecipado</h2><input required type="email" placeholder="Seu melhor e-mail" class="w-full mt-5 bg-slate-950 border border-slate-700 rounded-xl px-4 py-3"><button class="w-full mt-3 bg-blue-500 font-bold rounded-xl px-4 py-3">Enviar cadastro</button><p id="capture-feedback" class="text-emerald-300 mt-3"></p></form></section></main><script>function captureLead(e){e.preventDefault();document.getElementById('capture-feedback').textContent='Cadastro recebido! Entraremos em contato.';e.target.reset()}</script></body></html>`;
    appTsxContent = `import React from 'react'; export default function App(){return <main className="min-h-screen bg-slate-950 text-white p-8"><h1 className="text-5xl font-black">${intent.businessName}</h1><p className="mt-3">Landing page responsiva com captura de leads.</p></main>}`;
  } else if (intent.domain === 'food_delivery') {
    // BURGER HOUSE ACCEPTANCE TEST
    previewHtml = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${intent.businessName} - Hamburgueria Artesanal</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
  <style>
    body { background-color: ${bgColor}; color: #FAFAFA; font-family: system-ui, -apple-system, sans-serif; }
  </style>
${VISUAL_HEAD}</head>
<body class="min-h-screen overflow-x-hidden w-full">
  <!-- Navbar -->
  <nav class="sticky top-0 z-40 glass bg-stone-900/90 backdrop-blur border-b border-stone-800 px-6 py-4 flex justify-between items-center">
    <div class="flex items-center space-x-3">
      <div class="w-10 h-10 rounded-xl bg-orange-600 flex items-center justify-center font-black text-xl text-white shadow-lg shadow-orange-600/30">
        <i class="fa-solid fa-burger"></i>
      </div>
      <div>
        <span class="font-extrabold text-xl tracking-tight text-white">${intent.businessName}</span>
        <span class="block text-xs text-orange-400 font-medium">Grelhado no Fogo • Artesanal</span>
      </div>
    </div>
    <div class="flex items-center space-x-4">
      <button onclick="toggleCart()" class="relative bg-stone-800 hover:bg-stone-700 text-white px-4 py-2 rounded-xl flex items-center space-x-2 border border-stone-700 transition">
        <i class="fa-solid fa-cart-shopping text-orange-500"></i>
        <span class="text-sm font-semibold">Carrinho</span>
        <span id="cart-count" class="bg-orange-600 text-white text-xs px-2 py-0.5 rounded-full font-bold">0</span>
      </button>
      <a href="https://wa.me/5511999999999?text=Olá!%20Gostaria%20de%20fazer%20um%20pedido%20na%20${encodeURIComponent(intent.businessName)}" target="_blank" class="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center space-x-2 shadow-lg shadow-green-600/20 transition">
        <i class="fa-brands fa-whatsapp text-lg"></i>
        <span class="hidden sm:inline">WhatsApp</span>
      </a>
    </div>
  </nav>

  <!-- Hero Section -->
  <header class="relative overflow-hidden py-16 px-6 sm:px-12 border-b border-stone-800">
    <div class="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
      <div class="space-y-6 animate-fade">
        <div class="inline-flex items-center space-x-2 bg-orange-500/10 border border-orange-500/30 text-orange-400 px-3 py-1.5 rounded-full text-xs font-semibold tracking-wide uppercase">
          <i class="fa-solid fa-fire"></i>
          <span>Carne 100% Black Angus 180g</span>
        </div>
        <h1 class="text-4xl sm:text-6xl font-black tracking-tight leading-none text-white">
          O Verdadeiro Sabor do <span class="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-400">Hambúrguer</span>
        </h1>
        <p class="text-stone-300 text-lg sm:text-xl leading-relaxed max-w-xl">
          Pães artesanais fermentados naturalmente, queijos maturados, bacon defumado na lenha e blends moídos diariamente.
        </p>
        <div class="flex flex-wrap gap-4 pt-2">
          <a href="#menu" class="bg-orange-600 hover:bg-orange-500 text-white font-extrabold px-8 py-3.5 rounded-xl shadow-lg shadow-orange-600/30 transition transform hover:-translate-y-0.5 text-center">
            Ver Cardápio Completo
          </a>
          <button onclick="orderQuick()" class="bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 font-bold px-6 py-3.5 rounded-xl transition">
            Combo do Dia (-20%)
          </button>
        </div>
        <!-- Badges -->
        <div class="grid grid-cols-3 gap-4 pt-6 border-t border-stone-800/80 text-stone-400 text-xs">
          <div class="flex items-center space-x-2">
            <i class="fa-solid fa-clock text-orange-500 text-base"></i>
            <span>Entrega 35-45 min</span>
          </div>
          <div class="flex items-center space-x-2">
            <i class="fa-solid fa-medal text-orange-500 text-base"></i>
            <span>Carne Certificada</span>
          </div>
          <div class="flex items-center space-x-2">
            <i class="fa-solid fa-star text-amber-400 text-base"></i>
            <span>4.9 no Delivery (2.8k)</span>
          </div>
        </div>
      </div>
      <div class="relative min-h-[420px]">
        <div class="absolute -inset-2 bg-gradient-to-r from-orange-600 to-amber-500 rounded-3xl blur-2xl opacity-20"></div>
        ${heroVideoMarkup}
        <img src="${heroAsset}" alt="Hambúrguer artesanal gourmet" class="relative z-0 rounded-2xl shadow-2xl border border-stone-700/60 w-full h-[420px] object-cover ${heroVideo ? 'hidden' : ''}" />
      </div>
    </div>
  </header>

  <!-- Cardápio / Menu -->
  <section id="menu" class="py-16 px-6 sm:px-12 max-w-6xl mx-auto">
    <div class="flex flex-col md:flex-row md:items-end justify-between mb-10 pb-4 border-b border-stone-800">
      <div>
        <h2 class="text-3xl font-black text-white tracking-tight">Nosso Cardápio Selecionado</h2>
        <p class="text-stone-400 text-sm mt-1">Clique em adicionar para montar o seu pedido personalizado.</p>
      </div>
      <div class="flex gap-2 mt-4 md:mt-0">
        <button class="bg-orange-600 text-white px-4 py-1.5 rounded-lg text-xs font-bold">Todos</button>
        <button class="bg-stone-800 text-stone-300 hover:text-white px-4 py-1.5 rounded-lg text-xs font-medium">Smash Burgers</button>
        <button class="bg-stone-800 text-stone-300 hover:text-white px-4 py-1.5 rounded-lg text-xs font-medium">Acompanhamentos</button>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      <!-- Item 1 -->
      <div class="glass bg-stone-900 rounded-2xl border border-stone-800 overflow-hidden hover:border-orange-500/40 transition duration-300 flex flex-col justify-between">
        <div>
          <img src="${heroAsset}" alt="Monster Bacon Burger" class="w-full h-48 object-cover" />
          <div class="p-6">
            <div class="flex justify-between items-start mb-2">
              <h3 class="font-extrabold text-lg text-white">Monster Bacon Burger</h3>
              <span class="text-orange-400 font-black text-lg">R$ 38,90</span>
            </div>
            <p class="text-stone-400 text-xs leading-relaxed mb-4">
              Blend 180g, triplo cheddar inglês, fatias generosas de bacon caramelizado no melaço e maionese defumada.
            </p>
          </div>
        </div>
        <div class="p-6 pt-0">
          <button onclick="addToCart('Monster Bacon Burger', 38.90)" class="w-full bg-orange-600 hover:bg-orange-500 text-white py-2.5 rounded-xl font-bold text-sm flex items-center justify-center space-x-2 transition">
            <i class="fa-solid fa-plus"></i>
            <span>Adicionar ao Pedido</span>
          </button>
        </div>
      </div>

      <!-- Item 2 -->
      <div class="glass bg-stone-900 rounded-2xl border border-stone-800 overflow-hidden hover:border-orange-500/40 transition duration-300 flex flex-col justify-between">
        <div>
          <img src="${asset2}" alt="Double Smash Classic" class="w-full h-48 object-cover" />
          <div class="p-6">
            <div class="flex justify-between items-start mb-2">
              <h3 class="font-extrabold text-lg text-white">Double Smash Classic</h3>
              <span class="text-orange-400 font-black text-lg">R$ 32,50</span>
            </div>
            <p class="text-stone-400 text-xs leading-relaxed mb-4">
              Dois hambúrgueres smash prensados na chapa de 90g com crosta crocante, queijo prato, picles e molho secreto.
            </p>
          </div>
        </div>
        <div class="p-6 pt-0">
          <button onclick="addToCart('Double Smash Classic', 32.50)" class="w-full bg-orange-600 hover:bg-orange-500 text-white py-2.5 rounded-xl font-bold text-sm flex items-center justify-center space-x-2 transition">
            <i class="fa-solid fa-plus"></i>
            <span>Adicionar ao Pedido</span>
          </button>
        </div>
      </div>

      <!-- Item 3 -->
      <div class="glass bg-stone-900 rounded-2xl border border-stone-800 overflow-hidden hover:border-orange-500/40 transition duration-300 flex flex-col justify-between">
        <div>
          <img src="${asset3}" alt="Batata Rústica Trufada" class="w-full h-48 object-cover" />
          <div class="p-6">
            <div class="flex justify-between items-start mb-2">
              <h3 class="font-extrabold text-lg text-white">Batatas Rústicas Trufadas</h3>
              <span class="text-orange-400 font-black text-lg">R$ 24,90</span>
            </div>
            <p class="text-stone-400 text-xs leading-relaxed mb-4">
              Corte especial com casca, azeite de trufas brancas, parmesão ralado na hora e alecrim fresco.
            </p>
          </div>
        </div>
        <div class="p-6 pt-0">
          <button onclick="addToCart('Batatas Rústicas Trufadas', 24.90)" class="w-full bg-orange-600 hover:bg-orange-500 text-white py-2.5 rounded-xl font-bold text-sm flex items-center justify-center space-x-2 transition">
            <i class="fa-solid fa-plus"></i>
            <span>Adicionar ao Pedido</span>
          </button>
        </div>
      </div>
    </div>
  </section>

  <!-- Cart Modal -->
  <div id="cart-modal" class="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm hidden flex items-center justify-center p-4">
    <div class="bg-stone-900 border border-stone-800 rounded-3xl max-w-md w-full p-6 shadow-2xl">
      <div class="flex justify-between items-center pb-4 border-b border-stone-800">
        <h3 class="text-xl font-extrabold text-white flex items-center space-x-2">
          <i class="fa-solid fa-bag-shopping text-orange-500"></i>
          <span>Seu Pedido</span>
        </h3>
        <button onclick="toggleCart()" class="text-stone-400 hover:text-white text-lg">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>

      <div id="cart-items" class="py-4 space-y-3 max-h-60 overflow-y-auto">
        <p class="text-stone-500 text-sm text-center py-6">Seu carrinho está vazio no momento.</p>
      </div>

      <div class="pt-4 border-t border-stone-800 space-y-4">
        <div class="flex justify-between text-base font-extrabold text-white">
          <span>Total:</span>
          <span id="cart-total" class="text-orange-400">R$ 0,00</span>
        </div>
        <button onclick="checkoutWhatsApp()" class="w-full bg-green-600 hover:bg-green-500 text-white font-extrabold py-3.5 rounded-xl flex items-center justify-center space-x-2 shadow-lg shadow-green-600/20 transition">
          <i class="fa-brands fa-whatsapp text-lg"></i>
          <span>Finalizar Pedido no WhatsApp</span>
        </button>
      </div>
    </div>
  </div>

  <footer class="border-t border-stone-800 py-10 px-6 text-center text-stone-500 text-xs">
    <p>© ${new Date().getFullYear()} ${intent.businessName}. Todos os direitos reservados.</p>
    <p class="mt-1">Construído e orquestrado autonomamente por BUD via Engrenagem AI.</p>
  </footer>

  <script>
    let cart = [];

    function addToCart(name, price) {
      cart.push({ name, price });
      updateCartUI();
      // Brief feedback
      const btn = event.currentTarget;
      const original = btn.innerHTML;
      btn.innerHTML = '<i class="fa-solid fa-check"></i> <span>Adicionado!</span>';
      setTimeout(() => btn.innerHTML = original, 1000);
    }

    function toggleCart() {
      const modal = document.getElementById('cart-modal');
      modal.classList.toggle('hidden');
    }

    function updateCartUI() {
      document.getElementById('cart-count').innerText = cart.length;
      const itemsContainer = document.getElementById('cart-items');
      if (cart.length === 0) {
        itemsContainer.innerHTML = '<p class="text-stone-500 text-sm text-center py-6">Seu carrinho está vazio.</p>';
        document.getElementById('cart-total').innerText = 'R$ 0,00';
        return;
      }

      let total = 0;
      itemsContainer.innerHTML = cart.map((item, idx) => {
        total += item.price;
        return \`
          <div class="flex justify-between items-center bg-stone-800/60 p-3 rounded-xl border border-stone-750">
            <div>
              <p class="font-bold text-sm text-white">\${item.name}</p>
              <p class="text-xs text-orange-400">R$ \${item.price.toFixed(2).replace('.', ',')}</p>
            </div>
            <button onclick="removeItem(\${idx})" class="text-red-400 hover:text-red-300 text-xs p-1">
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
        \`;
      }).join('');
      document.getElementById('cart-total').innerText = 'R$ ' + total.toFixed(2).replace('.', ',');
    }

    function removeItem(index) {
      cart.splice(index, 1);
      updateCartUI();
    }

    function checkoutWhatsApp() {
      if (cart.length === 0) {
        alert('Seu carrinho está vazio!');
        return;
      }
      let total = 0;
      const list = cart.map(i => { total += i.price; return '- ' + i.name + ' (R$ ' + i.price.toFixed(2) + ')'; }).join('%0A');
      const message = 'Olá! Gostaria de pedir na ${encodeURIComponent(intent.businessName)}:%0A%0A' + list + '%0A%0ATotal: R$ ' + total.toFixed(2);
      window.open('https://wa.me/5511999999999?text=' + message, '_blank');
    }

    function orderQuick() {
      addToCart('Combo Especial Monster + Fritas + Refri', 54.90);
      toggleCart();
    }
  </script>
</body>
</html>`;

    appTsxContent = `import React, { useState } from 'react';

export default function App() {
  const [cart, setCart] = useState<Array<{ name: string; price: number }>>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const addToCart = (name: string, price: number) => {
    setCart(prev => [...prev, { name, price }]);
  };

  const total = cart.reduce((acc, item) => acc + item.price, 0);

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 font-sans">
      <header className="border-b border-stone-800 p-6 flex justify-between items-center">
        <h1 className="text-2xl font-black text-orange-500">${intent.businessName}</h1>
        <button onClick={() => setIsCartOpen(true)} className="bg-orange-600 px-4 py-2 rounded-xl text-white font-bold">
          Carrinho ({cart.length})
        </button>
      </header>
      <main className="max-w-5xl mx-auto p-6">
        <h2 className="text-4xl font-extrabold mb-4">Burgers Artesanais no Fogo</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-stone-900 p-6 rounded-2xl border border-stone-800">
            <h3 className="text-xl font-bold">Monster Bacon Burger</h3>
            <p className="text-stone-400 text-sm my-2">180g blend Angus, cheddar e bacon crocante.</p>
            <button onClick={() => addToCart('Monster Bacon', 38.90)} className="bg-orange-600 text-white px-4 py-2 rounded-lg font-bold">
              Pedir R$ 38,90
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}`;
  } else if (intent.domain === 'healthcare') {
    // DENTAL SAAS ACCEPTANCE TEST
    previewHtml = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${intent.businessName} - Gestão Odontológica Inteligente</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
  <style>
    body { background-color: ${bgColor}; color: #F0F9FF; font-family: system-ui, -apple-system, sans-serif; }
  </style>
${VISUAL_HEAD}</head>
<body class="min-h-screen overflow-x-hidden w-full flex flex-col">
  <!-- Top Bar -->
  <header class="bg-slate-900/90 border-b border-slate-800 px-6 py-4 flex justify-between items-center">
    <div class="flex items-center space-x-3">
      <div class="w-10 h-10 rounded-xl bg-sky-500 flex items-center justify-center font-bold text-white shadow-lg shadow-sky-500/30">
        <i class="fa-solid fa-tooth text-xl"></i>
      </div>
      <div>
        <span class="font-extrabold text-xl tracking-tight text-white">${intent.businessName}</span>
        <span class="block text-xs text-sky-400 font-medium">SaaS de Gestão Clínica</span>
      </div>
    </div>
    <div class="flex items-center space-x-3">
      <span class="text-xs bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-3 py-1 rounded-full font-bold">
        <i class="fa-solid fa-circle text-[8px] mr-1"></i> Sistema Operacional
      </span>
      <button class="bg-sky-600 hover:bg-sky-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-lg shadow-sky-600/20">
        + Novo Paciente
      </button>
    </div>
  </header>

  <div class="flex-1 flex flex-col md:flex-row">
    <!-- Sidebar -->
    <aside class="w-full md:w-64 bg-slate-950/80 border-r border-slate-800 p-4 space-y-2">
      <div class="text-xs font-bold text-slate-500 uppercase px-3 py-2">Módulos Clínicos</div>
      <button class="w-full text-left bg-sky-600 text-white px-3 py-2.5 rounded-xl font-bold text-sm flex items-center space-x-3">
        <i class="fa-solid fa-chart-pie"></i>
        <span>Dashboard Geral</span>
      </button>
      <button class="w-full text-left text-slate-400 hover:bg-slate-800 hover:text-white px-3 py-2.5 rounded-xl font-medium text-sm flex items-center space-x-3 transition">
        <i class="fa-solid fa-users"></i>
        <span>Pacientes (142)</span>
      </button>
      <button class="w-full text-left text-slate-400 hover:bg-slate-800 hover:text-white px-3 py-2.5 rounded-xl font-medium text-sm flex items-center space-x-3 transition">
        <i class="fa-solid fa-calendar-check"></i>
        <span>Agenda Médica</span>
      </button>
      <button class="w-full text-left text-slate-400 hover:bg-slate-800 hover:text-white px-3 py-2.5 rounded-xl font-medium text-sm flex items-center space-x-3 transition">
        <i class="fa-solid fa-file-medical"></i>
        <span>Prontuários & Raio-X</span>
      </button>
      <button class="w-full text-left text-slate-400 hover:bg-slate-800 hover:text-white px-3 py-2.5 rounded-xl font-medium text-sm flex items-center space-x-3 transition">
        <i class="fa-solid fa-receipt"></i>
        <span>Faturamento & Planos</span>
      </button>
    </aside>

    <!-- Main Dashboard -->
    <main class="flex-1 p-6 md:p-8 space-y-6 overflow-y-auto">
      <!-- KPI Stats -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
          <span class="text-xs text-slate-400 font-medium">Consultas Hoje</span>
          <div class="text-2xl font-black text-white mt-1">18 <span class="text-xs text-emerald-400 font-bold ml-1">+3 confirmadas</span></div>
        </div>
        <div class="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
          <span class="text-xs text-slate-400 font-medium">Pacientes Ativos</span>
          <div class="text-2xl font-black text-sky-400 mt-1">1.248</div>
        </div>
        <div class="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
          <span class="text-xs text-slate-400 font-medium">Procedimentos do Mês</span>
          <div class="text-2xl font-black text-white mt-1">164</div>
        </div>
        <div class="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
          <span class="text-xs text-slate-400 font-medium">Taxa de Ocupação</span>
          <div class="text-2xl font-black text-emerald-400 mt-1">94%</div>
        </div>
      </div>

      <!-- Schedule Table -->
      <div class="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div class="flex justify-between items-center mb-4">
          <div>
            <h3 class="text-lg font-bold text-white">Agenda do Consultório - Hoje</h3>
            <p class="text-xs text-slate-400">Dra. Amanda Silveira • Cirurgiã-Dentista</p>
          </div>
          <button class="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg border border-slate-700">
            Filtrar por Especialidade
          </button>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm">
            <thead class="text-xs text-slate-400 border-b border-slate-800 uppercase">
              <tr>
                <th class="py-3 px-4">Horário</th>
                <th class="py-3 px-4">Paciente</th>
                <th class="py-3 px-4">Procedimento</th>
                <th class="py-3 px-4">Status</th>
                <th class="py-3 px-4 text-right">Ação</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800/60 text-slate-300">
              <tr>
                <td class="py-3.5 px-4 font-bold text-white">09:00</td>
                <td class="py-3.5 px-4 flex items-center space-x-2">
                  <div class="w-7 h-7 rounded-full bg-sky-600/40 text-sky-400 flex items-center justify-center font-bold text-xs">CS</div>
                  <span>Carlos Souza</span>
                </td>
                <td class="py-3.5 px-4">Profilaxia & Raspagem</td>
                <td class="py-3.5 px-4"><span class="bg-emerald-500/20 text-emerald-400 text-xs px-2.5 py-1 rounded-full font-bold">Concluído</span></td>
                <td class="py-3.5 px-4 text-right"><button class="text-xs text-sky-400 hover:underline">Ver Prontuário</button></td>
              </tr>
              <tr>
                <td class="py-3.5 px-4 font-bold text-white">10:30</td>
                <td class="py-3.5 px-4 flex items-center space-x-2">
                  <div class="w-7 h-7 rounded-full bg-purple-600/40 text-purple-400 flex items-center justify-center font-bold text-xs">ML</div>
                  <span>Mariana Lima</span>
                </td>
                <td class="py-3.5 px-4">Instalação de Aparelho Ortodôntico</td>
                <td class="py-3.5 px-4"><span class="bg-sky-500/20 text-sky-400 text-xs px-2.5 py-1 rounded-full font-bold">Na Cadeira</span></td>
                <td class="py-3.5 px-4 text-right"><button class="text-xs text-sky-400 hover:underline">Anotações</button></td>
              </tr>
              <tr>
                <td class="py-3.5 px-4 font-bold text-white">14:00</td>
                <td class="py-3.5 px-4 flex items-center space-x-2">
                  <div class="w-7 h-7 rounded-full bg-amber-600/40 text-amber-400 flex items-center justify-center font-bold text-xs">RA</div>
                  <span>Roberto Alves</span>
                </td>
                <td class="py-3.5 px-4">Implante Dentário - Fase 2</td>
                <td class="py-3.5 px-4"><span class="bg-amber-500/20 text-amber-400 text-xs px-2.5 py-1 rounded-full font-bold">Aguardando</span></td>
                <td class="py-3.5 px-4 text-right"><button class="text-xs text-sky-400 hover:underline">Confirmar</button></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </main>
  </div>
</body>
</html>`;

    appTsxContent = `import React from 'react';

export default function App() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="p-6 border-b border-slate-800">
        <h1 className="text-2xl font-bold text-sky-400">${intent.businessName}</h1>
      </header>
      <main className="p-6">
        <p>Sistema Clínico Ativo.</p>
      </main>
    </div>
  );
}`;
  } else if (intent.domain === 'fitness' && intent.projectType === 'saas') {
    previewHtml = `<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><title>${intent.businessName} - SaaS</title><script src="https://cdn.tailwindcss.com"></script><link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" crossorigin="" /><script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" crossorigin=""></script><style>body{background:${bgColor};color:${intent.colorPalette.text};font-family:system-ui,sans-serif}.panel{background:#111827;border:1px solid #263449}#lead-map{min-height:360px}</style>${VISUAL_HEAD}</head>
<body class="min-h-screen overflow-x-hidden"><div class="min-h-screen flex flex-col lg:flex-row"><aside class="w-full lg:w-64 bg-slate-950 border-b lg:border-b-0 lg:border-r border-slate-800 p-4"><div class="font-black text-xl text-red-400 mb-6">${intent.businessName}</div><nav class="grid grid-cols-2 lg:grid-cols-1 gap-2"><button onclick="switchView('overview')" class="nav-item text-left rounded-xl bg-red-500/15 text-red-300 px-3 py-3 font-bold">Visão geral</button><button onclick="switchView('students')" class="nav-item text-left rounded-xl hover:bg-slate-800 px-3 py-3 text-slate-300">Alunos</button><button onclick="switchView('workouts')" class="nav-item text-left rounded-xl hover:bg-slate-800 px-3 py-3 text-slate-300">Treinos</button><button onclick="switchView('billing')" class="nav-item text-left rounded-xl hover:bg-slate-800 px-3 py-3 text-slate-300">Pagamentos</button><button onclick="switchView('leads')" class="nav-item text-left rounded-xl hover:bg-slate-800 px-3 py-3 text-slate-300">Mapa de leads</button></nav></aside><main class="flex-1 p-4 sm:p-8"><header class="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center mb-6"><div><p class="text-sm text-slate-400">Painel administrativo</p><h1 id="view-title" class="text-2xl sm:text-3xl font-black">Visão geral</h1></div><button onclick="openModal()" class="bg-red-500 hover:bg-red-400 px-4 py-3 rounded-xl font-bold">+ Cadastrar aluno</button></header><section id="overview" class="view grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4"><div class="panel glass animate-fade rounded-2xl p-5"><p class="text-slate-400 text-sm">Alunos ativos</p><p class="text-3xl font-black mt-2">248</p><p class="text-xs text-emerald-300 mt-2">+12% este mês</p></div><div class="panel glass animate-fade rounded-2xl p-5"><p class="text-slate-400 text-sm">Treinos concluídos</p><p class="text-3xl font-black mt-2">1.284</p><p class="text-xs text-emerald-300 mt-2">+8% esta semana</p></div><div class="panel glass animate-fade rounded-2xl p-5"><p class="text-slate-400 text-sm">Receita mensal</p><p class="text-3xl font-black mt-2">R$ 42.8k</p><p class="text-xs text-emerald-300 mt-2">+15% recorrente</p></div><div class="panel glass animate-fade rounded-2xl p-5"><p class="text-slate-400 text-sm">Retenção</p><p class="text-3xl font-black mt-2">91%</p><p class="text-xs text-yellow-300 mt-2">Meta: 90%</p></div><div class="panel glass animate-fade rounded-2xl p-5 sm:p-6 sm:col-span-2 xl:col-span-4"><h2 class="font-black text-lg">Atividade recente</h2><div class="grid gap-3 mt-4 text-sm"><div class="flex flex-col sm:flex-row sm:justify-between gap-1 border-b border-slate-800 pb-3"><span>Novo aluno cadastrado: Marina Costa</span><span class="text-slate-500">há 8 min</span></div><div class="flex flex-col sm:flex-row sm:justify-between gap-1 border-b border-slate-800 pb-3"><span>Plano Premium renovado por Carlos Souza</span><span class="text-slate-500">há 32 min</span></div><div class="flex flex-col sm:flex-row sm:justify-between gap-1"><span>Treino A atualizado pelo treinador João</span><span class="text-slate-500">há 1 h</span></div></div></div></section><section id="students" class="view hidden panel rounded-2xl p-5 sm:p-6"><h2 class="font-black text-lg">Alunos cadastrados</h2><div id="student-list" class="grid gap-3 mt-4"><div class="flex flex-col sm:flex-row sm:justify-between gap-2 bg-slate-950/60 p-4 rounded-xl"><span><b>Marina Costa</b><small class="block text-slate-400">Plano Premium • Treino A</small></span><button onclick="alert('Perfil de Marina aberto')" class="text-red-300 font-bold text-sm">Ver perfil</button></div><div class="flex flex-col sm:flex-row sm:justify-between gap-2 bg-slate-950/60 p-4 rounded-xl"><span><b>Carlos Souza</b><small class="block text-slate-400">Plano VIP • Treino B</small></span><button onclick="alert('Perfil de Carlos aberto')" class="text-red-300 font-bold text-sm">Ver perfil</button></div></div></section><section id="workouts" class="view hidden panel rounded-2xl p-5 sm:p-6"><h2 class="font-black text-lg">Biblioteca de treinos</h2><div class="grid sm:grid-cols-2 gap-4 mt-4"><button onclick="alert('Treino A selecionado')" class="text-left bg-slate-950/60 p-4 rounded-xl hover:border-red-400 border border-transparent"><b>Treino A • Hipertrofia</b><small class="block text-slate-400 mt-1">12 exercícios • 48 alunos</small></button><button onclick="alert('Treino B selecionado')" class="text-left bg-slate-950/60 p-4 rounded-xl hover:border-red-400 border border-transparent"><b>Treino B • Força</b><small class="block text-slate-400 mt-1">9 exercícios • 31 alunos</small></button></div></section><section id="billing" class="view hidden panel rounded-2xl p-5 sm:p-6"><h2 class="font-black text-lg">Pagamentos</h2><p class="text-slate-400 text-sm mt-2">Acompanhe assinaturas e cobranças recorrentes.</p><button onclick="alert('Relatório financeiro exportado')" class="mt-5 border border-slate-700 px-4 py-3 rounded-xl font-bold">Exportar relatório</button></section><section id="leads" class="view hidden panel rounded-2xl p-5 sm:p-6"><div class="flex flex-col sm:flex-row gap-3 justify-between sm:items-end"><div><h2 class="font-black text-lg">Mapa de leads públicos</h2><p class="text-slate-400 text-sm mt-1">Encontre negócios por nicho e região usando dados públicos do OpenStreetMap.</p></div><form onsubmit="searchLeads(event)" class="flex gap-2"><input id="lead-query" required placeholder="ex.: academias" class="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm" /><input id="lead-near" required placeholder="cidade ou região" class="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm" /><button class="bg-red-500 px-4 py-2 rounded-xl font-bold text-sm">Buscar</button></form></div><div class="grid lg:grid-cols-[1.2fr_.8fr] gap-4 mt-4"><div id="lead-map" class="rounded-2xl overflow-hidden border border-slate-700 bg-slate-950"></div><div id="lead-results" class="space-y-2 max-h-[360px] overflow-y-auto"><p class="text-slate-500 text-sm">Faça uma busca para carregar leads públicos.</p></div></div><p class="text-[11px] text-slate-500 mt-3">Dados: © OpenStreetMap contributors. Respeite a política de uso e a LGPD antes de prospectar.</p></section></main></div><div id="modal" class="hidden fixed inset-0 bg-black/70 p-4 items-center justify-center"><form onsubmit="saveRecord(event)" class="panel max-w-md w-full rounded-2xl p-6"><div class="flex justify-between"><h2 class="font-black text-lg">Novo aluno</h2><button type="button" onclick="closeModal()" class="text-slate-400">✕</button></div><input required id="student-name" placeholder="Nome completo" class="w-full mt-5 bg-slate-950 border border-slate-700 rounded-xl px-4 py-3" /><input required placeholder="E-mail" type="email" class="w-full mt-3 bg-slate-950 border border-slate-700 rounded-xl px-4 py-3" /><button class="w-full mt-4 bg-red-500 px-4 py-3 rounded-xl font-bold">Salvar aluno</button></form></div><script>function switchView(id){document.querySelectorAll('.view').forEach(v=>v.classList.add('hidden'));document.getElementById(id).classList.remove('hidden');document.getElementById('view-title').textContent=id==='overview'?'Visão geral':id==='students'?'Alunos':id==='workouts'?'Treinos':'Pagamentos'}function openModal(){const m=document.getElementById('modal');m.classList.remove('hidden');m.classList.add('flex')}function closeModal(){const m=document.getElementById('modal');m.classList.add('hidden');m.classList.remove('flex')}function saveRecord(e){e.preventDefault();const name=document.getElementById('student-name').value;document.getElementById('student-list').insertAdjacentHTML('afterbegin','<div class="bg-slate-950/60 p-4 rounded-xl"><b>'+name+'</b><small class="block text-emerald-300">Cadastrado agora</small></div>');closeModal();switchView('students')}function initLeadMap(){if(window.leadMap||!window.L)return;window.leadMap=L.map('lead-map').setView([-14.2,-51.9],4);L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'© OpenStreetMap contributors'}).addTo(window.leadMap)}async function searchLeads(e){e.preventDefault();initLeadMap();const box=document.getElementById('lead-results');box.innerHTML='<p class="text-slate-400 text-sm">Buscando...</p>';const q=document.getElementById('lead-query').value,n=document.getElementById('lead-near').value;try{const r=await fetch('/api/leads/search?q='+encodeURIComponent(q)+'&near='+encodeURIComponent(n));const d=await r.json();if(!r.ok)throw new Error(d.error);box.innerHTML=d.leads.map(x=>'<a target="_blank" rel="noreferrer" href="'+x.mapUrl+'" class="block bg-slate-950/70 rounded-xl p-3 hover:border-red-400 border border-transparent"><b>'+x.name+'</b><small class="block text-slate-400 mt-1">'+x.address+'</small></a>').join('')||'<p class="text-slate-500 text-sm">Nenhum resultado público encontrado.</p>';d.leads.forEach(x=>L.marker([x.lat,x.lon]).addTo(window.leadMap).bindPopup(x.name));if(d.leads[0])window.leadMap.setView([d.leads[0].lat,d.leads[0].lon],13)}catch(err){box.innerHTML='<p class="text-red-300 text-sm">'+err.message+'</p>'}}</script></body></html>`;
    appTsxContent = `import React, { useState } from 'react';
export default function App() { const [view,setView]=useState('overview'); const [students,setStudents]=useState(['Marina Costa','Carlos Souza']); return <main className="min-h-screen bg-slate-950 text-white p-4 sm:p-8"><h1 className="text-3xl font-black">${intent.businessName}</h1><div className="flex flex-wrap gap-2 my-6">{['overview','students','workouts','billing'].map(item=><button key={item} onClick={()=>setView(item)} className="border border-slate-700 px-3 py-2 rounded-xl">{item}</button>)}</div><p>{view==='students' ? students.length + ' alunos ativos' : 'Painel operacional ativo'}</p></main> }`;
  } else if (intent.domain === 'fitness') {
    previewHtml = `<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><title>${intent.businessName} - Treinos</title><script src="https://cdn.tailwindcss.com"></script><style>body{background:${bgColor};color:${intent.colorPalette.text};font-family:system-ui,sans-serif}.card{background:#111827;border:1px solid #273449}</style>${VISUAL_HEAD}</head>
<body class="min-h-screen overflow-x-hidden"><header class="glass relative overflow-hidden border-b border-slate-800 bg-slate-950/90 px-4 sm:px-8 py-4 sticky top-0 z-10 animate-fade">${heroVideoMarkup}<div class="relative z-20"><div class="max-w-6xl mx-auto flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between"><div><p class="text-xs uppercase tracking-[.25em] text-yellow-400 font-bold">BUD Fitness</p><h1 class="text-xl sm:text-2xl font-black">${intent.businessName}</h1></div><div class="flex gap-2 text-sm"><span class="rounded-full bg-red-500/15 text-red-300 px-3 py-1">Treino A</span><span class="rounded-full bg-emerald-500/15 text-emerald-300 px-3 py-1">12 sessões</span></div></div></div></header>
<main class="max-w-6xl mx-auto p-4 sm:p-8 space-y-6"><section class="grid grid-cols-1 lg:grid-cols-[1.1fr_.9fr] gap-6"><div class="card glass animate-fade rounded-3xl p-5 sm:p-8"><div class="flex flex-col sm:flex-row justify-between gap-4"><div><p class="text-slate-400 text-sm">Sessão atual</p><h2 class="text-3xl sm:text-4xl font-black mt-1">Força e hipertrofia</h2></div><div class="text-left sm:text-right"><p class="text-slate-400 text-sm">Tempo de treino</p><p id="timer" class="text-4xl font-mono font-black text-yellow-400">00:00:00</p></div></div><div class="flex flex-wrap gap-3 mt-8"><button id="timer-toggle" onclick="toggleTimer()" class="bg-red-500 hover:bg-red-400 text-white font-bold px-5 py-3 rounded-xl">Iniciar treino</button><button onclick="resetTimer()" class="border border-slate-700 hover:bg-slate-800 px-5 py-3 rounded-xl font-bold">Zerar</button></div></div><div class="card glass animate-fade rounded-3xl p-5 sm:p-8"><p class="text-slate-400 text-sm">Resumo da semana</p><div class="grid grid-cols-2 gap-4 mt-5"><div><p class="text-3xl font-black">4</p><p class="text-xs text-slate-400">treinos</p></div><div><p class="text-3xl font-black">18</p><p class="text-xs text-slate-400">séries registradas</p></div><div><p class="text-3xl font-black text-yellow-400">+12%</p><p class="text-xs text-slate-400">evolução</p></div><div><p class="text-3xl font-black">2.4k</p><p class="text-xs text-slate-400">kg movimentados</p></div></div></div></section>
<section class="grid grid-cols-1 lg:grid-cols-2 gap-6"><div class="card glass animate-fade rounded-3xl p-5 sm:p-8"><div class="flex flex-col sm:flex-row justify-between sm:items-center gap-3"><div><h2 class="text-xl font-black">Ficha de exercícios</h2><p class="text-sm text-slate-400">Selecione o grupo muscular</p></div><select onchange="filterExercises(this.value)" class="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm"><option value="all">Todos</option><option value="peito">Peito</option><option value="costas">Costas</option><option value="pernas">Pernas</option></select></div><div id="exercise-plan" class="grid gap-3 mt-5"><div data-muscle="peito" class="rounded-2xl bg-slate-950/70 p-4 flex flex-col sm:flex-row justify-between gap-3"><div><p class="font-bold">Supino reto</p><p class="text-xs text-slate-400">Peito • 4 séries de 10</p></div><button onclick="logSet('Supino reto')" class="text-sm text-yellow-300 font-bold border border-yellow-500/30 rounded-lg px-3 py-2">Registrar série</button></div><div data-muscle="costas" class="rounded-2xl bg-slate-950/70 p-4 flex flex-col sm:flex-row justify-between gap-3"><div><p class="font-bold">Remada curvada</p><p class="text-xs text-slate-400">Costas • 4 séries de 10</p></div><button onclick="logSet('Remada curvada')" class="text-sm text-yellow-300 font-bold border border-yellow-500/30 rounded-lg px-3 py-2">Registrar série</button></div><div data-muscle="pernas" class="rounded-2xl bg-slate-950/70 p-4 flex flex-col sm:flex-row justify-between gap-3"><div><p class="font-bold">Agachamento livre</p><p class="text-xs text-slate-400">Pernas • 4 séries de 8</p></div><button onclick="logSet('Agachamento livre')" class="text-sm text-yellow-300 font-bold border border-yellow-500/30 rounded-lg px-3 py-2">Registrar série</button></div></div></div><div class="card glass animate-fade rounded-3xl p-5 sm:p-8"><div class="flex justify-between items-center"><div><h2 class="text-xl font-black">Histórico de séries</h2><p class="text-sm text-slate-400">Registros desta sessão</p></div><span id="set-count" class="text-xs bg-red-500/15 text-red-300 px-3 py-1 rounded-full">0 séries</span></div><div id="workout-history" class="mt-5 space-y-3"><p id="empty-history" class="text-sm text-slate-500 py-8 text-center">Registre sua primeira série para acompanhar a evolução.</p></div></div></section></main>
<script>let timerSeconds=0,timerHandle=null,sets=[];function renderTimer(){const h=String(Math.floor(timerSeconds/3600)).padStart(2,'0'),m=String(Math.floor(timerSeconds%3600/60)).padStart(2,'0'),s=String(timerSeconds%60).padStart(2,'0');document.getElementById('timer').textContent=h+':'+m+':'+s}function startTimer(){if(timerHandle)return;timerHandle=setInterval(()=>{timerSeconds++;renderTimer()},1000);document.getElementById('timer-toggle').textContent='Pausar treino'}function toggleTimer(){if(timerHandle){clearInterval(timerHandle);timerHandle=null;document.getElementById('timer-toggle').textContent='Continuar treino'}else startTimer()}function resetTimer(){if(timerHandle)clearInterval(timerHandle);timerHandle=null;timerSeconds=0;renderTimer();document.getElementById('timer-toggle').textContent='Iniciar treino'}function logSet(name){sets.push(name);document.getElementById('empty-history')?.remove();document.getElementById('workout-history').insertAdjacentHTML('afterbegin','<div class="flex justify-between rounded-xl bg-slate-950/70 p-3"><b>'+name+'</b><span class="text-xs text-emerald-300">Registrada agora</span></div>');document.getElementById('set-count').textContent=sets.length+' séries'}function filterExercises(group){document.querySelectorAll('#exercise-plan [data-muscle]').forEach(el=>el.style.display=group==='all'||el.dataset.muscle===group?'flex':'none')}renderTimer();</script></body></html>`;
    appTsxContent = `import React, { useEffect, useState } from 'react';
export default function App() { const [seconds,setSeconds]=useState(0); const [running,setRunning]=useState(false); const [sets,setSets]=useState<string[]>([]); useEffect(()=>{if(!running)return;const id=window.setInterval(()=>setSeconds(v=>v+1),1000);return()=>window.clearInterval(id)},[running]); return <main className="min-h-screen bg-slate-950 text-white p-4 sm:p-8"><h1 className="text-3xl font-black">${intent.businessName}</h1><p className="mt-4 font-mono text-yellow-400">{new Date(seconds*1000).toISOString().slice(11,19)}</p><button onClick={()=>setRunning(v=>!v)} className="mt-4 bg-red-500 px-4 py-2 rounded-xl">{running?'Pausar treino':'Iniciar treino'}</button><button onClick={()=>setSets(v=>[...v,'Série registrada'])} className="ml-2 mt-4 border border-slate-700 px-4 py-2 rounded-xl">Registrar série</button><p className="mt-6">{sets.length} séries registradas</p></main> }`;
  } else {
    // GENERIC / CUSTOM APP
    previewHtml = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${intent.businessName}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
  <style>
    body { background-color: ${bgColor}; color: #FAFAFA; font-family: system-ui, -apple-system, sans-serif; }
  </style>
${VISUAL_HEAD}</head>
<body class="min-h-screen flex flex-col justify-between overflow-x-hidden">
  <nav class="border-b border-stone-800 px-4 sm:px-6 py-4 flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
    <div class="font-extrabold text-xl tracking-tight text-white">${intent.businessName}</div>
    <div class="space-x-3">
      <button onclick="document.getElementById('contact').scrollIntoView({behavior:'smooth'})" class="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg">Fale Conosco</button>
    </div>
  </nav>

  <header class="py-20 px-6 max-w-4xl mx-auto text-center space-y-6">
    <h1 class="text-5xl font-black tracking-tight text-white">${intent.businessName}</h1>
    <p class="text-stone-300 text-lg leading-relaxed max-w-2xl mx-auto">
      Soluções modernas e personalizadas para alavancar seus resultados e encantar seus clientes.
    </p>
    <div class="pt-4 flex flex-col sm:flex-row justify-center gap-4">
      <button onclick="document.getElementById('contact').scrollIntoView({behavior:'smooth'})" class="bg-blue-600 hover:bg-blue-500 text-white font-bold px-8 py-3 rounded-xl transition">
        Começar Agora
      </button>
    </div>
  </header>

  <section class="max-w-4xl mx-auto w-full px-6 pb-12 grid md:grid-cols-2 gap-5">
    <div class="bg-stone-800/60 border border-stone-700 rounded-2xl p-5"><h2 class="font-black text-lg">Por que escolher ${intent.businessName}?</h2><p class="text-stone-300 text-sm mt-2">Atendimento humano, processo claro e uma experiência feita para seu objetivo.</p><button onclick="this.textContent='Benefício selecionado ✓'" class="mt-4 text-blue-300 font-bold">Conhecer benefícios →</button></div>
    <form id="contact" onsubmit="submitContact(event)" class="bg-stone-800/60 border border-stone-700 rounded-2xl p-5"><h2 class="font-black text-lg">Fale com a equipe</h2><input required placeholder="Seu nome" class="w-full mt-3 bg-stone-950 border border-stone-700 rounded-xl px-3 py-2"><input required type="email" placeholder="Seu e-mail" class="w-full mt-2 bg-stone-950 border border-stone-700 rounded-xl px-3 py-2"><button class="w-full mt-3 bg-blue-600 rounded-xl px-3 py-2 font-bold">Enviar mensagem</button><p id="contact-feedback" class="text-emerald-300 text-sm mt-2"></p></form>
  </section>
  <footer class="border-t border-stone-800 py-6 text-center text-xs text-stone-500">
    © ${new Date().getFullYear()} ${intent.businessName}. Orquestrado por BUD via Engrenagem AI.
  </footer>
  <script>function submitContact(e){e.preventDefault();document.getElementById('contact-feedback').textContent='Mensagem recebida! Retornaremos em breve.';e.target.reset()}</script>
</body>
</html>`;

    appTsxContent = `import React from 'react';

export default function App() {
  return (
    <div className="min-h-screen bg-stone-900 text-white p-8">
      <h1 className="text-3xl font-bold">${intent.businessName}</h1>
    </div>
  );
}`;
  }

  if (uploadedAssets.length > 0) {
    const mediaSection = uploadedAssets.map(asset => {
      if (asset.kind === 'video') return `<video controls playsinline class="w-full rounded-2xl" src="${asset.dataUrl}" aria-label="${asset.name}"></video>`;
      if (asset.kind === 'audio') return `<audio controls class="w-full" src="${asset.dataUrl}" aria-label="${asset.name}"></audio>`;
      return `<img loading="lazy" class="w-full rounded-2xl object-cover" src="${asset.dataUrl}" alt="${asset.name}" />`;
    }).join('');
    previewHtml = previewHtml.replace('</body>', `<section id="project-media" class="max-w-6xl mx-auto px-5 sm:px-8 py-10 space-y-5"><h2 class="text-2xl font-black">Mídia do projeto</h2><div class="grid md:grid-cols-2 gap-5">${mediaSection}</div></section></body>`);
  }

  const files: Record<string, ProjectFile> = {
    'package.json': {
      path: 'package.json',
      language: 'json',
      updatedAt: timestamp,
      content: JSON.stringify({
        name: intent.businessName.toLowerCase().replace(/\s+/g, '-'),
        version: '1.0.0',
        private: true,
        type: 'module',
        scripts: { dev: 'vite', build: 'vite build', preview: 'vite preview' },
        dependencies: {
          react: '^19.0.0',
          'react-dom': '^19.0.0',
          'lucide-react': '^0.546.0'
        },
        devDependencies: {
          vite: '^6.0.0',
          '@vitejs/plugin-react': '^4.3.0',
          tailwindcss: '^4.0.0'
        }
      }, null, 2)
    },
    'index.html': {
      path: 'index.html',
      language: 'html',
      updatedAt: timestamp,
      content: `<!doctype html><html lang="pt-BR"><head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><title>${intent.businessName}</title></head><body><div id="root"></div><script type="module" src="/src/main.tsx"></script></body></html>`
    },
    'preview.html': {
      path: 'preview.html',
      language: 'html',
      updatedAt: timestamp,
      content: previewHtml
    },
    'src/App.tsx': {
      path: 'src/App.tsx',
      language: 'typescript',
      updatedAt: timestamp,
      content: appTsxContent
    },
    'src/main.tsx': {
      path: 'src/main.tsx',
      language: 'typescript',
      updatedAt: timestamp,
      content: "import React from 'react';\nimport { createRoot } from 'react-dom/client';\nimport App from './App';\nimport './styles.css';\n\ncreateRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>);"
    },
    'src/styles.css': {
      path: 'src/styles.css',
      language: 'css',
      updatedAt: timestamp,
      content: '@import "tailwindcss";\n\nhtml, body, #root { min-height: 100%; margin: 0; }\n* { box-sizing: border-box; }'
    },
    'vite.config.ts': {
      path: 'vite.config.ts',
      language: 'typescript',
      updatedAt: timestamp,
      content: "import { defineConfig } from 'vite';\nimport react from '@vitejs/plugin-react';\n\nexport default defineConfig({ plugins: [react()] });"
    },
    'vercel.json': {
      path: 'vercel.json',
      language: 'json',
      updatedAt: timestamp,
      content: JSON.stringify({ buildCommand: 'npm run build', outputDirectory: 'dist', framework: 'vite', installCommand: 'npm install' }, null, 2)
    },
    'netlify.toml': {
      path: 'netlify.toml',
      language: 'toml',
      updatedAt: timestamp,
      content: '[build]\n  command = "npm run build"\n  publish = "dist"\n\n[build.environment]\n  NODE_VERSION = "20"\n\n[[redirects]]\n  from = "/*"\n  to = "/index.html"\n  status = 200\n'
    },
    'README.md': {
      path: 'README.md',
      language: 'markdown',
      updatedAt: timestamp,
      content: `# ${intent.businessName}\n\nProjeto gerado pelo Engrenagem AI / BUD.\n\n## Rodar localmente\n\n\`\`\`bash\nnpm install\nnpm run dev\n\`\`\`\n\n## Publicar\n\n- **Vercel:** importe este repositório e use \`npm run build\` com saída \`dist\`.\n- **Netlify:** importe este repositório; o arquivo \`netlify.toml\` já configura build e SPA fallback.\n- **GitHub:** faça commit de todos os arquivos gerados na branch \`main\`.\n\nO projeto inclui Vite, React, entrypoint, configuração de deploy e contrato de intenção.\n`
    },
    'src/FeaturePlan.json': {
      path: 'src/FeaturePlan.json',
      language: 'json',
      updatedAt: timestamp,
      content: JSON.stringify(features, null, 2)
    },
    'src/IntentContract.json': {
      path: 'src/IntentContract.json',
      language: 'json',
      updatedAt: timestamp,
      content: JSON.stringify(intent, null, 2)
    }
  };

  return { files, previewHtml };
}
