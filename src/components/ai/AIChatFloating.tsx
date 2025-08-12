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
  const scrollRef = useRef<HTMLDivElement>(null);

  function parseToolCallFromText(text: string): { tool: string; args: any } | null {
    try {
      // Look for a ```json ... ``` fenced block
      const match = text.match(/```json\s*([\s\S]*?)\s*```/i);
      const raw = match ? match[1] : text.trim();
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && parsed.tool && parsed.args) {
        return { tool: String(parsed.tool), args: parsed.args };
      }
    } catch {}
    return null;
  }

  // Helper to resolve a project by name if projectId missing
  async function resolveProjectIdByName(name: string): Promise<string | null> {
    try {
      const res = await fetch('/api/ai/tools/resolve-id', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entity: 'project', name }),
      });
      const data = await res.json();
      if (!res.ok) return null;
      if (data?.best?.id && (data?.best?.score ?? 0) >= 0.3) return data.best.id as string; // light threshold
      return null;
    } catch {
      return null;
    }
  }

  // Pre-resolve projectId for create-task so the confirmation can show it
  useEffect(() => {
    let cancelled = false;
    async function run() {
      setResolvedProjectId(null);
      if (pendingTool?.tool === 'create-task') {
        const args = pendingTool.args || {};
        const name = args.projectName || args.project;
        if (!args.projectId && typeof name === 'string' && name.trim().length > 0) {
          const id = await resolveProjectIdByName(name);
          if (!cancelled) setResolvedProjectId(id);
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
    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg.content, projectId, history: messages }),
      });
      const data = await res.json();
      const content: string = data.response || '';
      const maybeTool = parseToolCallFromText(content);
      if (maybeTool) {
        setPendingTool(maybeTool);
      }
      const aiMsg: ChatMessage = { role: 'assistant', content };
      setMessages((prev) => [...prev, aiMsg]);
    } finally {
      setLoading(false);
    }
  };

  async function executePendingTool() {
    if (!pendingTool) return;
    setExecuting(true);
    setResultMsg(null);
    try {
      if (pendingTool.tool === 'update-task') {
        const res = await fetch('/api/ai/tools/update-task', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(pendingTool.args),
        });
        const data = await res.json();
        if (!res.ok) {
          setResultMsg(data?.error ? `Error: ${data.error}` : 'Failed to update task');
        } else {
          setResultMsg(data?.message || 'Task updated');
          const summary = data?.task
            ? `Updated task ${data.task.id} (${data.task.title || ''})`
            : 'Task updated successfully';
          setMessages((prev) => [...prev, { role: 'assistant', content: summary }]);
        }
      } else if (pendingTool.tool === 'create-task') {
        // Map args to API payload and include projectId
        const args = pendingTool.args || {};
        const payload: any = {
          projectId: args.projectId || projectId,
          projectName: args.projectName || args.project || undefined,
          title: args.title || args.name || 'New Task',
          details: args.details ?? args.description ?? null,
          priority: args.priority || 'medium',
        };
        if (Object.prototype.hasOwnProperty.call(args, 'assigneeId')) payload.assigneeId = args.assigneeId || null;
        if (Object.prototype.hasOwnProperty.call(args, 'status')) payload.status = args.status;

        // If projectId missing, try resolving by name
        if (!payload.projectId && payload.projectName) {
          const resolved = await resolveProjectIdByName(String(payload.projectName));
          if (resolved) payload.projectId = resolved;
          if (resolved) setResolvedProjectId(resolved);
        }

        if (!payload.projectId) {
          setResultMsg('Error: Missing projectId. Open a project or include projectId/projectName in the tool args.');
        } else {
          const res = await fetch('/api/ai/tools/create-task', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
          const data = await res.json();
          if (!res.ok) {
            setResultMsg(data?.error ? `Error: ${data.error}` : 'Failed to create task');
          } else {
            const t = data?.task || data;
            const summary = t?.id ? `Created task ${t.id} (${t.title || ''})` : 'Task created';
            setMessages((prev) => [...prev, { role: 'assistant', content: summary }]);
            setResultMsg('Task created successfully');
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
{JSON.stringify(pendingTool?.args, null, 2)}
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


