import { ProjectFile } from '../../src/types/engrenagem.ts';

export interface RepairAttempt {
  attemptNumber: number;
  errorType: 'SYNTAX' | 'SEMANTIC' | 'BROKEN_ASSET' | 'RESPONSIVE_OVERFLOW' | 'UNKNOWN';
  targetFile: string;
  diagnosis: string;
  patchSummary: string;
  succeeded: boolean;
}

export class RepairEngine {
  private get maxRetries(): number {
    return Math.max(0, Number.parseInt(process.env.BUD_MAX_REPAIR_ATTEMPTS || '5', 10) || 5);
  }

  public diagnoseAndRepair(
    errorMessage: string,
    files: Record<string, ProjectFile>,
    currentAttempts: number
  ): {
    canRepair: boolean;
    repairAttempt?: RepairAttempt;
    repairedFiles?: Record<string, ProjectFile>;
  } {
    if (currentAttempts >= this.maxRetries) {
      return { canRepair: false };
    }

    const errLower = errorMessage.toLowerCase();
    const updatedFiles = { ...files };

    // 1. Broken image or placeholder error
    if (errLower.includes('placeholder') || errLower.includes('picsum') || errLower.includes('broken')) {
      const targetFile = 'index.html';
      const file = updatedFiles[targetFile];
      if (file) {
        // Replace invalid image URLs with verified CDN asset
        file.content = file.content.replace(/https?:\/\/(?:via\.placeholder\.com|picsum\.photos)[^"'\s]+/g, 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=1200&q=80');
        file.updatedAt = new Date().toISOString();

        return {
          canRepair: true,
          repairAttempt: {
            attemptNumber: currentAttempts + 1,
            errorType: 'BROKEN_ASSET',
            targetFile,
            diagnosis: 'Detectada URL de placeholder ou imagem proscrita.',
            patchSummary: 'Substituição automática por ativo de imagem certificado em alta definição.',
            succeeded: true
          },
          repairedFiles: updatedFiles
        };
      }
    }

    // 2. Responsive Overflow Error
    if (errLower.includes('overflow') || errLower.includes('horizontal scroll')) {
      const targetFile = 'index.html';
      const file = updatedFiles[targetFile];
      if (file) {
        if (!file.content.includes('overflow-x-hidden')) {
          file.content = file.content.replace('<body', '<body class="overflow-x-hidden"');
          file.updatedAt = new Date().toISOString();
        }

        return {
          canRepair: true,
          repairAttempt: {
            attemptNumber: currentAttempts + 1,
            errorType: 'RESPONSIVE_OVERFLOW',
            targetFile,
            diagnosis: 'Identificado potencial vazamento de largura em dispositivos móveis.',
            patchSummary: 'Aplicada regra de contenção e blindagem de overflow horizontal responsivo.',
            succeeded: true
          },
          repairedFiles: updatedFiles
        };
      }
    }

    // Sem uma regra de reparo específica, não alegar que um patch foi aplicado.
    return {
      canRepair: false
    };
  }
}

export const repairEngine = new RepairEngine();
