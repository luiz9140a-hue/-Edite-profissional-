export interface InteractionDefinition {
  id: string;
  name: string;
  description: string;
  trigger: 'click' | 'submit' | 'keydown' | 'change' | 'command';
  permission: 'public' | 'project_owner' | 'admin';
  handler: string;
  api: string;
  jobType?: string;
  tool?: string;
  successEvent: string;
  errorEvent: string;
  status: 'CONNECTED' | 'PARTIAL' | 'NOT_CONFIGURED' | 'BROKEN';
}

export class InteractionRegistry {
  private interactions: Map<string, InteractionDefinition> = new Map();

  constructor() {
    this.registerDefaults();
  }

  private registerDefaults() {
    const defaultInteractions: InteractionDefinition[] = [
      {
        id: 'CREATE_PROJECT',
        name: 'Criar Projeto',
        description: 'Inicializa novo projeto e dispara o JobEngine de criação.',
        trigger: 'submit',
        permission: 'public',
        handler: 'jobEngine.createJob',
        api: 'POST /api/generation/jobs',
        jobType: 'CREATION',
        tool: 'projectGenerator',
        successEvent: 'JOB_CREATED',
        errorEvent: 'JOB_FAILED',
        status: 'CONNECTED'
      },
      {
        id: 'SEND_BUD_MESSAGE',
        name: 'Enviar Instrução BUD',
        description: 'Processa comando em linguagem natural e executa alterações no projeto.',
        trigger: 'submit',
        permission: 'project_owner',
        handler: 'jobEngine.runEdit',
        api: 'POST /api/bud/run',
        jobType: 'EDIT',
        tool: 'commandRouter',
        successEvent: 'BUD_RESPONSE_RECEIVED',
        errorEvent: 'BUD_COMMAND_FAILED',
        status: 'CONNECTED'
      },
      {
        id: 'RUN_BUILD',
        name: 'Compilar Projeto (Build)',
        description: 'Executa verificação e compilação de sintaxe e tipos do projeto.',
        trigger: 'click',
        permission: 'project_owner',
        handler: 'server.handleBuild',
        api: 'POST /api/projects/:id/build',
        tool: 'buildEngine',
        successEvent: 'BUILD_COMPLETED',
        errorEvent: 'BUILD_FAILED',
        status: 'CONNECTED'
      },
      {
        id: 'RUN_TEST',
        name: 'Executar Testes',
        description: 'Roda testes funcionais, unitários e de componentes.',
        trigger: 'click',
        permission: 'project_owner',
        handler: 'server.handleTest',
        api: 'POST /api/projects/:id/test',
        tool: 'testEngine',
        successEvent: 'TEST_COMPLETED',
        errorEvent: 'TEST_FAILED',
        status: 'CONNECTED'
      },
      {
        id: 'RUN_QA',
        name: 'Auditoria de QA',
        description: 'Audita conformidade semântica, responsividade e ativos em 6 dimensões.',
        trigger: 'click',
        permission: 'project_owner',
        handler: 'server.handleQA',
        api: 'POST /api/projects/:id/qa',
        tool: 'qaEngine',
        successEvent: 'QA_COMPLETED',
        errorEvent: 'QA_FAILED',
        status: 'CONNECTED'
      },
      {
        id: 'REPAIR_PROJECT',
        name: 'Corrigir com BUD',
        description: 'Diagnostica erros de build/runtime e aplica patches automáticos.',
        trigger: 'click',
        permission: 'project_owner',
        handler: 'jobEngine.runRepair',
        api: 'POST /api/projects/:id/repair',
        jobType: 'REPAIR',
        tool: 'repairEngine',
        successEvent: 'REPAIR_COMPLETED',
        errorEvent: 'REPAIR_FAILED',
        status: 'CONNECTED'
      },
      {
        id: 'RESTART_PREVIEW',
        name: 'Reiniciar Preview',
        description: 'Reinicia o sandbox de preview e valida health check.',
        trigger: 'click',
        permission: 'public',
        handler: 'previewManager.restartPreview',
        api: 'POST /api/projects/:id/preview/restart',
        successEvent: 'PREVIEW_STARTED',
        errorEvent: 'PREVIEW_FAILED',
        status: 'CONNECTED'
      },
      {
        id: 'OPEN_PREVIEW',
        name: 'Abrir Preview',
        description: 'Carrega sandbox de preview do projeto.',
        trigger: 'click',
        permission: 'public',
        handler: 'previewManager.getPreviewHtml',
        api: 'GET /api/projects/:id/preview-html',
        successEvent: 'PREVIEW_LOADED',
        errorEvent: 'PREVIEW_FAILED',
        status: 'CONNECTED'
      },
      {
        id: 'OPEN_NEW_TAB',
        name: 'Abrir em Nova Aba',
        description: 'Abre preview isolado em endpoint dedicado independente.',
        trigger: 'click',
        permission: 'public',
        handler: 'window.open',
        api: 'GET /preview/:id',
        successEvent: 'TAB_OPENED',
        errorEvent: 'TAB_FAILED',
        status: 'CONNECTED'
      },
      {
        id: 'EXPORT_PROJECT',
        name: 'Exportar Projeto',
        description: 'Gera e baixa pacote completo de arquivos e manifesto do projeto.',
        trigger: 'click',
        permission: 'project_owner',
        handler: 'server.handleExport',
        api: 'POST /api/projects/:id/export',
        successEvent: 'EXPORT_COMPLETED',
        errorEvent: 'EXPORT_FAILED',
        status: 'CONNECTED'
      },
      {
        id: 'OPEN_CODE',
        name: 'Visualizar Código',
        description: 'Carrega e exibe código fonte do arquivo selecionado.',
        trigger: 'click',
        permission: 'public',
        handler: 'workspace.selectFile',
        api: 'GET /api/projects/:id/files',
        successEvent: 'FILE_LOADED',
        errorEvent: 'FILE_FAILED',
        status: 'CONNECTED'
      },
      {
        id: 'OPEN_FILES',
        name: 'Navegar Arquivos',
        description: 'Exibe lista limpa de arquivos com alternância para avançados.',
        trigger: 'click',
        permission: 'public',
        handler: 'workspace.setTab',
        api: 'GET /api/projects/:id/files',
        successEvent: 'FILES_LISTED',
        errorEvent: 'FILES_FAILED',
        status: 'CONNECTED'
      },
      {
        id: 'DEPLOY_PROJECT',
        name: 'Publicar / Deploy',
        description: 'Executa deploy real no Cloud Run ou provedor configurado.',
        trigger: 'click',
        permission: 'project_owner',
        handler: 'server.handleDeploy',
        api: 'POST /api/projects/:id/deploy',
        successEvent: 'DEPLOY_COMPLETED',
        errorEvent: 'DEPLOY_FAILED',
        status: 'CONNECTED'
      },
      {
        id: 'OPEN_GITHUB',
        name: 'Sincronizar GitHub',
        description: 'Consulta status de repositório e sincronização com GitHub.',
        trigger: 'click',
        permission: 'project_owner',
        handler: 'server.handleGitHub',
        api: 'GET /api/projects/:id/github',
        successEvent: 'GITHUB_SYNCED',
        errorEvent: 'GITHUB_FAILED',
        status: 'CONNECTED'
      }
    ];

    defaultInteractions.forEach((item) => this.interactions.set(item.id, item));
  }

  public get(id: string): InteractionDefinition | undefined {
    return this.interactions.get(id);
  }

  public getAll(): InteractionDefinition[] {
    return Array.from(this.interactions.values());
  }

  public register(interaction: InteractionDefinition) {
    this.interactions.set(interaction.id, interaction);
  }
}

export const interactionRegistry = new InteractionRegistry();
