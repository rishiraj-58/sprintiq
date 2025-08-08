"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useWorkspace } from '@/stores/hooks/useWorkspace';

export default function NewWorkspacePage() {
  const router = useRouter();
  const { setCurrentWorkspace } = useWorkspace();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/workspaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description }),
      });
      if (!res.ok) throw new Error(await res.text());
      const ws = await res.json();
      // update current workspace in store and persist
      setCurrentWorkspace(ws);
      if (ws?.id) localStorage.setItem('siq:lastWorkspaceId', ws.id);
      router.push('/projects/new?workspaceId=' + ws.id);
    } catch (e) {
      console.error(e);
      alert('Failed to create workspace');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl space-y-4 p-6">
      <h1 className="text-2xl font-semibold">Create workspace</h1>
      <div className="space-y-2">
        <label className="text-sm">Name</label>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Acme Inc" />
      </div>
      <div className="space-y-2">
        <label className="text-sm">Description</label>
        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional description" />
      </div>
      <Button onClick={submit} disabled={loading}>{loading ? 'Creating…' : 'Create workspace'}</Button>
    </div>
  );
}


