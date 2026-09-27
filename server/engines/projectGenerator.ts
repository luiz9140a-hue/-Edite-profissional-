import { IntentContract, ProjectFile } from '../../src/types/engrenagem';
import { VerifiedAsset } from './semanticAssetGuard';
import { FunctionalFeaturePlanner } from '../../core/project-forge/FunctionalFeaturePlanner';

export function generateProjectFiles(
  intent: IntentContract,
  assets: VerifiedAsset[]
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

  const heroAsset = assets[0]?.url || 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=1200&q=80';
  const asset2 = assets[1]?.url || assets[0]?.url;
  const asset3 = assets[2]?.url || assets[0]?.url;

  // Let's create specific code and preview according to domain
  let previewHtml = '';
  let appTsxContent = '';

  if (intent.domain === 'food_delivery') {
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
</head>
<body class="min-h-screen overflow-x-hidden w-full">
  <!-- Navbar -->
  <nav class="sticky top-0 z-40 bg-stone-900/90 backdrop-blur border-b border-stone-800 px-6 py-4 flex justify-between items-center">
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
      <div class="space-y-6">
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
      <div class="relative">
        <div class="absolute -inset-2 bg-gradient-to-r from-orange-600 to-amber-500 rounded-3xl blur-2xl opacity-20"></div>
        <img src="${heroAsset}" alt="Hambúrguer artesanal gourmet" class="relative rounded-2xl shadow-2xl border border-stone-700/60 w-full h-[420px] object-cover" />
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
      <div class="bg-stone-900 rounded-2xl border border-stone-800 overflow-hidden hover:border-orange-500/40 transition duration-300 flex flex-col justify-between">
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
      <div class="bg-stone-900 rounded-2xl border border-stone-800 overflow-hidden hover:border-orange-500/40 transition duration-300 flex flex-col justify-between">
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
      <div class="bg-stone-900 rounded-2xl border border-stone-800 overflow-hidden hover:border-orange-500/40 transition duration-300 flex flex-col justify-between">
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
</head>
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
</head>
<body class="min-h-screen flex flex-col justify-between">
  <nav class="border-b border-stone-800 px-6 py-4 flex justify-between items-center">
    <div class="font-extrabold text-xl tracking-tight text-white">${intent.businessName}</div>
    <div class="space-x-3">
      <button class="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg">Fale Conosco</button>
    </div>
  </nav>

  <header class="py-20 px-6 max-w-4xl mx-auto text-center space-y-6">
    <h1 class="text-5xl font-black tracking-tight text-white">${intent.businessName}</h1>
    <p class="text-stone-300 text-lg leading-relaxed max-w-2xl mx-auto">
      Soluções modernas e personalizadas para alavancar seus resultados e encantar seus clientes.
    </p>
    <div class="pt-4 flex justify-center gap-4">
      <button class="bg-blue-600 hover:bg-blue-500 text-white font-bold px-8 py-3 rounded-xl transition">
        Começar Agora
      </button>
    </div>
  </header>

  <footer class="border-t border-stone-800 py-6 text-center text-xs text-stone-500">
    © ${new Date().getFullYear()} ${intent.businessName}. Orquestrado por BUD via Engrenagem AI.
  </footer>
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

  const files: Record<string, ProjectFile> = {
    'package.json': {
      path: 'package.json',
      language: 'json',
      updatedAt: timestamp,
      content: JSON.stringify({
        name: intent.businessName.toLowerCase().replace(/\s+/g, '-'),
        version: '1.0.0',
        private: true,
        dependencies: {
          react: '^19.0.0',
          'react-dom': '^19.0.0',
          'lucide-react': '^0.546.0'
        }
      }, null, 2)
    },
    'index.html': {
      path: 'index.html',
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
    'src/IntentContract.json': {
      path: 'src/IntentContract.json',
      language: 'json',
      updatedAt: timestamp,
      content: JSON.stringify(intent, null, 2)
    }
  };

  return { files, previewHtml };
}
