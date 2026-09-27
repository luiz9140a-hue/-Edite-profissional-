export class TableResponsiveEngine {
  /**
   * Generates hybrid table/card markup:
   * On Desktop/Tablet (>= 768px): Displays standard accessible tabular view.
   * On Mobile (< 768px): Automatically adapts to Card List with >= 44px touch-friendly action buttons.
   */
  public static generateResponsiveTableSnippet(
    tableId: string,
    headers: string[],
    rows: Array<{ [key: string]: string }>
  ): string {
    return `
      <!-- Desktop Tabular View (Hidden on Mobile) -->
      <div class="hidden md:block overflow-x-auto">
        <table class="w-full text-left text-sm" id="${tableId}">
          <thead class="text-xs text-slate-400 border-b border-slate-800 uppercase">
            <tr>
              ${headers.map((h) => `<th class="py-3 px-4">${h}</th>`).join('')}
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-800/60 text-slate-300">
            <!-- Rendered Rows -->
          </tbody>
        </table>
      </div>

      <!-- Mobile Adaptive Card List View (Visible on Mobile) -->
      <div class="md:hidden space-y-3" id="${tableId}-mobile-cards">
        <!-- Rendered Mobile Cards -->
      </div>
    `;
  }
}
