export interface InteractionTest {
  id: string;
  testId: string;
  description: string;
  action: 'click' | 'submit' | 'navigate';
  expectedState: string;
}

export class InteractionTestEngine {
  public runTests(projectId: string, tests: InteractionTest[]): { passed: number; failed: number; results: any[] } {
    // This will implement the actual execution of interaction tests against the preview
    return { passed: 0, failed: 0, results: [] };
  }
}

export const interactionTestEngine = new InteractionTestEngine();
