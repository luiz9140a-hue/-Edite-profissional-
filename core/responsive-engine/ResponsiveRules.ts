export interface BreakpointConfig {
  name: string;
  minWidth: number;
  maxWidth?: number;
  columns: number;
  padding: string;
  gap: string;
  touchTargetMin: number; // in pixels (44px min)
}

export const RESPONSIVE_BREAKPOINTS: Record<string, BreakpointConfig> = {
  mobile320: { name: 'Mobile Compact', minWidth: 320, maxWidth: 374, columns: 1, padding: '12px', gap: '12px', touchTargetMin: 44 },
  mobile375: { name: 'Mobile Standard', minWidth: 375, maxWidth: 389, columns: 1, padding: '16px', gap: '12px', touchTargetMin: 44 },
  mobile390: { name: 'Mobile Pro', minWidth: 390, maxWidth: 413, columns: 1, padding: '16px', gap: '16px', touchTargetMin: 44 },
  mobile414: { name: 'Mobile Plus/Max', minWidth: 414, maxWidth: 479, columns: 1, padding: '16px', gap: '16px', touchTargetMin: 44 },
  mobile480: { name: 'Mobile Large', minWidth: 480, maxWidth: 639, columns: 1, padding: '18px', gap: '16px', touchTargetMin: 44 },
  tablet640: { name: 'Tablet Small', minWidth: 640, maxWidth: 767, columns: 2, padding: '20px', gap: '18px', touchTargetMin: 44 },
  tablet768: { name: 'Tablet Standard', minWidth: 768, maxWidth: 1023, columns: 2, padding: '24px', gap: '20px', touchTargetMin: 44 },
  desktop1024: { name: 'Desktop Compact', minWidth: 1024, maxWidth: 1279, columns: 3, padding: '24px', gap: '20px', touchTargetMin: 40 },
  desktop1280: { name: 'Desktop Standard', minWidth: 1280, maxWidth: 1439, columns: 4, padding: '32px', gap: '24px', touchTargetMin: 36 },
  desktop1440: { name: 'Desktop Widescreen', minWidth: 1440, maxWidth: 1919, columns: 4, padding: '32px', gap: '24px', touchTargetMin: 36 },
  desktop1920: { name: 'Desktop Ultra', minWidth: 1920, columns: 4, padding: '40px', gap: '32px', touchTargetMin: 36 }
};

export const GLOBAL_RESPONSIVE_RULES = {
  RESPONSIVE_REQUIRED: true,
  TOUCH_TARGET_MIN_PX: 44,
  MAX_MOBILE_WIDTH: 767,
  MIN_TABLET_WIDTH: 768,
  MIN_DESKTOP_WIDTH: 1024,
  PREVENT_HORIZONTAL_OVERFLOW: true,
  CARD_VIEW_THRESHOLD: 768, // Tables convert to Cards under 768px
  DRAWER_NAV_THRESHOLD: 768  // Sidebars convert to Mobile Drawers under 768px
};
