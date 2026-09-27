import { IntentContract } from '../../src/types/engrenagem';
import { createSupremeBuildGraph, SupremeBuildGraph } from '../supreme-build/SupremeBuildOrchestrator';

export interface TaskNode {
  id: string;
  name: string;
  type: 'architecture' | 'files' | 'dependencies' | 'build' | 'test' | 'qa' | 'preview';
  status: 'QUEUED' | 'RUNNING' | 'SUCCESS' | 'FAILED' | 'BLOCKED';
  dependencies: string[];
  description: string;
}

export interface ProjectPlan {
  projectId: string;
  intent: IntentContract;
  architecture: {
    framework: string;
    styleSystem: string;
    runtime: string;
    modules: string[];
    components: string[];
  };
  dependencies: Record<string, string>;
  tasks: TaskNode[];
  executionGraph: SupremeBuildGraph;
}

export class Planner {
  public createPlan(projectId: string, intent: IntentContract): ProjectPlan {
    const isHealthcare = intent.domain === 'healthcare';
    const isFood = intent.domain === 'food_delivery';

    const modules = isHealthcare
      ? ['Dashboard Clínico', 'Gestão de Pacientes', 'Agenda Médica', 'Prontuários Digitais', 'Faturamento']
      : isFood
      ? ['Cardápio Interativo', 'Carrinho Reativo', 'Checkout WhatsApp', 'Cálculo de Entrega', 'Filtro por Categorias']
      : ['Landing Page Hero', 'Catálogo de Produtos/Serviços', 'Contato e Localização', 'Rodapé Institucional'];

    const components = isHealthcare
      ? ['DentalDashboard', 'PatientList', 'ScheduleCalendar', 'MedicalRecord', 'StatCard']
      : isFood
      ? ['BurgerHero', 'ProductMenu', 'CartModal', 'CheckoutDrawer', 'CategoryPills']
      : ['Header', 'HeroSection', 'FeaturesGrid', 'ContactForm', 'Footer'];

    const dependencies: Record<string, string> = {
      react: '^19.0.0',
      'react-dom': '^19.0.0',
      'lucide-react': '^0.546.0',
      tailwindcss: '^4.0.0'
    };

    const tasks: TaskNode[] = [
      {
        id: 'task-intent',
        name: 'Análise de Intenção e Contrato Semântico',
        type: 'architecture',
        status: 'SUCCESS',
        dependencies: [],
        description: 'Interpretação semântica e bloqueio de conceitos proibidos.'
      },
      {
        id: 'task-scaffold',
        name: 'Geração de Estrutura de Arquivos e Componentes',
        type: 'files',
        status: 'QUEUED',
        dependencies: ['task-intent'],
        description: 'Criação de index.html, package.json, src/App.tsx e componentes.'
      },
      {
        id: 'task-build',
        name: 'Compilação e Verificação Estrutural',
        type: 'build',
        status: 'QUEUED',
        dependencies: ['task-scaffold'],
        description: 'Verificação de integridade sintática e geração do bundle.'
      },
      {
        id: 'task-qa',
        name: 'Matriz de Testes QA (Responsivo, Semântica e Broken Images)',
        type: 'qa',
        status: 'QUEUED',
        dependencies: ['task-build'],
        description: 'Auditoria de 320px a 1920px, ausência de placeholders e aderência de domínio.'
      },
      {
        id: 'task-preview',
        name: 'Deploy no Sandbox e Montagem do Preview',
        type: 'preview',
        status: 'QUEUED',
        dependencies: ['task-qa'],
        description: 'Disponibilização da aplicação funcional no iframe isolado.'
      }
    ];

    return {
      projectId,
      intent,
      architecture: {
        framework: 'React 19 (SPA)',
        styleSystem: 'Tailwind CSS 4.0',
        runtime: 'Node.js 22 (ESM)',
        modules,
        components
      },
      dependencies,
      tasks,
      executionGraph: createSupremeBuildGraph(intent)
    };
  }
}

export const planner = new Planner();
