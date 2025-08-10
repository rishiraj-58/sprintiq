'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useState } from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import { Checkbox } from '@/components/ui/checkbox';

export default function Client({ workspace }: { workspace: { id: string; name: string } }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const { canManageSettings } = usePermissions('workspace', workspace.id);

  const onDelete = async () => {
    if (!confirm(`Delete workspace "${workspace.name}"? This cannot be undone.`)) return;
    try {
      setDeleting(true);
      const res = await fetch(`/api/workspaces/${workspace.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed');
      router.push('/dashboard');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {canManageSettings && (
        <Card>
          <CardHeader>
            <CardTitle>Permissions Matrix</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground mb-4">Roles and capabilities overview</div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left">
                    <th className="p-2">Role</th>
                    <th className="p-2">view</th>
                    <th className="p-2">create</th>
                    <th className="p-2">edit</th>
                    <th className="p-2">delete</th>
                    <th className="p-2">manage_members</th>
                    <th className="p-2">manage_settings</th>
                  </tr>
                </thead>
                <tbody>
                  {[{
                    role: 'owner', caps: ['view','create','edit','delete','manage_members','manage_settings']
                  },{
                    role: 'manager', caps: ['view','create','edit','delete','manage_members']
                  },{
                    role: 'member', caps: ['view','create','edit']
                  },{
                    role: 'viewer', caps: ['view']
                  }].map(r => (
                    <tr key={r.role} className="border-t">
                      <td className="p-2 font-medium capitalize">{r.role}</td>
                      {['view','create','edit','delete','manage_members','manage_settings'].map(c => (
                        <td key={c} className="p-2">
                          <Checkbox checked={r.caps.includes(c)} disabled aria-readonly />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
      <Card>
        <CardHeader>
          <CardTitle>Danger Zone</CardTitle>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" onClick={onDelete} disabled={deleting}>
            {deleting ? 'Deleting…' : 'Delete Workspace'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

 