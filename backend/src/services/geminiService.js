// Shared Gemini transport. Never put API keys or user content in diagnostic logs.
export async function generateText({ contents, systemInstruction, maxOutputTokens = 512, temperature = 0.6 }) {
  if (!process.env.G_KEY || process.env.GEMINI_ENABLED === 'false') return { text: null, reason: 'disabled' };
  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  if (!/^[a-zA-Z0-9][a-zA-Z0-9_.-]*$/.test(model)) return { text: null, reason: 'configuration' };
  const generationConfig = { temperature, maxOutputTokens: Math.max(64, Math.min(2048, maxOutputTokens)) };
  // These short companion replies do not need an additional thinking-token budget.
  if (model === 'gemini-2.5-flash' || model === 'gemini-2.5-flash-lite') {
    generationConfig.thinkingConfig = { thinkingBudget: 0 };
  }
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': process.env.G_KEY },
      signal: AbortSignal.timeout(20000),
      body: JSON.stringify({ contents, ...(systemInstruction ? { systemInstruction: { parts: [{ text: systemInstruction }] } } : {}), generationConfig }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const reason = response.status === 429 ? 'quota' : response.status === 400 || response.status === 403 ? 'configuration' : 'unavailable';
      console.warn('[Gemini]', { status: response.status, reason });
      return { text: null, reason };
    }
    const text = data.candidates?.[0]?.content?.parts?.filter(part => !part.thought && typeof part.text === 'string')
      .map(part => part.text).join('').trim();
    return { text: text || null, reason: text ? null : 'empty', usage: {
      inputTokens: data.usageMetadata?.promptTokenCount ?? null,
      outputTokens: data.usageMetadata?.candidatesTokenCount ?? null,
      totalTokens: data.usageMetadata?.totalTokenCount ?? null,
    } };
  } catch {
    console.warn('[Gemini]', { reason: 'network_or_timeout' });
    return { text: null, reason: 'unavailable' };
  }
}
