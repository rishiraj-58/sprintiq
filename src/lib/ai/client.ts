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

// File: sprintiq/src/lib/ai/client.ts

export function buildSystemMessage(context: Record<string, unknown>, intent: 'read' | 'write' | 'clarify'): ChatMessage {
  const readTools = `
      * **Search for Tasks:** Use this to find a list of tasks.
          * \`{ "tool": "get_search-tasks", "args": { "query": "string", "projectId?": "<uuid>" } }\`
      * **Get Task Details:** Use this to get all information for a single task.
          * \`{ "tool": "get_task-details", "args": { "taskId?": "<uuid>", "taskTitle?": "string", "projectId?": "<uuid>" } }\`
      `;

        const writeTools = `
      * **Create a Task:**
          * \`{ "tool": "post_create-task", "args": { "projectId?": "<uuid>", "projectName?": "string", "title": "string", "details?": "string|null", "priority?": "low|medium|high|urgent", "assigneeName?": "string" } }\`
      * **Update a Task:**
          * \`{ "tool": "post_update-task", "args": { "taskId?": "<uuid>", "taskTitle?": "string", "projectId?": "<uuid>", "status?": "string", "priority?": "string", "storyPoints?": number, "assigneeName?": "string" } }\`
      * **Delete a Task:**
          * \`{ "tool": "post_delete-task", "args": { "taskId?": "<uuid>", "taskTitle?": "string", "projectId?": "<uuid>" } }\`
      * **Breakdown a Task:**
          * \`{ "tool": "post_breakdown-task", "args": { "projectId": "<uuid>", "title": "string" } }\`
          * Alternative route name also supported: \`post_breakdown-task\` → \`/api/ai/tools/breakdown-task\`
      * **Create Bug From Text:**
          * \`{ "tool": "post_create-bug-from-text", "args": { "projectId": "<uuid>", "text": "string" } }\`
      * **Add a Comment:**
          * \`{ "tool": "post_comment", "args": { "taskId?": "<uuid>", "taskTitle?": "string", "content": "string" } }\`
      `;

        let content = `You are SprintIQ, an intelligent AI assistant.
      Your persona is that of a helpful and experienced Agile coach.
      **Current Date:** ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
      `;

        if (intent === 'clarify') {
          content += `
      You are in **Clarification Mode**. Your primary goal is to determine if the user wants to **read** (get information) or **write** (change information).
      Based on the user's message, respond with a single JSON object with your decision.

      Respond with ONLY one of the following JSON objects:
      - \`{ "intent": "read" }\`
      - \`{ "intent": "write" }\`
      - \`{ "intent": "answer" }\` (if the user is asking a general question, not related to tools)

      Example:
      User: "change the priority of the login task to high"
      You respond: \`{ "intent": "write" }\`

      User: "show me the details for the analytics bug"
      You respond: \`{ "intent": "read" }\`

      User: "what is agile methodology?"
      You respond: \`{ "intent": "answer" }\`
      `;
        } else {
          content += `
      You are in **Execution Mode**. Your goal is to use the correct tool(s) to fulfill the user's request.
      The user's intent has been identified as **${intent.toUpperCase()}**.
      You MUST only use tools from the appropriate category below.

      **${intent === 'read' ? 'Read Tools (for fetching information):**' + readTools : ''}**
      **${intent === 'write' ? 'Write Tools (for changing data):**' + writeTools : ''}**

      **Instructions:**
      1.  When actions are required, output a single JSON object with a top-level \`steps\` array. Each item is a tool call object.
      2.  For simple requests, \`steps\` will have one item. For complex requests, include multiple items in the order they should run.
      3.  Do NOT ask for confirmation; the client handles that.
      4.  Use names (\`taskTitle\`, \`projectName\`, \`assigneeName\`) when you don't have IDs. The system will resolve them.
      5.  Output ONLY the JSON.

      Example:
      \`\`\`json
      {
        "steps": [
          { "tool": "post_create-task", "args": { "title": "New Feature" } },
          { "tool": "post_update-task", "args": { "taskTitle": "New Feature", "assigneeName": "Dave" } }
        ]
      }
      \`\`\`

      **Context:**
      \`\`\`json
      ${JSON.stringify(context, null, 2).slice(0, 4000)}
      \`\`\`
      `;
        }

      return { role: 'system', content };
}

export type { ChatMessage };


