import { IntentContract } from '../../src/types/engrenagem';

export type ProjectClassification = 
  | 'WEBSITE' | 'LANDING_PAGE' | 'ECOMMERCE' | 'DELIVERY' 
  | 'SAAS' | 'BLOG' | 'CRM' | 'DASHBOARD' | 'WEB_APP'
  | 'AI_APP' | 'BUSINESS_SYSTEM' | 'PORTAL' | 'INTERNAL_TOOL';

export class ProjectClassifier {
  public static classify(intent: IntentContract): ProjectClassification {
    if (intent.projectType === 'saas') return 'SAAS';
    if (intent.projectType === 'blog') return 'BLOG';
    if (intent.projectType === 'ecommerce') return 'ECOMMERCE';
    if (intent.projectType === 'delivery') return 'DELIVERY';
    if (intent.projectType === 'landing_page') return 'LANDING_PAGE';
    if (intent.projectType === 'website') return 'WEBSITE';
    if (intent.projectType === 'dashboard') return 'DASHBOARD';
    
    return 'WEB_APP'; // Default
  }
}
