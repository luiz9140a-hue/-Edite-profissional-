export interface GeneratedVisual {
  mimeType: 'image/png' | 'image/jpeg';
  base64: string;
  model: string;
}

export function shouldGenerateAiVisual(prompt: string): boolean {
  return process.env.VISUAL_GENERATION_MODE === 'auto' || /imagem|foto real|fotograf|realista|3d|render|hero visual|gerar visual/i.test(prompt);
}

export async function generateAiVisual(prompt: string, intentSummary: string): Promise<GeneratedVisual | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  const model = process.env.GEMINI_IMAGE_MODEL || 'gemini-3.1-flash-image';
  const visualPrompt = `Create one high-quality website hero image. ${intentSummary}. User visual request: ${prompt}. Photorealistic commercial photography or physically plausible 3D product render only when requested. Match the requested industry, subject, lighting, composition and color palette. No logos, no invented text, no watermarks, no generic clipart, no cartoon, no placeholder, no UI screenshot.`;
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts: [{ text: visualPrompt }] }], generationConfig: { responseModalities: ['IMAGE', 'TEXT'] } })
  });
  if (!response.ok) throw new Error(`Gemini Image respondeu ${response.status}`);
  const data = await response.json() as { candidates?: Array<{ content?: { parts?: Array<{ inlineData?: { mimeType?: string; data?: string } }> } }> };
  const inline = data.candidates?.flatMap(candidate => candidate.content?.parts || []).find(part => part.inlineData?.data);
  if (!inline?.inlineData?.data) return null;
  const mimeType = inline.inlineData.mimeType === 'image/jpeg' ? 'image/jpeg' : 'image/png';
  return { mimeType, base64: inline.inlineData.data, model };
}
