export interface RoutedCommand {
  intent: string;
  action: string;
  parameters: Record<string, any>;
  requiresConfirmation: boolean;
  description: string;
}

export class CommandRouter {
  public route(input: string): RoutedCommand {
    const text = input.trim().toLowerCase();

    // 1. Build / Compilation
    if (text.includes('build') || text.includes('compilar') || text.includes('compile')) {
      return {
        intent: 'RUN_BUILD',
        action: 'executeBuild',
        parameters: {},
        requiresConfirmation: false,
        description: 'Compilando e verificando integridade sintática do código.'
      };
    }

    // 2. Tests
    if (text.includes('teste') || text.includes('testar') || text.includes('test')) {
      return {
        intent: 'RUN_TESTS',
        action: 'executeTests',
        parameters: {},
        requiresConfirmation: false,
        description: 'Executando testes automatizados funcionais e de componentes.'
      };
    }

    // 3. QA
    if (text.includes('qa') || text.includes('auditoria') || text.includes('qualidade')) {
      return {
        intent: 'RUN_QA',
        action: 'executeQA',
        parameters: {},
        requiresConfirmation: false,
        description: 'Executando auditoria completa em 6 dimensões de QA.'
      };
    }

    // 4. Auto Repair
    if (text.includes('corrija') || text.includes('consert') || text.includes('reparar') || text.includes('erro') || text.includes('fix')) {
      return {
        intent: 'REPAIR_PROJECT',
        action: 'executeRepair',
        parameters: { forcePatch: true },
        requiresConfirmation: false,
        description: 'Iniciando diagnóstico autônomo e reparo de código pelo BUD.'
      };
    }

    // 5. Deploy / Publish
    if (text.includes('publiqu') || text.includes('deploy') || text.includes('publicar') || text.includes('lançar')) {
      return {
        intent: 'DEPLOY_PROJECT',
        action: 'executeDeploy',
        parameters: { target: 'cloud_run' },
        requiresConfirmation: false,
        description: 'Iniciando pipeline de implantação no ambiente de produção.'
      };
    }

    // 6. Change Hero Asset / Image
    if (text.includes('imagem') || text.includes('foto') || text.includes('banner') || text.includes('asset')) {
      return {
        intent: 'CHANGE_ASSET',
        action: 'replaceHeroAsset',
        parameters: { target: 'hero' },
        requiresConfirmation: false,
        description: 'Substituindo ativo visual principal por imagem certificada do domínio.'
      };
    }

    // 7. Add Appointment / Agenda
    if (text.includes('agenda') || text.includes('consulta') || text.includes('agendamento')) {
      return {
        intent: 'ADD_FEATURE',
        action: 'addFeature',
        parameters: { feature: 'APPOINTMENT_SCHEDULE' },
        requiresConfirmation: false,
        description: 'Adicionando módulo interativo de agenda e marcação de horários.'
      };
    }

    // 8. Add Patients Module
    if (text.includes('paciente') || text.includes('cadastro') || text.includes('prontuário')) {
      return {
        intent: 'ADD_FEATURE',
        action: 'addFeature',
        parameters: { feature: 'PATIENTS_MANAGEMENT' },
        requiresConfirmation: false,
        description: 'Adicionando módulo de gestão e prontuário de pacientes.'
      };
    }

    // 9. Add WhatsApp Integration
    if (text.includes('whatsapp') || text.includes('zap') || text.includes('contato')) {
      return {
        intent: 'ADD_FEATURE',
        action: 'addFeature',
        parameters: { feature: 'WHATSAPP_INTEGRATION' },
        requiresConfirmation: false,
        description: 'Adicionando botão flutuante e checkout direto via WhatsApp.'
      };
    }

    // 10. Change Colors / Theme
    if (text.includes('cor') || text.includes('cores') || text.includes('tema') || text.includes('dourado') || text.includes('azul')) {
      return {
        intent: 'CHANGE_THEME',
        action: 'updateColorPalette',
        parameters: { requestedColor: input },
        requiresConfirmation: false,
        description: 'Ajustando paleta de cores e contraste do design system.'
      };
    }

    // 11. Domain switch to Dental Clinic
    if (text.includes('dentista') || text.includes('odonto') || text.includes('clínica')) {
      return {
        intent: 'SWITCH_DOMAIN',
        action: 'generateDentalSaaS',
        parameters: { domain: 'healthcare' },
        requiresConfirmation: false,
        description: 'Transformando aplicação em SaaS completa de Gestão Odontológica.'
      };
    }

    // 12. Domain switch to Burger House / Delivery
    if (text.includes('hamburguer') || text.includes('burger') || text.includes('delivery') || text.includes('restaurante')) {
      return {
        intent: 'SWITCH_DOMAIN',
        action: 'generateBurgerDelivery',
        parameters: { domain: 'food_delivery' },
        requiresConfirmation: false,
        description: 'Transformando aplicação em Delivery Gourmet Artesanal.'
      };
    }

    // General feature edit
    return {
      intent: 'GENERIC_EDIT',
      action: 'applyBudEdit',
      parameters: { prompt: input },
      requiresConfirmation: false,
      description: `Aplicando alterações solicitadas: "${input}".`
    };
  }
}

export const commandRouter = new CommandRouter();
