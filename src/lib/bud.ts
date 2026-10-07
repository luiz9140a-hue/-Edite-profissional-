export type BudMessage = {
  role: 'user' | 'bud';
  content: string;
};

export async function callBud(
  messages: BudMessage[],
  currentHtml: string
): Promise<{ html: string | null; error: string | null }> {
  try {
    const response = await fetch('/api/bud', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: messages.map((m) => ({
          role: m.role === 'user' ? 'user' : 'model',
          content: m.content,
        })),
        currentHtml,
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return { html: null, error: err.error || `Erro ${response.status}` };
    }

    const data = await response.json();

    if (!data.html) {
      return { html: null, error: 'Resposta vazia do Gemini' };
    }

    return { html: data.html, error: null };
  } catch (error: any) {
    return { html: null, error: error?.message || 'Erro de conexão' };
  }
}
