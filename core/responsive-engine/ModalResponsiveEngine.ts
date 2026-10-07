export class ModalResponsiveEngine {
  /**
   * Generates safe responsive modal classes:
   * Desktop: centered dialog max-w-lg
   * Mobile: width: calc(100% - 24px), max-height: calc(100vh - 32px), with internal scroll.
   */
  public static getModalContainerClasses(): string {
    return 'fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm';
  }

  public static getModalDialogClasses(): string {
    return 'bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg max-h-[92vh] overflow-y-auto p-5 sm:p-6 shadow-2xl relative';
  }
}
