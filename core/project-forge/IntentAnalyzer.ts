import { IntentContract } from '../../src/types/engrenagem';
import { analyzeIntent as originalAnalyzeIntent } from '../../server/engines/intentEngine';

export class IntentAnalyzer {
  public static analyze(prompt: string, currentContract?: IntentContract): IntentContract {
    // Wrap the existing engine for future extensions
    return originalAnalyzeIntent(prompt, currentContract);
  }
}
