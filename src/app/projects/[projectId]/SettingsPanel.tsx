'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import type { Project } from '@/db/schema';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export function SettingsPanel({ project, canEdit, canDelete, onDeleted, isWorkspaceManager }: { project: Project; canEdit: boolean; canDelete: boolean; onDeleted: () => void; isWorkspaceManager?: boolean; }) {
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description ?? '');
  const [status, setStatus] = useState(project.status);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, status }),
      });
      if (!res.ok) throw new Error(await res.text());
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!confirm('This will permanently delete the project. Continue?')) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/projects/${project.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(await res.text());
      onDeleted();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>General</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <label className="text-sm">Name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} disabled={!canEdit} />
          </div>
          <div>
            <label className="text-sm">Description</label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} disabled={!canEdit} />
          </div>
          <div>
            <label className="text-sm">Status</label>
            <select className="w-full rounded border bg-background px-2 py-2 text-sm" value={status} onChange={(e) => setStatus(e.target.value)} disabled={!canEdit}>
              <option value="active">active</option>
              <option value="paused">paused</option>
              <option value="archived">archived</option>
            </select>
          </div>
          {canEdit && (
            <Button onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</Button>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Danger zone</CardTitle>
        </CardHeader>
        <CardContent>
          {isWorkspaceManager ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-flex" tabIndex={0} aria-disabled>
                    <Button variant="destructive" disabled>
                      Delete project
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  Only a workspace Owner can permanently delete a project.
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            <Button variant="destructive" onClick={remove} disabled={!canDelete || deleting}>{deleting ? 'Deleting…' : 'Delete project'}</Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


