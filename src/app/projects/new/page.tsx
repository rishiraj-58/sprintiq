"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useWorkspace } from '@/stores/hooks/useWorkspace';
import { usePermissions } from '@/hooks/usePermissions';

export default function NewProjectPage() {
  const router = useRouter();
  const { workspaces, currentWorkspace, fetchWorkspaces, setCurrentWorkspace } = useWorkspace();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [workspaceId, setWorkspaceId] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const { canManageMembers, canManageSettings } = usePermissions('workspace', currentWorkspace?.id || workspaceId);
  const canCreateProject = Boolean(canManageMembers || canManageSettings);

  useEffect(() => {
    (async () => {
      if (workspaces.length === 0) {
        await fetchWorkspaces();
      }
      // initialize from query param if provided
      const params = new URLSearchParams(window.location.search);
      const qWs = params.get('workspaceId');
      if (qWs) setWorkspaceId(qWs);
    })();
  }, [fetchWorkspaces, workspaces.length]);

  useEffect(() => {
    setWorkspaceId((prev) => prev || currentWorkspace?.id || workspaces[0]?.id);
  }, [currentWorkspace?.id, workspaces]);

  const submit = async () => {
    if (!name.trim() || !workspaceId) return;
    if (!canCreateProject) {
      alert('You do not have permission to create a project.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, workspaceId }),
      });
      if (!res.ok) throw new Error(await res.text());
      const proj = await res.json();
      router.push(`/projects/${proj.id}`);
    } catch (e) {
      console.error(e);
      alert('Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl space-y-4 p-6">
      <h1 className="text-2xl font-semibold">Create project</h1>
      <div className="space-y-2">
        <label className="text-sm">Workspace</label>
        <select
          className="w-full rounded border bg-background px-2 py-2 text-sm"
          value={workspaceId}
          onChange={(e) => setWorkspaceId(e.target.value)}
        >
          {workspaces.map((w) => (
            <option key={w.id} value={w.id}>{w.name}</option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <label className="text-sm">Name</label>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Website Revamp" />
      </div>
      <div className="space-y-2">
        <label className="text-sm">Description</label>
        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional description" />
      </div>
      <Button onClick={submit} disabled={loading || !workspaceId}>{loading ? 'Creating…' : 'Create project'}</Button>
    </div>
  );
}


