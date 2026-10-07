import { ProjectBrain, IntentContract } from '../../src/types/engrenagem.ts';

export class ProjectBrainManager {
  public static createBrain(projectId: string, request: string, intent: IntentContract): ProjectBrain {
    return {
      projectId,
      originalRequest: request,
      currentIntent: intent,
      decisions: ['Projeto inicializado.'],
      dependencies: {},
      files: {},
      history: [{
        id: Date.now().toString(),
        prompt: 'Inicialização',
        timestamp: new Date().toISOString(),
        changesSummary: 'Projeto criado'
      }],
      repairAttempts: 0
    };
  }

  public static updateBrain(
    brain: ProjectBrain,
    update: Partial<Pick<ProjectBrain, 'currentIntent' | 'decisions' | 'dependencies' | 'files'>>
  ): ProjectBrain {
    return {
      ...brain,
      ...update,
      decisions: update.decisions || brain.decisions,
      dependencies: update.dependencies || brain.dependencies,
      files: update.files || brain.files
    };
  }

  public static checkpoint(brain: ProjectBrain, label: string, changesSummary: string): ProjectBrain {
    const timestamp = new Date().toISOString();
    return {
      ...brain,
      decisions: [...brain.decisions, `Checkpoint ${label}: ${changesSummary}`],
      history: [...brain.history, {
        id: `checkpoint-${Date.now()}`,
        prompt: label,
        timestamp,
        changesSummary
      }]
    };
  }
}
