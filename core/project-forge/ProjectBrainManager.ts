import { ProjectBrain, IntentContract } from '../../src/types/engrenagem';

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
}
