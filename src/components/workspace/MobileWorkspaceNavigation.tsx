import React from 'react';
import { Cpu, Eye, Code, FolderTree, MoreHorizontal } from 'lucide-react';

export type MobileTab = 'preview' | 'bud' | 'code' | 'files' | 'more';

interface Props {
  activeTab: MobileTab;
  onSelectTab: (tab: MobileTab) => void;
  unreadBudCount?: number;
  hasErrors?: boolean;
}

export default function MobileWorkspaceNavigation({
  activeTab,
  onSelectTab,
  unreadBudCount = 0,
  hasErrors = false
}: Props) {
  const navItems: Array<{ id: MobileTab; label: string; icon: React.ReactNode; badge?: string | number }> = [
    {
      id: 'bud',
      label: 'BUD',
      icon: <Cpu className="w-5 h-5" />,
      badge: unreadBudCount > 0 ? unreadBudCount : undefined
    },
    {
      id: 'preview',
      label: 'Preview',
      icon: <Eye className="w-5 h-5" />
    },
    {
      id: 'code',
      label: 'Código',
      icon: <Code className="w-5 h-5" />
    },
    {
      id: 'files',
      label: 'Arquivos',
      icon: <FolderTree className="w-5 h-5" />
    },
    {
      id: 'more',
      label: 'Mais',
      icon: <MoreHorizontal className="w-5 h-5" />,
      badge: hasErrors ? '!' : undefined
    }
  ];

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-950/95 backdrop-blur-lg border-t border-slate-800/90 px-2 flex justify-around items-center"
      style={{
        paddingBottom: 'max(8px, env(safe-area-inset-bottom, 8px))',
        paddingTop: '6px'
      }}
      role="navigation"
      aria-label="Navegação Principal do Workspace Mobile"
    >
      {navItems.map((item) => {
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onSelectTab(item.id)}
            className={`flex-1 min-h-[44px] min-w-[44px] py-1 flex flex-col items-center justify-center relative rounded-xl transition-all select-none active:scale-95 ${
              isActive
                ? 'text-blue-400 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            aria-current={isActive ? 'page' : undefined}
          >
            <div className="relative">
              {item.icon}
              {item.badge && (
                <span className="absolute -top-1 -right-2 bg-blue-500 text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full border border-slate-900 animate-pulse">
                  {item.badge}
                </span>
              )}
            </div>
            <span className={`text-[10px] mt-1 ${isActive ? 'font-black tracking-tight' : 'font-medium'}`}>
              {item.label}
            </span>
            {isActive && (
              <span className="absolute bottom-0 w-8 h-1 bg-blue-500 rounded-full shadow-lg shadow-blue-500/50"></span>
            )}
          </button>
        );
      })}
    </nav>
  );
}
