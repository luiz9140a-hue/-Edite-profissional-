export type JobStatus =
  | 'QUEUED'
  | 'ANALYZING'
  | 'PLANNING'
  | 'RESEARCHING'
  | 'EXECUTING'
  | 'BUILDING'
  | 'TESTING'
  | 'QA'
  | 'REPAIRING'
  | 'READY'
  | 'FAILED'
  | 'CANCELLED';

export interface IntentContract {
  projectType: 'website' | 'saas' | 'ecommerce' | 'landing_page' | 'dashboard' | 'delivery';
  businessType: string;
  businessName: string;
  domain: string;
  targetAudience: string;
  primaryGoal: string;
  requiredFeatures: string[];
  visualConcepts: string[];
  requiredAssets: string[];
  forbiddenAssets: string[];
  colorPalette: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
  responsiveRequired: boolean;
  mobileRequired: boolean;
  desktopRequired: boolean;
}

export interface ProjectFile {
  path: string;
  content: string;
  language: string;
  updatedAt: string;
}

export interface QAResult {
  metric: string;
  status: 'PASS' | 'WARN' | 'FAIL';
  details: string;
}

export interface ResponsiveBreakpointsQA {
  mobile320: 'PASS' | 'FAIL';
  mobile375: 'PASS' | 'FAIL';
  mobile390: 'PASS' | 'FAIL';
  mobile414: 'PASS' | 'FAIL';
  tablet768: 'PASS' | 'FAIL';
  tablet1024: 'PASS' | 'FAIL';
  desktop1280: 'PASS' | 'FAIL';
  desktop1440: 'PASS' | 'FAIL';
  desktop1920: 'PASS' | 'FAIL';
}

export interface ProjectReadiness {
  build: 'PASS' | 'FAIL';
  tests: 'PASS' | 'FAIL';
  semantic: 'PASS' | 'FAIL';
  assets: 'PASS' | 'FAIL';
  responsive: 'PASS' | 'FAIL';
  functional: 'PASS' | 'FAIL';
  visual: 'PASS' | 'FAIL';
  brokenImages: 'PASS' | 'FAIL';
  ready: boolean;
  score: number;
  responsiveBreakpoints?: ResponsiveBreakpointsQA;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'success' | 'agent';
  agent?: string;
  message: string;
  step?: JobStatus;
}

export interface ProjectBrain {
  projectId: string;
  originalRequest: string;
  currentIntent: IntentContract;
  decisions: string[];
  dependencies: Record<string, string>;
  files: Record<string, ProjectFile>;
  history: Array<{
    id: string;
    prompt: string;
    timestamp: string;
    changesSummary: string;
  }>;
  repairAttempts: number;
}

export interface GenerationJob {
  id: string;
  projectId: string;
  prompt: string;
  status: JobStatus;
  currentStep: string;
  progress: number;
  logs: LogEntry[];
  qaReport: QAResult[];
  readiness: ProjectReadiness;
  createdAt: string;
  updatedAt: string;
  error?: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  prompt: string;
  status: JobStatus;
  intent: IntentContract;
  files: Record<string, ProjectFile>;
  readiness: ProjectReadiness;
  brain: ProjectBrain;
  activeJobId?: string;
  createdAt: string;
  updatedAt: string;
}
