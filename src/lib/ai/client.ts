/*
  Lightweight AI client that supports both OpenAI-compatible endpoints and GitHub Models.
  It is MCP-ready by accepting external context and tool outputs.
*/

type ChatMessage = {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
};

type GenerateAIResponseParams = {
  messages: ChatMessage[];
  model?: string;
  maxTokens?: number;
  temperature?: number;
};

export async function generateAIResponse({
  messages,
  model,
  maxTokens = 1200,
  temperature = 0.6,
}: GenerateAIResponseParams): Promise<string> {
  const apiBase = process.env.OPENAI_API_BASE_URL || 'https://api.openai.com/v1';
  const apiKey = process.env.OPENAI_API_KEY || process.env.GITHUB_TOKEN;
  const chosenModel = model || process.env.OPENAI_MODEL || 'gpt-4o-mini';

  if (!apiKey) {
    throw new Error('AI API key is not configured. Set OPENAI_API_KEY or GITHUB_TOKEN');
  }

  const url = `${apiBase.replace(/\/$/, '')}/chat/completions`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: chosenModel,
      messages,
      max_tokens: maxTokens,
      temperature,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`AI API error: ${response.status} ${text}`);
  }

  const data = await response.json();

  // OpenAI-compatible payload
  const content: string | undefined = data?.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('AI API returned empty response');
  }
  return content;
}

export function buildSystemMessage(context: Record<string, unknown>): ChatMessage {
  return {
    role: 'system',
    content:
      'You are SprintIQ MCP-enabled AI assistant. Use provided context to give concise, actionable answers. Prefer structured bullet points. If asked to create tasks/bugs, output a JSON block under a code fence labelled json with fields: type, title, details, priority, assigneeId, labels.' +
      `\nContext: ${JSON.stringify(context).slice(0, 6000)}`,
  };
}

export type { ChatMessage };


