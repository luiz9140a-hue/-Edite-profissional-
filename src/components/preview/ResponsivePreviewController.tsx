import React from 'react';
import {
  Laptop,
  Tablet,
  Smartphone,
  RotateCw,
  ExternalLink,
  Maximize2,
  RefreshCw,
  Repeat
} from 'lucide-react';

export type DeviceMode = 'desktop' | 'tablet' | 'phone';
export type PhonePreset = '320' | '375' | '390' | '414';
export type Orientation = 'portrait' | 'landscape';

export interface ViewportDimensions {
  width: number;
  height: number;
}

export const PHONE_PRESETS: Record<PhonePreset, { label: string; portrait: ViewportDimensions; landscape: ViewportDimensions }> = {
  '320': {
    label: '320 × 568 (SE)',
    portrait: { width: 320, height: 568 },
    landscape: { width: 568, height: 320 }
  },
  '375': {
    label: '375 × 667 (Padrão)',
    portrait: { width: 375, height: 667 },
    landscape: { width: 667, height: 375 }
  },
  '390': {
    label: '390 × 844 (Pro)',
    portrait: { width: 390, height: 844 },
    landscape: { width: 844, height: 390 }
  },
  '414': {
    label: '414 × 896 (Max)',
    portrait: { width: 414, height: 896 },
    landscape: { width: 896, height: 414 }
  }
};

interface Props {
  deviceMode: DeviceMode;
  setDeviceMode: (mode: DeviceMode) => void;
  phonePreset: PhonePreset;
  setPhonePreset: (preset: PhonePreset) => void;
  orientation: Orientation;
  setOrientation: (o: Orientation) => void;
  onReload: () => void;
  onOpenNewTab: () => void;
  onToggleFullscreen?: () => void;
  isReloading?: boolean;
}

export default function ResponsivePreviewController({
  deviceMode,
  setDeviceMode,
  phonePreset,
  setPhonePreset,
  orientation,
  setOrientation,
  onReload,
  onOpenNewTab,
  onToggleFullscreen,
  isReloading = false
}: Props) {
  const toggleOrientation = () => {
    setOrientation(orientation === 'portrait' ? 'landscape' : 'portrait');
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-1.5 bg-slate-950/90 border-b border-slate-800 text-xs select-none">
      {/* Device Mode Switcher */}
      <div className="flex items-center space-x-1.5">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-0.5 flex items-center space-x-0.5">
          <button
            onClick={() => setDeviceMode('desktop')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
              deviceMode === 'desktop'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Visualização Desktop Fluida (100%)"
          >
            <Laptop className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Desktop</span>
          </button>

          <button
            onClick={() => setDeviceMode('tablet')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
              deviceMode === 'tablet'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Visualização Tablet (768px)"
          >
            <Tablet className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Tablet</span>
          </button>

          <button
            onClick={() => setDeviceMode('phone')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
              deviceMode === 'phone'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Visualização Phone com Moldura Real"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Phone</span>
          </button>
        </div>

        {/* Phone Preset Selector (Visible only when in Phone mode) */}
        {deviceMode === 'phone' && (
          <div className="flex items-center space-x-1 bg-slate-900 border border-slate-800 rounded-xl p-0.5 animate-fadeIn">
            {(['320', '375', '390', '414'] as PhonePreset[]).map((preset) => (
              <button
                key={preset}
                onClick={() => setPhonePreset(preset)}
                className={`px-2 py-0.5 rounded-lg text-[11px] font-mono transition ${
                  phonePreset === preset
                    ? 'bg-blue-600/30 text-blue-300 font-bold border border-blue-500/40'
                    : 'text-slate-400 hover:text-white'
                }`}
                title={PHONE_PRESETS[preset].label}
              >
                {preset}
              </button>
            ))}

            {/* Orientation Toggle */}
            <button
              onClick={toggleOrientation}
              className={`p-1 rounded-lg text-xs transition ml-1 ${
                orientation === 'landscape' ? 'text-amber-400 bg-amber-500/10' : 'text-slate-400 hover:text-white'
              }`}
              title={`Alternar Orientação (${orientation === 'portrait' ? 'Vertical' : 'Horizontal'})`}
            >
              <Repeat className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Control Actions */}
      <div className="flex items-center space-x-1.5">
        <button
          onClick={onReload}
          disabled={isReloading}
          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-900 rounded-lg border border-slate-800 transition flex items-center gap-1 text-[11px]"
          title="Recarregar Preview (↻)"
        >
          <RotateCw className={`w-3.5 h-3.5 ${isReloading ? 'animate-spin text-blue-400' : ''}`} />
          <span className="hidden md:inline">Atualizar</span>
        </button>

        {onToggleFullscreen && (
          <button
            onClick={onToggleFullscreen}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-900 rounded-lg border border-slate-800 transition hidden sm:flex items-center gap-1 text-[11px]"
            title="Alternar Tela Cheia"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        )}

        <button
          onClick={onOpenNewTab}
          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-900 rounded-lg border border-slate-800 transition flex items-center gap-1 text-[11px]"
          title="Abrir em Nova Aba Independente"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Nova Aba</span>
        </button>
      </div>
    </div>
  );
}
