export interface IntakeMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface IntakeResult {
  status: 'QUESTION' | 'READY';
  message: string;
  prompt?: string;
  collected: {
    original?: string;
    niche?: string;
    details?: string;
  };
}

function hasSaaSIntent(text: string): boolean {
  return /\b(saas|software|plataforma|sistema|app|aplicativo)\b/i.test(text);
}

function hasNiche(text: string): boolean {
  return /\b(academia|fitness|odont|dentista|cl[ií]nica|m[eé]dica|restaurante|delivery|loja|venda|crm|imobili[aá]ria|escola|curso|contabilidade|advocacia|sal[aã]o|pet|log[ií]stica|financeir|marketing|constru[cç][aã]o|hotel|turismo)/i.test(text);
}

export function runBudIntake(message: string, history: IntakeMessage[] = []): IntakeResult {
  const userMessages = [...history.filter(item => item.role === 'user').map(item => item.content), message.trim()].filter(Boolean);
  const original = userMessages[0] || message.trim();
  const joined = userMessages.join(' ');
  const nicheRaw = userMessages.find(item => hasNiche(item));
  const niche = nicheRaw?.replace(/^\s*para\s+/i, '').trim();
  const firstMessageAlreadyHasNiche = hasNiche(original);
  const details = firstMessageAlreadyHasNiche
    ? userMessages.slice(1).join(' ') || undefined
    : userMessages.length > 2
      ? userMessages.slice(2).join(' ') || undefined
      : undefined;

  if (!hasSaaSIntent(joined)) {
    return { status: 'READY', message: 'Entendi. Vou iniciar a geração com os requisitos informados.', prompt: joined, collected: { original } };
  }

  if (!niche) {
    return {
      status: 'QUESTION',
      message: 'Qual é o nicho da sua SaaS? Por exemplo: academia, clínica odontológica, imobiliária, escola, vendas ou logística.',
      collected: { original }
    };
  }

  if (!details || details.trim().length < 12) {
    return {
      status: 'QUESTION',
      message: `Perfeito: vou criar uma SaaS para ${niche}. Quais funções ela precisa ter? Descreva login, painel, cadastros, agenda, pagamentos ou outros detalhes importantes.`,
      collected: { original, niche }
    };
  }

  const prompt = `${original}. Nicho confirmado: ${niche}. Requisitos detalhados: ${details}. Gere uma SaaS funcional, responsiva, com navegação, estados, ações clicáveis e dados de demonstração coerentes com o nicho.`;
  return {
    status: 'READY',
    message: 'Requisitos completos. Vou analisar a arquitetura e gerar sua SaaS funcional agora.',
    prompt,
    collected: { original, niche, details }
  };
}
