export type BudEventType =
  | 'JOB_CREATED'
  | 'INTENT_ANALYZED'
  | 'PLAN_CREATED'
  | 'FILE_CREATED'
  | 'FILE_UPDATED'
  | 'PACKAGE_INSTALLED'
  | 'COMMAND_STARTED'
  | 'COMMAND_FINISHED'
  | 'BUILD_STARTED'
  | 'BUILD_FAILED'
  | 'BUILD_SUCCEEDED'
  | 'TEST_STARTED'
  | 'TEST_FAILED'
  | 'TEST_SUCCEEDED'
  | 'QA_STARTED'
  | 'QA_FAILED'
  | 'QA_SUCCEEDED'
  | 'REPAIR_STARTED'
  | 'REPAIR_SUCCEEDED'
  | 'PREVIEW_STARTED'
  | 'PROJECT_READY'
  | 'PROJECT_FAILED';

export interface BudEvent {
  id: string;
  projectId: string;
  jobId: string;
  type: BudEventType;
  timestamp: string;
  payload: any;
}

export type EventListener = (event: BudEvent) => void;

export class EventEngine {
  private listeners: Map<string, Set<EventListener>> = new Map();
  private globalListeners: Set<EventListener> = new Set();
  private eventHistory: BudEvent[] = [];

  public emit(projectId: string, jobId: string, type: BudEventType, payload: any = {}): BudEvent {
    const event: BudEvent = {
      id: 'evt-' + Math.random().toString(36).substring(2, 9),
      projectId,
      jobId,
      type,
      timestamp: new Date().toISOString(),
      payload
    };

    this.eventHistory.push(event);
    if (this.eventHistory.length > 500) {
      this.eventHistory.shift();
    }

    const projectListeners = this.listeners.get(projectId);
    if (projectListeners) {
      projectListeners.forEach(listener => {
        try {
          listener(event);
        } catch (e) {
          console.error(`Erro ao disparar evento ${type}:`, e);
        }
      });
    }

    this.globalListeners.forEach(listener => {
      try {
        listener(event);
      } catch (e) {
        console.error(`Erro ao disparar evento global ${type}:`, e);
      }
    });

    return event;
  }

  public onProject(projectId: string, listener: EventListener): () => void {
    if (!this.listeners.has(projectId)) {
      this.listeners.set(projectId, new Set());
    }
    this.listeners.get(projectId)!.add(listener);

    return () => {
      this.listeners.get(projectId)?.delete(listener);
    };
  }

  public getHistory(projectId?: string): BudEvent[] {
    if (projectId) {
      return this.eventHistory.filter(e => e.projectId === projectId);
    }
    return this.eventHistory;
  }
}

export const eventEngine = new EventEngine();
