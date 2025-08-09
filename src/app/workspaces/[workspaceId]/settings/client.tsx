'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useState } from 'react';

export default function Client({ workspace }: { workspace: { id: string; name: string } }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

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

 