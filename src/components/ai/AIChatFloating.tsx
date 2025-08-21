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
import ReactMarkdown from 'react-markdown'; 

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
  const [resolvedTaskTitle, setResolvedTaskTitle] = useState<string | null>(null);
  const [urlProjectId, setUrlProjectId] = useState<string | null>(null);
  const [pendingPlan, setPendingPlan] = useState<string[] | null>(null);
  const [stepQueue, setStepQueue] = useState<{ tool: string; args: any }[] | null>(null);
  const [lastCreatedTaskId, setLastCreatedTaskId] = useState<string | null>(null);
  const [queueCancelled, setQueueCancelled] = useState<boolean>(false);

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

  function normalizeToolRouteName(tool: string | undefined): string {
    const t = String(tool || '').trim();
    return t
      .replace(/^get[_-]/, 'get-')
      .replace(/^post[_-]/, '')
      .replace(/_/g, '-');
  }

  function parseToolCallFromText(text: string): { tool: string; args: any }[] | null {
    console.log('🔍 [AI Chat] Parsing tool call from text:', { text: text.substring(0, 200) + '...' });
    try {
      // Look for a ```json ... ``` fenced block
      const match = text.match(/```json\s*([\s\S]*?)\s*```/i);
      const raw = match ? match[1] : text.trim();
      console.log('🔍 [AI Chat] Extracted JSON raw:', { raw, hasMatch: !!match });
      const parsed = JSON.parse(raw);
      console.log('🔍 [AI Chat] Parsed JSON result:', parsed);
      if (parsed && typeof parsed === 'object' && Array.isArray(parsed.plan)) {
        // Render plan and store for approval
        const steps: string[] = parsed.plan.filter((s: any) => typeof s === 'string');
        if (steps.length > 0) {
          setMessages((prev) => [
            ...prev,
            { role: 'assistant', content: `Proposed plan:\n\n${steps.map((s, i) => `${i + 1}. ${s}`).join('\n')}\n\nProceed?` },
          ]);
          // Store pending plan in state for approval path
          setPendingPlan(steps);
        }
        return null;
      }
      if (parsed && typeof parsed === 'object' && Array.isArray(parsed.steps)) {
        const steps = parsed.steps
          .filter((s: any) => s && typeof s === 'object' && s.tool && s.args)
          .map((s: any) => ({ tool: String(s.tool), args: s.args }));
        return steps.length > 0 ? steps : null;
      }
      if (parsed && typeof parsed === 'object' && parsed.tool && parsed.args) {
        return [{ tool: String(parsed.tool), args: parsed.args }];
      }
    } catch (error) {
      console.log('🔍 [AI Chat] Failed to parse tool call:', error);
    }
    console.log('🔍 [AI Chat] No valid tool call found');
    return null;
  }

  function isReaderToolName(tool: string | undefined): boolean {
    if (!tool) return false;
    const t = String(tool).trim();
    return (
      t.startsWith('get_') ||
      t.startsWith('get-') ||
      t === 'search-tasks' ||
      t === 'get-task-details' ||
      t === 'get_task-details' ||
      t === 'search-bugs' ||
      t === 'get-bug-details' ||
      t === 'get_bug-details'
    );
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

  async function fetchTaskTitleById(taskId: string): Promise<string | null> {
    try {
      const res = await fetch(`/api/tasks/${taskId}`);
      if (!res.ok) return null;
      const data = await res.json();
      return typeof data?.title === 'string' ? data.title : null;
    } catch {
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
      setResolvedTaskTitle(null);
      const normalized = normalizeToolRouteName(pendingTool?.tool);
      if (normalized === 'create-task') {
        const args = pendingTool?.args || {};
        const name = args.projectName || args.project;
        if (!args.projectId && typeof name === 'string' && name.trim().length > 0) {
          const id = await resolveProjectIdByName(name);
          if (!cancelled) setResolvedProjectId(id);
        }
      } else if (normalized === 'comment') {
        const args = pendingTool?.args || {};
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
      } else if (normalized === 'update-task') {
        const args = pendingTool?.args || {};
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
          if (tid) {
            const tTitle = await fetchTaskTitleById(tid);
            if (!cancelled) setResolvedTaskTitle(tTitle);
          }
        } else if (args.taskId && typeof args.taskId === 'string') {
          const tTitle = await fetchTaskTitleById(args.taskId);
          if (!cancelled) setResolvedTaskTitle(tTitle);
        }
      } else if (normalized === 'delete-task') {
        const args = pendingTool?.args || {};
        const projName = args.projectName || args.project;
        // Resolve project first if needed
        let pid: string | null = args.projectId || effectiveProjectId || null;
        if (!pid && typeof projName === 'string' && projName.trim().length > 0) {
          pid = await resolveProjectIdByName(projName);
          if (!cancelled) setResolvedProjectId(pid);
        } else if (pid) {
          if (!cancelled) setResolvedProjectId(pid);
        }
        // Resolve task if needed
        const title = args.taskTitle || args.title;
        if (!args.taskId && typeof title === 'string' && title.trim().length > 0) {
          const tid = await resolveTaskIdByTitle(title, { projectId: pid || effectiveProjectId || undefined });
          if (!cancelled) setResolvedTaskId(tid);
          if (tid) {
            const tTitle = await fetchTaskTitleById(tid);
            if (!cancelled) setResolvedTaskTitle(tTitle);
          }
        } else if (args.taskId && typeof args.taskId === 'string') {
          const tTitle = await fetchTaskTitleById(args.taskId);
          if (!cancelled) setResolvedTaskTitle(tTitle);
        }
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [pendingTool]);

  // Auto-execute reader tools if they somehow get set as pending
  useEffect(() => {
    if (pendingTool && isReaderToolName(pendingTool.tool)) {
      executeReaderTool(pendingTool.tool, pendingTool.args).finally(() => setPendingTool(null));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

      const maybeSteps = parseToolCallFromText(content);
      // if (maybeTool) {
      //   console.log('🔧 [AI Chat] Tool call detected:', {
      //     tool: maybeTool.tool,
      //     args: maybeTool.args,
      //     rawContent: content
      //   });
      //   // Auto-execute read-only tools without confirmation
      //   if (maybeTool.tool === 'search-tasks') {
      //     await executeReaderTool(maybeTool.tool, maybeTool.args);
      //   } else {
      //     setPendingTool(maybeTool);
      //   }
      // } else {
      //   console.log('💬 [AI Chat] No tool call detected in response');
      // }
      
      const aiMsg: ChatMessage = { role: 'assistant', content };
      setMessages((prev) => [...prev, aiMsg]);

      if (maybeSteps && maybeSteps.length > 0) {
        // Queue sequential steps so that create-task can set lastCreatedTaskId before create-subtask runs
        setQueueCancelled(false);
        setLastCreatedTaskId(null);
        setStepQueue(maybeSteps);
        // Start executing steps immediately
        startNextQueuedStep();
      }
    } catch (error) {
      console.error('❌ [AI Chat] Error sending message:', error);
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  async function approvePlanAndExecute() {
    const steps = pendingPlan || [];
    if (steps.length === 0) return;
    setLoading(true);
    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input || 'Proceed with the approved plan', projectId: effectiveProjectId, planApprovedSteps: steps, history: messages }),
      });
      const data = await res.json();
      const content: string = data.response || '';
      setMessages((prev) => [...prev, { role: 'assistant', content }]);
      const maybeSteps = parseToolCallFromText(content);
      if (maybeSteps && maybeSteps.length > 0) {
        for (const step of maybeSteps) {
          await executeTool(step.tool, step.args);
        }
      }
    } catch (e) {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Failed to execute approved plan.' }]);
    } finally {
      setLoading(false);
      setPendingPlan(null);
    }
  }

  // This function decides how to handle a tool based on its name.
  async function executeTool(tool: string, args: any) {
    let t = normalizeToolRouteName(tool);
    // Normalize alternative naming (post_breakdown-task emits 'breakdown-task' route)
    if (t === 'post-breakdown-task') t = 'breakdown-task';
    if (t === 'post-create-subtask') t = 'create-subtask';
    if (t === 'post-update-subtask') t = 'update-subtask';
    if (t === 'post-delete-subtask') t = 'delete-subtask';
    const isReader =
      t.startsWith('get-') ||
      t === 'search-tasks' ||
      t === 'get-task-details' ||
      t === 'search-bugs' ||
      t === 'get-bug-details';
    const isWriter =
      t.startsWith('post-') ||
      t === 'update-task' ||
      t === 'create-task' ||
      t === 'comment' ||
      t === 'delete-task' ||
      t === 'breakdown-task' ||
      t === 'create-bug-from-text' ||
      t === 'create-bug' ||
      t === 'update-bug' ||
      t === 'delete-bug' ||
      t === 'create-subtask' ||
      t === 'update-subtask' ||
      t === 'delete-subtask' ||
      t === 'post_create-subtask' ||
      t === 'post_update-subtask' ||
      t === 'post_delete-subtask';

    if (isReader) {
      await executeReaderTool(t, args);
      return;
    }
    if (isWriter) {
      setPendingTool({ tool: t, args });
      return;
    }
    console.warn(`[AI Chat] Received a tool with an unknown name: ${t}`);
    setPendingTool({ tool: t, args });
  }

  // This function handles all read-only operations.
  async function executeReaderTool(tool: string, args: any) {
    // Normalize tool name to existing API route naming
    let endpointName = normalizeToolRouteName(tool);
    // Map prefixed get-* tools to actual AI tool route names when needed
    if (endpointName.startsWith('get-') && endpointName !== 'get-task-details') {
      endpointName = endpointName.slice(4);
    }
    // Add an optimistic message
    setMessages((prev) => [...prev, { role: 'assistant', content: `Fetching details for ${endpointName}...` }]);
    setLoading(true);

    try {
      const params = new URLSearchParams();
      const mergedArgs: Record<string, any> = { ...args };
      if (effectiveProjectId && mergedArgs.projectId == null) {
        mergedArgs.projectId = effectiveProjectId;
      }
      Object.entries(mergedArgs).forEach(([k, v]) => {
        if (v !== undefined && v !== null) params.append(k, String(v));
      });
      const res = await fetch(`/api/ai/tools/${endpointName}?${params.toString()}`);
      const data = await res.json();

      let resultMessage = '';
      if (!res.ok) {
        resultMessage = `Error: ${data.error || `Failed to execute ${endpointName}`}`;
      } else {
        resultMessage = `Here are the details I found:\n\n\`\`\`json\n${JSON.stringify(data, null, 2)}\n\`\`\``;
      }
      setMessages((prev) => [...prev.slice(0, -1), { role: 'assistant', content: resultMessage }]);
    } catch (err: any) {
      setMessages((prev) => [...prev.slice(0, -1), { role: 'assistant', content: err?.message || 'Reader tool error' }]);
    } finally {
      setLoading(false);
    }
  }

  async function executePendingTool() {
    if (!pendingTool) return;
    setExecuting(true);
    setResultMsg(null);

    // Normalize writer tool route (support post_* variants)
    const toolName = normalizeToolRouteName(pendingTool.tool);
    
    try {
      if (toolName === 'update-task') {
        const args = pendingTool.args || {};

        // Determine final taskId (prefer provided, else pre-resolved, else resolve now via title)
        let finalTaskId: string | null | undefined = args.taskId || resolvedTaskId;
        const candidateTitle: string | undefined = args.taskTitle || args.title;
        let projectContext: string | undefined = args.projectId || resolvedProjectId || effectiveProjectId;
        if (!finalTaskId && typeof candidateTitle === 'string' && candidateTitle.trim().length > 0) {
          finalTaskId = await resolveTaskIdByTitle(candidateTitle, { projectId: projectContext });
        }

        // Resolve assigneeName -> assigneeId if necessary
        let finalAssigneeId: string | undefined = args.assigneeId ?? undefined;
        if (args.assigneeName && !args.assigneeId) {
          const maybeId = typeof args.assigneeName === 'string' && isIdLike(args.assigneeName)
            ? args.assigneeName
            : await resolveUserIdByName(args.assigneeName, { projectId: projectContext });
          finalAssigneeId = maybeId ?? undefined;
        }

        const payload: Record<string, any> = {
          ...args,
          taskId: finalTaskId,
          ...(Object.prototype.hasOwnProperty.call(args, 'assigneeName') || Object.prototype.hasOwnProperty.call(args, 'assigneeId')
            ? { assigneeId: finalAssigneeId ?? null }
            : {}),
        };

        if (!payload.taskId) {
          setResultMsg('Error: Could not find a task matching that title. Please be more specific or provide taskId.');
        } else if (Object.prototype.hasOwnProperty.call(payload, 'assigneeId') && payload.assigneeId === null && args.assigneeName) {
          setResultMsg(`Error: Could not find user "${args.assigneeName}" in this project/workspace.`);
        } else {
          const res = await fetch(`/api/ai/tools/${toolName}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
          const data = await res.json();
          if (!res.ok) {
            setResultMsg(data?.error ? `Error: ${data.error}` : `Failed to execute ${toolName}`);
          } else {
            const summary = data?.message || `${toolName} executed successfully.`;
            setMessages((prev) => [...prev, { role: 'assistant', content: summary }]);
            setResultMsg(summary);
          }
        }
      } else if (toolName === 'delete-task') {
        const args = pendingTool.args || {};
        let finalTaskId: string | null | undefined = args.taskId || resolvedTaskId;
        const candidateTitle: string | undefined = args.taskTitle || args.title;
        const projectContext: string | undefined = args.projectId || resolvedProjectId || effectiveProjectId;
        if (!finalTaskId && typeof candidateTitle === 'string' && candidateTitle.trim().length > 0) {
          finalTaskId = await resolveTaskIdByTitle(candidateTitle, { projectId: projectContext });
        }

        const payload = {
          taskId: finalTaskId,
          taskTitle: candidateTitle,
          projectId: projectContext,
        };

        if (!payload.taskId) {
          setResultMsg('Error: Could not find a task matching that title. Please be more specific or provide taskId.');
        } else {
          const res = await fetch(`/api/ai/tools/${toolName}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
          const data = await res.json();
          if (!res.ok) {
            setResultMsg(data?.error ? `Error: ${data.error}` : `Failed to execute ${toolName}`);
          } else {
            const summary = data?.message || `${toolName} executed successfully.`;
            setMessages((prev) => [...prev, { role: 'assistant', content: summary }]);
            setResultMsg(summary);
          }
        }
      } else if (toolName === 'breakdown-task' || toolName === 'post_breakdown-task' || toolName === 'create-bug-from-text') {
        const res = await fetch(`/api/ai/tools/${toolName}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(pendingTool.args),
        });
        const data = await res.json();
        if (!res.ok) {
          setResultMsg(data?.error ? `Error: ${data.error}` : `Failed to execute ${toolName}`);
        } else {
          const summary = data?.message || `${toolName} executed successfully.`;
          setMessages((prev) => [...prev, { role: 'assistant', content: `
${summary}

\`\`\`json
${JSON.stringify(data, null, 2)}
\`\`\`
` }]);
          setResultMsg(summary);
        }
      } else if (toolName === 'create-task') {
        const res = await fetch(`/api/ai/tools/${toolName}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(pendingTool.args),
        });
        const data = await res.json();
        if (!res.ok) {
          setResultMsg(data?.error ? `Error: ${data.error}` : `Failed to execute ${toolName}`);
          setStepQueue(null);
          setQueueCancelled(true);
        } else {
          const createdId = data?.task?.id || data?.id;
          if (createdId && typeof createdId === 'string') {
            setLastCreatedTaskId(createdId);
          }
          
          // Verify creation
          let verified = false;
          if (createdId) {
            try {
              const check = await fetch(`/api/tasks/${createdId}`);
              verified = check.ok;
            } catch {}
          }
          
          // Fallback: try to find by title within project
          if (!verified) {
            try {
              const title = pendingTool.args?.title;
              const pid = pendingTool.args?.projectId || effectiveProjectId;
              
              if (title && pid) {
                const params = new URLSearchParams({ query: String(title), projectId: String(pid) });
                const searchRes = await fetch(`/api/ai/tools/search-tasks?${params.toString()}`);
                if (searchRes.ok) {
                  const list = await searchRes.json();
                  const found = Array.isArray(list?.tasks) ? list.tasks.find((t: any) => String(t?.title || '').toLowerCase() === String(title).toLowerCase()) : null;
                  if (found?.id) {
                    setLastCreatedTaskId(found.id);
                    verified = true;
                  }
                }
              }
            } catch {}
          }
          const summary = verified
            ? (data?.message || `Task ${createdId} created successfully.`)
            : 'Task creation response received, but verification failed.';
          setMessages((prev) => [...prev, { role: 'assistant', content: summary }]);
          setResultMsg(summary);
          if (!verified) {
            setStepQueue(null);
            setQueueCancelled(true);
          }
          // If verified and we have more steps, continue the sequence
          if (verified && stepQueue && stepQueue.length > 0) {
            // Update step queue to remove the completed step and continue
            const [_, ...remainingSteps] = stepQueue;
            setStepQueue(remainingSteps);
            if (remainingSteps.length > 0) {
              startNextQueuedStep();
            }
          }
        }
      } else if (
        toolName === 'create-subtask' ||
        toolName === 'post_create-subtask' ||
        toolName === 'update-subtask' ||
        toolName === 'post_update-subtask' ||
        toolName === 'delete-subtask' ||
        toolName === 'post_delete-subtask'
      ) {
        const routeName = toolName.replace(/^post_/, '');
        // Inject lastCreatedTaskId if available and taskId missing or not a valid ID (e.g., placeholder)
        const outgoingArgs = { ...pendingTool.args };
        
        if (!outgoingArgs.taskId || !isIdLike(String(outgoingArgs.taskId))) {
          if (lastCreatedTaskId) {
            outgoingArgs.taskId = lastCreatedTaskId;
          } else {
            // Drop invalid placeholder to allow server-side resolution via taskTitle
            delete outgoingArgs.taskId;
          }
        }
        const res = await fetch(`/api/ai/tools/${routeName}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(outgoingArgs),
        });
        const data = await res.json().catch(() => ({}));
        
        if (!res.ok) {
          setResultMsg(data?.error ? `Error: ${data.error}` : `Failed to execute ${toolName}`);
          setStepQueue(null);
          setQueueCancelled(true);
        } else {
          // Verify subtask exists under the parent
          let verified = false;
          const parentId: string | undefined = outgoingArgs.taskId || lastCreatedTaskId || undefined;
          const subTitle: string | undefined = outgoingArgs.title;
          
          if (parentId && subTitle) {
            try {
              const list = await fetch(`/api/tasks/${parentId}/subtasks`);
              if (list.ok) {
                const items = await list.json();
                if (Array.isArray(items)) {
                  const found = items.find((i: any) => (i?.title || '').toLowerCase() === String(subTitle).toLowerCase());
                  verified = !!found;
                }
              }
            } catch {}
          }
          const summary = verified ? (data?.message || 'Subtask created') : 'Subtask creation response received, but verification failed.';
          setMessages((prev) => [...prev, { role: 'assistant', content: summary }]);
          setResultMsg(summary);
          if (!verified) {
            setStepQueue(null);
            setQueueCancelled(true);
          }
          // If verified and we have more steps, continue the sequence
          if (verified && stepQueue && stepQueue.length > 0) {
            // Update step queue to remove the completed step and continue
            const [_, ...remainingSteps] = stepQueue;
            setStepQueue(remainingSteps);
            if (remainingSteps.length > 0) {
              startNextQueuedStep();
            }
          }
        }
      } else if (toolName === 'create-task') {
        const res = await fetch(`/api/ai/tools/${toolName}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(pendingTool.args),
        });
        const data = await res.json();
        if (!res.ok) {
          setResultMsg(data?.error ? `Error: ${data.error}` : `Failed to execute ${toolName}`);
        } else {
          // Capture the created task ID for subsequent steps
          const createdTask = data?.task || data;
          if (createdTask?.id) {
            setLastCreatedTaskId(createdTask.id);
            console.log('🎯 [AI Chat] Captured created task ID:', createdTask.id);
          }
          
          const summary = data?.message || `Task "${createdTask?.title || 'New Task'}" created successfully.`;
          setMessages((prev) => [...prev, { role: 'assistant', content: summary }]);
          setResultMsg(summary);
          
          // Continue with next queued step if any
          if (stepQueue && stepQueue.length > 0) {
            const remainingSteps = stepQueue.slice(1);
            setStepQueue(remainingSteps);
            if (remainingSteps.length > 0) {
              startNextQueuedStep();
            }
          }
        }
      } else {
        // Default behavior for other writer tools
        const res = await fetch(`/api/ai/tools/${toolName}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(pendingTool.args),
        });
        const data = await res.json();
        if (!res.ok) {
          setResultMsg(data?.error ? `Error: ${data.error}` : `Failed to execute ${toolName}`);
        } else {
          const summary = data?.message || `${toolName} executed successfully.`;
          setMessages((prev) => [...prev, { role: 'assistant', content: summary }]);
          setResultMsg(summary);
        }
      }
    } catch (e: any) {
      setResultMsg(e?.message || 'Unexpected error');
    } finally {
      setExecuting(false);
      setPendingTool(null);
      // Note: Manual continuation is handled in the success paths above
      // to ensure proper sequencing and verification
    }
  }

  function normalizeWriterToolName(name: string): string {
    const t = normalizeToolRouteName(name);
    if (t === 'post-breakdown-task') return 'breakdown-task';
    if (t === 'post-create-subtask') return 'create-subtask';
    if (t === 'post-update-subtask') return 'update-subtask';
    if (t === 'post-delete-subtask') return 'delete-subtask';
    return t;
  }

  async function startNextQueuedStep() {
    if (queueCancelled || !stepQueue || stepQueue.length === 0) {
      setStepQueue(null);
      return;
    }
    
    // Get the next step without modifying state yet
    const [next, ...rest] = stepQueue;
    const t = normalizeToolRouteName(next.tool);
    const isReader = t.startsWith('get-') || t === 'search-tasks' || t === 'get-task-details' || t === 'search-bugs' || t === 'get-bug-details';
    const isWriter = t.startsWith('post-') || ['update-task', 'create-task', 'comment', 'delete-task', 'breakdown-task', 'create-bug-from-text', 'create-bug', 'update-bug', 'delete-bug', 'create-subtask', 'update-subtask', 'delete-subtask'].includes(normalizeWriterToolName(t));

    if (isReader) {
      await executeReaderTool(t, next.args);
      // Update state and continue to next step
      setStepQueue(rest);
      if (rest.length > 0) {
        startNextQueuedStep();
      }
      return;
    }
    
    if (isWriter) {
      // For create-subtask, inject lastCreatedTaskId if available
      let args = next.args;
      const normalized = normalizeWriterToolName(t);
      
      if (normalized === 'create-subtask' && !args.taskId && lastCreatedTaskId) {
        args = { ...args, taskId: lastCreatedTaskId };
      }
      
      // Set the pending tool and wait for user confirmation
      setPendingTool({ tool: normalized, args });
      // Don't update stepQueue yet - wait for execution to complete
      return;
    }
    
    // Unknown tool; skip to next
    setStepQueue(rest);
    if (rest.length > 0) {
      startNextQueuedStep();
    }
  }

  

  // async function executePendingTool() {
  //   if (!pendingTool) return;
  //   setExecuting(true);
  //   setResultMsg(null);
    
  //   console.log('⚡ [AI Chat] Executing tool:', {
  //     tool: pendingTool.tool,
  //     args: pendingTool.args,
  //     resolvedProjectId,
  //     resolvedTaskId,
  //     effectiveProjectId
  //   });
    
  //   try {
  //     if (pendingTool.tool === 'update-task') {
  //       const args = pendingTool.args || {};
  //       // Use the already resolved ID, or the one from the tool args
  //       let finalTaskId = args.taskId || resolvedTaskId;

  //       // --- START: MODIFICATION ---
  //       // If we still don't have an ID, but we have a title, make one last attempt to resolve it.
  //       // This makes the confirmation step more robust.
  //       if (!finalTaskId && (args.taskTitle || args.title)) {
  //         const title = args.taskTitle || args.title;
  //         const projectId = args.projectId || resolvedProjectId || effectiveProjectId;
  //         console.log(`🔍 [AI Chat] Final attempt to resolve task ID for title: "${title}" in project: ${projectId}`);
  //         finalTaskId = await resolveTaskIdByTitle(title, { projectId: projectId || undefined });
  //         console.log(`🔍 [AI Chat] Final resolution result:`, { title, projectId, finalTaskId });
  //       }
  //       // --- END: MODIFICATION ---

  //       // Resolve assigneeName to assigneeId if provided
  //       let finalAssigneeId: string | undefined = args.assigneeId ?? undefined;
  //       if (args.assigneeName && !args.assigneeId) {
  //         console.log('🔍 [AI Chat] Resolving assignee name to ID:', args.assigneeName);
  //         let resolvedUserId: string | undefined;
  //         if (typeof args.assigneeName === 'string' && isIdLike(args.assigneeName)) {
  //           resolvedUserId = args.assigneeName;
  //         } else {
  //           resolvedUserId = (await resolveUserIdByName(args.assigneeName, { projectId: effectiveProjectId ?? undefined })) ?? undefined;
  //         }
  //         if (!resolvedUserId) {
  //           setResultMsg(`Error: Could not find user "${args.assigneeName}" in this project/workspace.`);
  //           setExecuting(false);
  //           setPendingTool(null);
  //           return;
  //         }
  //         finalAssigneeId = resolvedUserId;
  //         console.log('🔍 [AI Chat] Assignee resolution result:', { name: args.assigneeName, id: finalAssigneeId });
  //       }

  //       const payload: any = {
  //         ...args,
  //         taskId: finalTaskId, // Use the potentially newly resolved ID
  //         assigneeId: finalAssigneeId, // Use the resolved assignee ID (already undefined if null)
  //       };
        
  //       // This check is now more reliable because of the final attempt above.
  //       if (!payload.taskId) {
  //         setResultMsg('Error: Could not find a task matching that title. Please be more specific, or use the task ID.');
  //       } else {
  //         console.log('📤 [AI Chat] Calling update-task API with payload:', payload);
  //         const res = await fetch('/api/ai/tools/update-task', {
  //         method: 'POST',
  //         headers: { 'Content-Type': 'application/json' },
  //           body: JSON.stringify(payload),
  //         });
  //         const data = await res.json();
  //         console.log('📥 [AI Chat] update-task API response:', { status: res.status, data });
  //         if (!res.ok) {
  //           setResultMsg(data?.error ? `Error: ${data.error}` : 'Failed to update task');
  //         } else {
  //           setResultMsg(data?.message || 'Task updated');
  //           const summary = data?.task
  //             ? `Updated task ${data.task.id} (${data.task.title || ''})`
  //             : 'Task updated successfully';
  //           setMessages((prev) => [...prev, { role: 'assistant', content: summary }]);
  //         }
  //       }
  //     } else if (pendingTool.tool === 'create-task') {
  //       // (Your existing create-task logic remains here)
  //       const args = pendingTool.args || {};
  //       const payload: any = {
  //         projectId: args.projectId || effectiveProjectId,
  //         projectName: args.projectName || args.project || undefined,
  //         title: args.title || args.name || 'New Task',
  //         details: args.details ?? args.description ?? null,
  //         priority: args.priority || 'medium',
  //       };
  //       // Handle assignee resolution
  //       if (args.assigneeName && !args.assigneeId) {
  //         console.log('🔍 [AI Chat] Resolving assignee name to ID for create-task:', args.assigneeName);
  //         let resolvedUserId: string | undefined;
  //         if (typeof args.assigneeName === 'string' && isIdLike(args.assigneeName)) {
  //           resolvedUserId = args.assigneeName;
  //         } else {
  //           resolvedUserId = (await resolveUserIdByName(args.assigneeName, { projectId: effectiveProjectId ?? undefined })) ?? undefined;
  //         }
  //         if (!resolvedUserId) {
  //           setResultMsg(`Error: Could not find user "${args.assigneeName}" in this project/workspace.`);
  //           setExecuting(false);
  //           setPendingTool(null);
  //           return;
  //         }
  //         payload.assigneeId = resolvedUserId;
  //         console.log('🔍 [AI Chat] Create-task assignee resolution result:', { name: args.assigneeName, id: payload.assigneeId });
  //       } else if (Object.prototype.hasOwnProperty.call(args, 'assigneeId')) {
  //         payload.assigneeId = args.assigneeId ?? undefined;
  //       }
  //       if (Object.prototype.hasOwnProperty.call(args, 'status')) payload.status = args.status;

  //       if (!payload.projectId && payload.projectName) {
  //         const resolved = await resolveProjectIdByName(String(payload.projectName));
  //         if (resolved) payload.projectId = resolved;
  //         if (resolved) setResolvedProjectId(resolved);
  //       }

  //       if (!payload.projectId) {
  //         setResultMsg('Error: Missing projectId. Open a project or include projectId/projectName in the tool args.');
  //       } else {
  //         console.log('📤 [AI Chat] Calling create-task API with payload:', payload);
  //         const res = await fetch('/api/ai/tools/create-task', {
  //           method: 'POST',
  //           headers: { 'Content-Type': 'application/json' },
  //           body: JSON.stringify(payload),
  //         });
  //         const data = await res.json();
  //         console.log('📥 [AI Chat] create-task API response:', { status: res.status, data });
  //         if (!res.ok) {
  //           setResultMsg(data?.error ? `Error: ${data.error}` : 'Failed to create task');
  //         } else {
  //           const t = data?.task || data;
  //           const summary = t?.id ? `Created task ${t.id} (${t.title || ''})` : 'Task created';
  //           setMessages((prev) => [...prev, { role: 'assistant', content: summary }]);
  //           setResultMsg('Task created successfully');
  //         }
  //       }
  //     } else if (pendingTool.tool === 'comment') {
  //       // (Your existing comment logic remains here)
  //       const args = pendingTool.args || {};
  //       const payload: any = {
  //         projectId: args.projectId || resolvedProjectId || projectId,
  //         taskId: args.taskId || resolvedTaskId || undefined,
  //         content: args.content || args.text || '',
  //       };
  //       if (!payload.projectId && args.projectName) {
  //         const pid = await resolveProjectIdByName(String(args.projectName));
  //         if (pid) payload.projectId = pid;
  //       }
  //       if (!payload.taskId && args.taskTitle) {
  //         const tid = await resolveTaskIdByTitle(String(args.taskTitle), { projectId: payload.projectId || projectId });
  //         if (tid) payload.taskId = tid;
  //       }
  //       if (!payload.projectId || !payload.taskId || !payload.content) {
  //         setResultMsg('Error: Missing projectId/taskId/content for comment. Include projectName and taskTitle or open the project.');
  //       } else {
  //         console.log('📤 [AI Chat] Calling comment API with payload:', payload);
  //         const res = await fetch(`/api/ai/tools/comment`, {
  //           method: 'POST',
  //           headers: { 'Content-Type': 'application/json' },
  //           body: JSON.stringify(payload),
  //         });
  //         const data = await res.json();
  //         console.log('📥 [AI Chat] comment API response:', { status: res.status, data });
  //         if (!res.ok) {
  //           setResultMsg(data?.error ? `Error: ${data.error}` : 'Failed to add comment');
  //         } else {
  //           setMessages((prev) => [...prev, { role: 'assistant', content: 'Comment added.' }]);
  //           setResultMsg('Comment added successfully');
  //         }
  //       }
  //     } else {
  //       setResultMsg(`Unsupported tool: ${pendingTool.tool}`);
  //     }
  //   } catch (e: any) {
  //     setResultMsg(e?.message || 'Unexpected error');
  //   } finally {
  //     setExecuting(false);
  //     setPendingTool(null);
  //   }
  // }


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
                  <ReactMarkdown>{m.content}</ReactMarkdown>
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
            {pendingPlan && pendingPlan.length > 0 && (
              <Button variant="secondary" onClick={approvePlanAndExecute} disabled={loading}>
                Proceed
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={!!pendingTool && !isReaderToolName(pendingTool?.tool)}>
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
              ) : pendingTool?.tool === 'delete-task' ? (
                <div className="text-sm">
                  The AI wants to delete a task with the following details:
                  <pre className="mt-2 max-h-40 overflow-auto rounded bg-muted p-2 text-xs">
{JSON.stringify({
  taskId: pendingTool?.args?.taskId || resolvedTaskId || '(resolving or missing)',
  taskTitle: resolvedTaskTitle || pendingTool?.args?.taskTitle || undefined,
  projectId: pendingTool?.args?.projectId || resolvedProjectId || effectiveProjectId || undefined,
}, null, 2)}
                  </pre>
                  Do you want to proceed?
                </div>
              ) : pendingTool?.tool === 'breakdown-task' ? (
                <div className="text-sm">
                  The AI wants to break down a task into subtasks:
                  <pre className="mt-2 max-h-40 overflow-auto rounded bg-muted p-2 text-xs">
{JSON.stringify({
  projectId: pendingTool?.args?.projectId || resolvedProjectId || effectiveProjectId || '(missing)',
  title: pendingTool?.args?.title || '(missing)'
}, null, 2)}
                  </pre>
                  Do you want to proceed?
                </div>
              ) : pendingTool?.tool === 'create-bug-from-text' ? (
                <div className="text-sm">
                  The AI wants to create a bug from unstructured text:
                  <pre className="mt-2 max-h-40 overflow-auto rounded bg-muted p-2 text-xs">
{JSON.stringify({
  projectId: pendingTool?.args?.projectId || resolvedProjectId || effectiveProjectId || '(missing)',
  text: pendingTool?.args?.text ? String(pendingTool?.args?.text).slice(0, 200) + (String(pendingTool?.args?.text).length > 200 ? '…' : '') : '(missing)'
}, null, 2)}
                  </pre>
                  Do you want to proceed?
                </div>
              ) : pendingTool?.tool === 'create-subtask' ? (
                <div className="text-sm">
                  The AI wants to create a subtask:
                  <pre className="mt-2 max-h-40 overflow-auto rounded bg-muted p-2 text-xs">
{JSON.stringify({
  projectId: pendingTool?.args?.projectId || resolvedProjectId || effectiveProjectId || undefined,
  taskId: pendingTool?.args?.taskId || resolvedTaskId || '(resolving or missing)',
  taskTitle: resolvedTaskTitle || pendingTool?.args?.taskTitle || undefined,
  title: pendingTool?.args?.title || '(missing)',
  assigneeName: pendingTool?.args?.assigneeName || undefined,
}, null, 2)}
                  </pre>
                  Do you want to proceed?
                </div>
              ) : pendingTool?.tool === 'update-subtask' ? (
                <div className="text-sm">
                  The AI wants to update a subtask:
                  <pre className="mt-2 max-h-40 overflow-auto rounded bg-muted p-2 text-xs">
{JSON.stringify({
  projectId: pendingTool?.args?.projectId || resolvedProjectId || effectiveProjectId || undefined,
  taskId: pendingTool?.args?.taskId || resolvedTaskId || '(resolving or missing)',
  taskTitle: resolvedTaskTitle || pendingTool?.args?.taskTitle || undefined,
  subtaskId: pendingTool?.args?.subtaskId || '(missing)',
  title: pendingTool?.args?.title,
  isCompleted: pendingTool?.args?.isCompleted,
  assigneeName: pendingTool?.args?.assigneeName,
}, null, 2)}
                  </pre>
                  Do you want to proceed?
                </div>
              ) : pendingTool?.tool === 'delete-subtask' ? (
                <div className="text-sm">
                  The AI wants to delete a subtask:
                  <pre className="mt-2 max-h-40 overflow-auto rounded bg-muted p-2 text-xs">
{JSON.stringify({
  projectId: pendingTool?.args?.projectId || resolvedProjectId || effectiveProjectId || undefined,
  taskId: pendingTool?.args?.taskId || resolvedTaskId || '(resolving or missing)',
  taskTitle: resolvedTaskTitle || pendingTool?.args?.taskTitle || undefined,
  subtaskId: pendingTool?.args?.subtaskId || '(missing)'
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


