import { GoogleGenAI } from '@google/genai';

const SYSTEM_PROMPT = `Você é engenheiro sênior + designer nível
Stripe, Linear, Apple, Vercel. Gera sites COMPLETOS, MODERNOS e
VISUALMENTE RICOS.

DIRETRIZES OBRIGATÓRIAS:

1. IMAGENS REAIS
   Use Unsplash: https://images.unsplash.com/photo-XXXXX?w=1200&q=80
   Ou picsum: https://picsum.photos/seed/[nome]/1200/800
   Sempre com alt descritivo e loading="lazy".

2. VÍDEO DE FUNDO em hero/CTA
   https://cdn.coverr.co/videos/coverr-[slug]/1080p.mp4
   Com overlay escuro.

3. GLASSMORPHISM
   .glass {
     background: rgba(255,255,255,0.08);
     backdrop-filter: blur(20px) saturate(180%);
     -webkit-backdrop-filter: blur(20px) saturate(180%);
     border: 1px solid rgba(255,255,255,0.15);
     border-radius: 16px;
     box-shadow: 0 8px 32px rgba(0,0,0,0.2);
   }

4. PALETA PROFISSIONAL (CSS variables)
   --primary, --primary-dark, --secondary, --accent,
   --bg, --bg-alt, --text, --text-muted, --border,
   --radius, --shadow-sm, --shadow-md, --shadow-lg

5. GOOGLE FONTS
   Inter (400-800) + Poppins (600-800) via CDN

6. ESTRUTURA COMPLETA
   Navbar + Hero + Social Proof + Features + Como Funciona +
   Depoimentos + Pricing + FAQ + CTA Final + Footer

7. BOTÕES com hover, sombras, transições suaves
8. ÍCONES SVG inline (stroke="currentColor")
9. ANIMAÇÕES CSS (fadeInUp, float, hover effects)
10. RESPONSIVO mobile-first (media queries 768px, 1024px)
11. CONTEÚDO REALISTA em português (sem Lorem ipsum)
12. Menu mobile funcional (JS toggle)
13. FAQ accordion (<details>)
14. Smooth scroll em âncoras

REGRAS:
- SEMPRE HTML completo (<!doctype html> até </html>)
- NUNCA placeholders "..." ou "TODO"
- CSS dentro de <style> no <head>
- JS dentro de <script> antes de </body>
- Responda APENAS HTML puro, sem markdown, sem explicações

Inspire-se em: linear.app, vercel.com, stripe.com, apple.com`;

const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;

export type GenResult =
  | { ok: true; html: string }
  | { ok: false; error: string };

export async function generateSiteWithAI(
  prompt: string,
  currentHtml?: string,
  options?: { signal?: AbortSignal }
): Promise<GenResult> {
  try {
    if (!apiKey) {
      return { ok: false, error: 'VITE_GEMINI_API_KEY não configurada' };
    }

    const ai = new GoogleGenAI({ apiKey });

    const userMessage = currentHtml
      ? `Altere o site abaixo conforme pedido:\n\nPEDIDO: ${prompt}\n\nHTML ATUAL:\n${currentHtml}`
      : `Crie um site completo conforme pedido:\n\n${prompt}`;

    const request = ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: userMessage,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        temperature: 0.85,
        maxOutputTokens: 30000,
      },
    });
    const response = options?.signal
      ? await Promise.race([
          request,
          new Promise<never>((_, reject) => {
            const signal = options.signal;
            if (signal?.aborted) {
              reject(new Error('Geração cancelada.'));
              return;
            }
            signal?.addEventListener('abort', () => reject(new Error('Geração cancelada.')), { once: true });
          }),
        ])
      : await request;

    let html = response.text || '';
    html = html.replace(/^```html\s*/i, '').replace(/```\s*$/i, '').trim();

    if (!html.startsWith('<!doctype') && !html.startsWith('<!DOCTYPE')) {
      return { ok: false, error: 'Gemini não retornou HTML válido' };
    }

    return { ok: true, html };
  } catch (err: any) {
    console.error('[aiGenerator]', err);
    return { ok: false, error: err?.message || 'Erro desconhecido' };
  }
}
