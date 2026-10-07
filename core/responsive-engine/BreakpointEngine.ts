import { RESPONSIVE_BREAKPOINTS, BreakpointConfig } from './ResponsiveRules.ts';

export type DeviceCategory = 'mobile' | 'tablet' | 'desktop';

export class BreakpointEngine {
  public static getDeviceCategory(width: number): DeviceCategory {
    if (width < 768) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
  }

  public static getBreakpointForWidth(width: number): BreakpointConfig {
    for (const key of Object.keys(RESPONSIVE_BREAKPOINTS)) {
      const bp = RESPONSIVE_BREAKPOINTS[key];
      if (width >= bp.minWidth && (!bp.maxWidth || width <= bp.maxWidth)) {
        return bp;
      }
    }
    return RESPONSIVE_BREAKPOINTS.desktop1440;
  }

  public static getAdaptiveColumns(device: DeviceCategory): number {
    switch (device) {
      case 'mobile':
        return 1;
      case 'tablet':
        return 2;
      case 'desktop':
        return 4;
    }
  }
}
