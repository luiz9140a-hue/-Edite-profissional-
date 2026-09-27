export class NavigationResponsiveEngine {
  /**
   * Transforms fixed desktop sidebars into a mobile-first dual architecture:
   * Desktop/Tablet: persistent / collapsible aside.
   * Mobile (< 768px): clean top header with ☰ trigger + full off-canvas drawer.
   */
  public static getDrawerNavigationTemplate(brandName: string, navItems: Array<{ id: string; label: string; icon: string }>): {
    desktopAside: string;
    mobileHeaderAndDrawer: string;
  } {
    const desktopItems = navItems
      .map(
        (item) => `
        <button onclick="switchTab('${item.id}')" id="nav-btn-${item.id}" class="nav-btn w-full text-left text-slate-300 hover:bg-slate-800 hover:text-white px-3.5 py-3 rounded-xl font-medium text-sm flex items-center space-x-3 transition min-h-[44px]">
          <i class="${item.icon} w-5 text-center text-sky-400"></i>
          <span>${item.label}</span>
        </button>`
      )
      .join('\n');

    const mobileItems = navItems
      .map(
        (item) => `
        <button onclick="switchTab('${item.id}'); closeMobileDrawer();" class="w-full text-left text-slate-200 hover:bg-slate-800 px-4 py-3.5 rounded-xl font-medium text-base flex items-center space-x-3.5 min-h-[48px] active:bg-sky-600/30">
          <i class="${item.icon} w-6 text-center text-sky-400"></i>
          <span>${item.label}</span>
        </button>`
      )
      .join('\n');

    return {
      desktopAside: `
        <aside class="hidden md:flex flex-col w-64 bg-slate-950/80 border-r border-slate-800 p-4 space-y-1.5 flex-shrink-0">
          <div class="text-[10px] font-bold text-slate-500 uppercase px-3 py-2 tracking-wider">Módulos do Sistema</div>
          ${desktopItems}
        </aside>`,
      mobileHeaderAndDrawer: `
        <!-- Mobile Header Bar (Visible on < 768px) -->
        <div class="md:hidden flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-800 sticky top-0 z-30">
          <button onclick="openMobileDrawer()" class="min-h-[44px] min-w-[44px] flex items-center justify-center text-white p-2 rounded-xl bg-slate-800 border border-slate-700 active:scale-95" aria-label="Abrir Menu Principal">
            <i class="fa-solid fa-bars text-lg"></i>
          </button>
          <div class="font-bold text-sm text-white flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-sky-400"></span>
            <span id="mobile-current-title">${brandName}</span>
          </div>
          <div class="min-w-[44px]"></div>
        </div>

        <!-- Mobile Off-Canvas Drawer Backdrop & Sheet -->
        <div id="mobile-drawer-backdrop" onclick="closeMobileDrawer()" class="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 hidden opacity-0 transition-opacity duration-300"></div>
        <div id="mobile-drawer-sheet" class="fixed top-0 bottom-0 left-0 w-4/5 max-w-xs bg-slate-950 border-r border-slate-850 z-50 transform -translate-x-full transition-transform duration-300 ease-in-out flex flex-col p-4 shadow-2xl">
          <div class="flex items-center justify-between pb-4 border-b border-slate-850 mb-4">
            <div class="font-black text-white text-lg">${brandName}</div>
            <button onclick="closeMobileDrawer()" class="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-white" aria-label="Fechar Menu">
              <i class="fa-solid fa-xmark text-lg"></i>
            </button>
          </div>
          <div class="flex-1 overflow-y-auto space-y-1">
            ${mobileItems}
          </div>
        </div>`
    };
  }
}
