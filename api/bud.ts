import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

const SYSTEM_PROMPT = `Você é um engenheiro de software sênior especializado em criar sites e aplicações web.

Quando o usuário pedir para criar ou modificar um site, você deve gerar o código HTML/CSS/JS COMPLETO e funcional.

REGRAS:
1. Sempre devolva o HTML COMPLETO, pronto para renderizar
2. Nunca use placeholders como "..." ou "TODO" ou "adicione aqui"
3. Inclua CSS dentro de <style> no <head>
4. Inclua JS dentro de <script> antes de </body>
5. Use design moderno, responsivo, com cores agradáveis
6. Se o usuário pedir para modificar algo, modifique o HTML atual mantendo o resto intacto
7. Se o usuário pedir algo novo, crie do zero um site completo

Responda SEMPRE com o HTML completo, sem explicações antes ou depois.
Apenas o HTML puro, começando com <!doctype html> e terminando com </html>.`;

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { messages, currentHtml } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'messages é obrigatório' });
  }

  try {
    const contents = messages.map((m: any) => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }],
    }));

    if (currentHtml) {
      contents.push({
        role: 'user',
        parts: [{ text: `HTML ATUAL DO PROJETO:\n\n${currentHtml}` }],
      });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        temperature: 0.7,
        maxOutputTokens: 8192,
      },
    });

    const html = response.text;

    if (!html) {
      return res.status(500).json({ error: 'Gemini não retornou conteúdo' });
    }

    res.status(200).json({ html });
  } catch (error: any) {
    console.error('Erro ao chamar Gemini:', error);
    res.status(500).json({
      error: error?.message || 'Erro ao gerar conteúdo',
    });
  }
}
