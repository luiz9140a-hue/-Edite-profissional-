export class FormResponsiveEngine {
  /**
   * Transforms forms into single-column 100% width inputs on Mobile (< 768px),
   * and dual-column grids on Tablet/Desktop, with >= 44px min-height touch targets.
   */
  public static getFormWrapperClasses(): string {
    return 'grid grid-cols-1 md:grid-cols-2 gap-4 w-full';
  }

  public static getInputClasses(): string {
    return 'w-full bg-slate-950 border border-slate-800 text-white p-3 rounded-xl min-h-[44px] text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/50';
  }
}
