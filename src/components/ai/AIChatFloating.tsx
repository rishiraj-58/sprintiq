'use client';

import { useEffect, useRef, useState } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

type ChatMessage = { role: 'user' | 'assistant'; content: string };

export function AIChatFloating({ projectId }: { projectId?: string }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [pendingTool, setPendingTool] = useState<{ tool: string; args: any } | null>(null);
  const [executing, setExecuting] = useState(false);
  const [resultMsg, setResultMsg] = useState<string | null>(null);
  const [resolvedProjectId, setResolvedProjectId] = useState<string | null>(null);
  const [resolvedTaskId, setResolvedTaskId] = useState<string | null>(null);
  const [urlProjectId, setUrlProjectId] = useState<string | null>(null);

  // Infer projectId from URL when used via global widget
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const path = window.location.pathname;
      // Matches /projects/{projectId}/... or /projects/{projectId}
      const m = path.match(/\/projects\/([a-f0-9\-]{8,})/i);
      if (m && m[1]) setUrlProjectId(m[1]);
      else setUrlProjectId(null);
    } catch {
      setUrlProjectId(null);
    }
  }, []);

  const effectiveProjectId = projectId || urlProjectId || undefined;
  const scrollRef = useRef<HTMLDivElement>(null);

  function isIdLike(value: string): boolean {
    const uuidLike = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
    const userIdLike = /^user_[A-Za-z0-9]+/.test(value);
    return uuidLike || userIdLike;
  }

  function parseToolCallFromText(text: string): { tool: string; args: any } | null {
    console.log('🔍 [AI Chat] Parsing tool call from text:', { text: text.substring(0, 200) + '...' });
    try {
      // Look for a ```json ... ``` fenced block
      const match = text.match(/```json\s*([\s\S]*?)\s*```/i);
      const raw = match ? match[1] : text.trim();
      console.log('🔍 [AI Chat] Extracted JSON raw:', { raw, hasMatch: !!match });
      const parsed = JSON.parse(raw);
      console.log('🔍 [AI Chat] Parsed JSON result:', parsed);
      if (parsed && typeof parsed === 'object' && parsed.tool && parsed.args) {
        console.log('🔍 [AI Chat] Valid tool call found:', { tool: parsed.tool, args: parsed.args });
        return { tool: String(parsed.tool), args: parsed.args };
      }
    } catch (error) {
      console.log('🔍 [AI Chat] Failed to parse tool call:', error);
    }
    console.log('🔍 [AI Chat] No valid tool call found');
    return null;
  }

  // Helper to resolve a project by name if projectId missing
  async function resolveProjectIdByName(name: string): Promise<string | null> {
    console.log('🔍 [AI Chat] Resolving project ID for name:', name);
    try {
      const res = await fetch('/api/ai/tools/resolve-id', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entity: 'project', name }),
      });
      const data = await res.json();
      console.log('🔍 [AI Chat] Project resolution result:', { name, result: data, status: res.status });
      if (!res.ok) return null;
      if (data?.best?.id && (data?.best?.score ?? 0) >= 0.3) return data.best.id as string; // light threshold
      return null;
    } catch (error) {
      console.error('❌ [AI Chat] Error resolving project ID:', error);
      return null;
    }
  }

  async function resolveTaskIdByTitle(title: string, ctx: { projectId?: string; workspaceId?: string } = {}): Promise<string | null> {
    console.log('🔍 [AI Chat] Resolving task ID for title:', { title, context: ctx });
    try {
      const res = await fetch('/api/ai/tools/resolve-id', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entity: 'task', name: title, context: ctx }),
      });
      const data = await res.json();
      console.log('🔍 [AI Chat] Task resolution result:', { title, context: ctx, result: data, status: res.status });
      if (!res.ok) return null;
      if (data?.best?.id && (data?.best?.score ?? 0) >= 0.3) return data.best.id as string;
      return null;
    } catch (error) {
      console.error('❌ [AI Chat] Error resolving task ID:', error);
      return null;
    }
  }

  async function resolveUserIdByName(name: string, ctx: { projectId?: string } = {}): Promise<string | undefined> {
    console.log('🔍 [AI Chat] Resolving user ID for name:', { name, context: ctx });
    try {
      const res = await fetch('/api/ai/tools/resolve-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, context: ctx }),
      });
      const data = await res.json();
      console.log('🔍 [AI Chat] User resolution result:', { name, context: ctx, result: data, status: res.status });
      if (!res.ok) return undefined;
      if (data?.best?.id && (data?.best?.score ?? 0) >= 0.3) return data.best.id as string;
      return undefined;
    } catch (error) {
      console.error('❌ [AI Chat] Error resolving user ID:', error);
      return undefined;
    }
  }

  // Pre-resolve projectId for create-task so the confirmation can show it
  useEffect(() => {
    let cancelled = false;
    async function run() {
      console.log('🔄 [AI Chat] Pre-resolving IDs for tool:', pendingTool?.tool);
      setResolvedProjectId(null);
      setResolvedTaskId(null);
      if (pendingTool?.tool === 'create-task') {
        const args = pendingTool.args || {};
        const name = args.projectName || args.project;
        if (!args.projectId && typeof name === 'string' && name.trim().length > 0) {
          const id = await resolveProjectIdByName(name);
          if (!cancelled) setResolvedProjectId(id);
        }
      } else if (pendingTool?.tool === 'comment') {
        const args = pendingTool.args || {};
        const projName = args.projectName || args.project;
        const taskTitle = args.taskTitle || args.title;
        // Resolve project first if needed
        let pid: string | null = args.projectId || effectiveProjectId || null;
        if (!pid && typeof projName === 'string' && projName.trim().length > 0) {
          pid = await resolveProjectIdByName(projName);
          if (!cancelled) setResolvedProjectId(pid);
        } else if (pid) {
          if (!cancelled) setResolvedProjectId(pid);
        }
        // Resolve task if needed
        if (!args.taskId && typeof taskTitle === 'string' && taskTitle.trim().length > 0) {
          const tid = await resolveTaskIdByTitle(taskTitle, { projectId: pid || effectiveProjectId || undefined });
          if (!cancelled) setResolvedTaskId(tid);
        }
      } else if (pendingTool?.tool === 'update-task') {
        const args = pendingTool.args || {};
        const projName = args.projectName || args.project;
        // resolve project if provided by name (not strictly required by endpoint, but useful to narrow task)
        let pid: string | null = args.projectId || effectiveProjectId || null;
        if (!pid && typeof projName === 'string' && projName.trim().length > 0) {
          pid = await resolveProjectIdByName(projName);
          if (!cancelled) setResolvedProjectId(pid);
        } else if (pid) {
          if (!cancelled) setResolvedProjectId(pid);
        }
        // resolve taskId if missing and we have a title
        const title = args.taskTitle || args.title;
        if (!args.taskId && typeof title === 'string' && title.trim().length > 0) {
          const tid = await resolveTaskIdByTitle(title, { projectId: pid || effectiveProjectId || undefined });
          if (!cancelled) setResolvedTaskId(tid);
        }
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [pendingTool]);

  const send = async () => {
    if (!input.trim()) return;
    const userMsg: ChatMessage = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    console.log('🚀 [AI Chat] Sending message:', {
      message: input,
      projectId: projectId || null,
      effectiveProjectId: effectiveProjectId,
      messageCount: messages.length + 1,
      url: typeof window !== 'undefined' ? window.location.pathname : 'unknown',
      sendingProjectId: effectiveProjectId
    });

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg.content, projectId: effectiveProjectId, history: messages }),
      });
      const data = await res.json();
      const content: string = data.response || '';
      
      console.log('📥 [AI Chat] Received AI response:', {
        content: content,
        contentLength: content?.length || 0,
        hasToolCall: content?.includes('"tool":') || false,
        responseData: data
      });

      const maybeTool = parseToolCallFromText(content);
      if (maybeTool) {
        console.log('🔧 [AI Chat] Tool call detected:', {
          tool: maybeTool.tool,
          args: maybeTool.args,
          rawContent: content
        });
        // Auto-execute read-only tools without confirmation
        if (maybeTool.tool === 'search-tasks') {
          await executeReaderTool(maybeTool.tool, maybeTool.args);
        } else {
          setPendingTool(maybeTool);
        }
      } else {
        console.log('💬 [AI Chat] No tool call detected in response');
      }
      
      const aiMsg: ChatMessage = { role: 'assistant', content };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (error) {
      console.error('❌ [AI Chat] Error sending message:', error);
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  async function executeReaderTool(tool: string, args: any) {
    try {
      if (tool === 'search-tasks') {
        const payload = {
          query: args?.query || args?.taskTitle || args?.title || '',
          projectId: args?.projectId || effectiveProjectId || undefined,
          limit: typeof args?.limit === 'number' ? args.limit : 5,
        };
        if (!payload.query) {
          setMessages((prev) => [...prev, { role: 'assistant', content: 'No search query provided.' }]);
          return;
        }
        const res = await fetch('/api/ai/tools/search-tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) {
          setMessages((prev) => [...prev, { role: 'assistant', content: data?.error || 'Failed to search tasks' }]);
          return;
        }
        const tasksFound: Array<{ id: string; title: string; projectId: string }>
          = data?.tasks || [];
        if (tasksFound.length === 0) {
          setMessages((prev) => [...prev, { role: 'assistant', content: 'No tasks found matching that query.' }]);
          return;
        }
        const lines = tasksFound.map((t) => `- ${t.id}: ${t.title}`).join('\n');
        setMessages((prev) => [...prev, { role: 'assistant', content: `Found tasks:\n${lines}` }]);
      }
    } catch (err: any) {
      setMessages((prev) => [...prev, { role: 'assistant', content: err?.message || 'Reader tool error' }]);
    }
  }

  async function executePendingTool() {
    if (!pendingTool) return;
    setExecuting(true);
    setResultMsg(null);
    
    console.log('⚡ [AI Chat] Executing tool:', {
      tool: pendingTool.tool,
      args: pendingTool.args,
      resolvedProjectId,
      resolvedTaskId,
      effectiveProjectId
    });
    
    try {
      if (pendingTool.tool === 'update-task') {
        const args = pendingTool.args || {};
        // Use the already resolved ID, or the one from the tool args
        let finalTaskId = args.taskId || resolvedTaskId;

        // --- START: MODIFICATION ---
        // If we still don't have an ID, but we have a title, make one last attempt to resolve it.
        // This makes the confirmation step more robust.
        if (!finalTaskId && (args.taskTitle || args.title)) {
          const title = args.taskTitle || args.title;
          const projectId = args.projectId || resolvedProjectId || effectiveProjectId;
          console.log(`🔍 [AI Chat] Final attempt to resolve task ID for title: "${title}" in project: ${projectId}`);
          finalTaskId = await resolveTaskIdByTitle(title, { projectId: projectId || undefined });
          console.log(`🔍 [AI Chat] Final resolution result:`, { title, projectId, finalTaskId });
        }
        // --- END: MODIFICATION ---

        // Resolve assigneeName to assigneeId if provided
        let finalAssigneeId: string | undefined = args.assigneeId ?? undefined;
        if (args.assigneeName && !args.assigneeId) {
          console.log('🔍 [AI Chat] Resolving assignee name to ID:', args.assigneeName);
          let resolvedUserId: string | undefined;
          if (typeof args.assigneeName === 'string' && isIdLike(args.assigneeName)) {
            resolvedUserId = args.assigneeName;
          } else {
            resolvedUserId = (await resolveUserIdByName(args.assigneeName, { projectId: effectiveProjectId ?? undefined })) ?? undefined;
          }
          if (!resolvedUserId) {
            setResultMsg(`Error: Could not find user "${args.assigneeName}" in this project/workspace.`);
            setExecuting(false);
            setPendingTool(null);
            return;
          }
          finalAssigneeId = resolvedUserId;
          console.log('🔍 [AI Chat] Assignee resolution result:', { name: args.assigneeName, id: finalAssigneeId });
        }

        const payload: any = {
          ...args,
          taskId: finalTaskId, // Use the potentially newly resolved ID
          assigneeId: finalAssigneeId, // Use the resolved assignee ID (already undefined if null)
        };
        
        // This check is now more reliable because of the final attempt above.
        if (!payload.taskId) {
          setResultMsg('Error: Could not find a task matching that title. Please be more specific, or use the task ID.');
        } else {
          console.log('📤 [AI Chat] Calling update-task API with payload:', payload);
          const res = await fetch('/api/ai/tools/update-task', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
          const data = await res.json();
          console.log('📥 [AI Chat] update-task API response:', { status: res.status, data });
          if (!res.ok) {
            setResultMsg(data?.error ? `Error: ${data.error}` : 'Failed to update task');
          } else {
            setResultMsg(data?.message || 'Task updated');
            const summary = data?.task
              ? `Updated task ${data.task.id} (${data.task.title || ''})`
              : 'Task updated successfully';
            setMessages((prev) => [...prev, { role: 'assistant', content: summary }]);
          }
        }
      } else if (pendingTool.tool === 'create-task') {
        // (Your existing create-task logic remains here)
        const args = pendingTool.args || {};
        const payload: any = {
          projectId: args.projectId || effectiveProjectId,
          projectName: args.projectName || args.project || undefined,
          title: args.title || args.name || 'New Task',
          details: args.details ?? args.description ?? null,
          priority: args.priority || 'medium',
        };
        // Handle assignee resolution
        if (args.assigneeName && !args.assigneeId) {
          console.log('🔍 [AI Chat] Resolving assignee name to ID for create-task:', args.assigneeName);
          let resolvedUserId: string | undefined;
          if (typeof args.assigneeName === 'string' && isIdLike(args.assigneeName)) {
            resolvedUserId = args.assigneeName;
          } else {
            resolvedUserId = (await resolveUserIdByName(args.assigneeName, { projectId: effectiveProjectId ?? undefined })) ?? undefined;
          }
          if (!resolvedUserId) {
            setResultMsg(`Error: Could not find user "${args.assigneeName}" in this project/workspace.`);
            setExecuting(false);
            setPendingTool(null);
            return;
          }
          payload.assigneeId = resolvedUserId;
          console.log('🔍 [AI Chat] Create-task assignee resolution result:', { name: args.assigneeName, id: payload.assigneeId });
        } else if (Object.prototype.hasOwnProperty.call(args, 'assigneeId')) {
          payload.assigneeId = args.assigneeId ?? undefined;
        }
        if (Object.prototype.hasOwnProperty.call(args, 'status')) payload.status = args.status;

        if (!payload.projectId && payload.projectName) {
          const resolved = await resolveProjectIdByName(String(payload.projectName));
          if (resolved) payload.projectId = resolved;
          if (resolved) setResolvedProjectId(resolved);
        }

        if (!payload.projectId) {
          setResultMsg('Error: Missing projectId. Open a project or include projectId/projectName in the tool args.');
        } else {
          console.log('📤 [AI Chat] Calling create-task API with payload:', payload);
          const res = await fetch('/api/ai/tools/create-task', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
          const data = await res.json();
          console.log('📥 [AI Chat] create-task API response:', { status: res.status, data });
          if (!res.ok) {
            setResultMsg(data?.error ? `Error: ${data.error}` : 'Failed to create task');
          } else {
            const t = data?.task || data;
            const summary = t?.id ? `Created task ${t.id} (${t.title || ''})` : 'Task created';
            setMessages((prev) => [...prev, { role: 'assistant', content: summary }]);
            setResultMsg('Task created successfully');
          }
        }
      } else if (pendingTool.tool === 'comment') {
        // (Your existing comment logic remains here)
        const args = pendingTool.args || {};
        const payload: any = {
          projectId: args.projectId || resolvedProjectId || projectId,
          taskId: args.taskId || resolvedTaskId || undefined,
          content: args.content || args.text || '',
        };
        if (!payload.projectId && args.projectName) {
          const pid = await resolveProjectIdByName(String(args.projectName));
          if (pid) payload.projectId = pid;
        }
        if (!payload.taskId && args.taskTitle) {
          const tid = await resolveTaskIdByTitle(String(args.taskTitle), { projectId: payload.projectId || projectId });
          if (tid) payload.taskId = tid;
        }
        if (!payload.projectId || !payload.taskId || !payload.content) {
          setResultMsg('Error: Missing projectId/taskId/content for comment. Include projectName and taskTitle or open the project.');
        } else {
          console.log('📤 [AI Chat] Calling comment API with payload:', payload);
          const res = await fetch(`/api/ai/tools/comment`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
          const data = await res.json();
          console.log('📥 [AI Chat] comment API response:', { status: res.status, data });
          if (!res.ok) {
            setResultMsg(data?.error ? `Error: ${data.error}` : 'Failed to add comment');
          } else {
            setMessages((prev) => [...prev, { role: 'assistant', content: 'Comment added.' }]);
            setResultMsg('Comment added successfully');
          }
        }
      } else {
        setResultMsg(`Unsupported tool: ${pendingTool.tool}`);
      }
    } catch (e: any) {
      setResultMsg(e?.message || 'Unexpected error');
    } finally {
      setExecuting(false);
      setPendingTool(null);
    }
  }

  useEffect(() => {
    if (open && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [open, messages]);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 h-12 w-12 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center"
        aria-label="Open AI assistant"
      >
        <MessageCircle className="h-6 w-6" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-[360px] max-w-[90vw]">
      <Card className="shadow-2xl">
        <CardHeader className="flex flex-row items-center justify-between py-3">
          <CardTitle className="text-base">AI Assistant</CardTitle>
          <Button variant="ghost" size="icon" onClick={() => setOpen(false)}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="pt-0">
          <div ref={scrollRef} className="h-64 overflow-y-auto space-y-3 pr-1">
            {messages.length === 0 && (
              <p className="text-sm text-muted-foreground">Ask me to create tasks, summarize project health, or plan sprints.</p>
            )}
            {messages.map((m, idx) => (
              <div key={idx} className={m.role === 'user' ? 'text-right' : 'text-left'}>
                <div className={`inline-block rounded-md px-3 py-2 text-sm ${m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                  {m.content}
                </div>
              </div>
            ))}
            {resultMsg && (
              <div className="text-left">
                <div className="inline-block rounded-md px-3 py-2 text-sm bg-muted">{resultMsg}</div>
              </div>
            )}
          </div>
          <div className="mt-3 flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message..."
              onKeyDown={(e) => {
                if (e.key === 'Enter') send();
              }}
            />
            <Button onClick={send} disabled={loading}>
              {loading ? '...' : 'Send'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={!!pendingTool}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm AI action</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingTool?.tool === 'update-task' ? (
                <div className="text-sm">
                  The AI wants to update a task with the following changes:
                  <pre className="mt-2 max-h-40 overflow-auto rounded bg-muted p-2 text-xs">
{JSON.stringify({
  ...(pendingTool?.args || {}),
  taskId: pendingTool?.args?.taskId || resolvedTaskId || '(resolving or missing)'
}, null, 2)}
                  </pre>
                  Do you want to proceed?
                </div>
              ) : pendingTool?.tool === 'create-task' ? (
                <div className="text-sm">
                  The AI wants to create a task with the following details:
                  <pre className="mt-2 max-h-40 overflow-auto rounded bg-muted p-2 text-xs">
{JSON.stringify({
  projectId: (pendingTool?.args?.projectId || resolvedProjectId || projectId) ?? '(resolving or missing)',
  title: pendingTool?.args?.title || pendingTool?.args?.name,
  details: pendingTool?.args?.details ?? pendingTool?.args?.description,
  priority: pendingTool?.args?.priority || 'medium',
  assigneeId: Object.prototype.hasOwnProperty.call(pendingTool?.args || {}, 'assigneeId') ? (pendingTool?.args?.assigneeId || null) : undefined,
}, null, 2)}
                  </pre>
                  Do you want to proceed?
                </div>
              ) : pendingTool?.tool === 'comment' ? (
                <div className="text-sm">
                  The AI wants to add a comment to a task with the following details:
                  <pre className="mt-2 max-h-40 overflow-auto rounded bg-muted p-2 text-xs">
{JSON.stringify({
          projectId: pendingTool?.args?.projectId || resolvedProjectId || effectiveProjectId || '(resolving or missing)',
  taskId: pendingTool?.args?.taskId || resolvedTaskId || '(resolving or missing)',
  content: pendingTool?.args?.content || pendingTool?.args?.text || '(missing)'
}, null, 2)}
                  </pre>
                  Do you want to proceed?
                </div>
              ) : (
                <span>Unsupported tool: {pendingTool?.tool}</span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingTool(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={executePendingTool} disabled={executing}>
              {executing ? 'Working…' : 'Confirm'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}


