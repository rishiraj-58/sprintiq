/* Minimal MCP client shim. If MCP_SERVER_URL is configured, fetches rich context
   to ground AI responses. This can be replaced with a real MCP SDK integration. */

type MCPContext = Record<string, unknown>;

export async function getMCPProjectContext(params: {
  projectId?: string;
  userId: string;
}): Promise<MCPContext | null> {
  const url = process.env.MCP_SERVER_URL;
  if (!url) return null;

  try {
    const res = await fetch(`${url.replace(/\/$/, '')}/project-context`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.MCP_API_KEY ?? ''}` },
      body: JSON.stringify(params),
      // 3s timeout cap via AbortController if needed; omitted for brevity
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data;
  } catch {
    return null;
  }
}


