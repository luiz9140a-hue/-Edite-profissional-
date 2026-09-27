export class LayoutEngine {
  /**
   * Generates safe responsive container styles with fluid clamps,
   * zero 100vw traps, and automatic safe area insets.
   */
  public static getGlobalResponsiveStyles(): string {
    return `
      /* Responsive-by-Default Core System */
      :root {
        --safe-top: env(safe-area-inset-top, 0px);
        --safe-bottom: env(safe-area-inset-bottom, 0px);
        --safe-left: env(safe-area-inset-left, 0px);
        --safe-right: env(safe-area-inset-right, 0px);
      }
      
      html, body {
        width: 100%;
        max-width: 100%;
        overflow-x: hidden;
        -webkit-text-size-adjust: 100%;
        touch-action: manipulation;
      }

      /* Touch friendly minimum targets */
      button, a, input, select, textarea, [role="button"] {
        min-height: 44px;
        min-width: 44px;
      }
      
      .btn-compact {
        min-height: 36px;
        min-width: 36px;
      }

      /* Responsive Container system */
      .responsive-container {
        width: 100%;
        max-width: 1280px;
        margin-left: auto;
        margin-right: auto;
        padding-left: clamp(12px, 4vw, 32px);
        padding-right: clamp(12px, 4vw, 32px);
      }

      /* Fluid Typography */
      .fluid-title {
        font-size: clamp(1.25rem, 3.5vw + 0.5rem, 2.25rem);
        line-height: 1.2;
      }

      .fluid-subtitle {
        font-size: clamp(0.875rem, 1.5vw + 0.5rem, 1.125rem);
        line-height: 1.4;
      }

      /* Mobile Drawer Transitions */
      .mobile-drawer-backdrop {
        transition: opacity 0.3s ease-in-out;
      }
      .mobile-drawer-sheet {
        transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      }

      /* Responsive Modal Bounds */
      @media (max-width: 767px) {
        .responsive-modal {
          width: calc(100% - 24px) !important;
          max-height: calc(100vh - 32px) !important;
          margin: 12px auto;
          border-radius: 20px;
        }
      }
    `;
  }
}
