"use client";

import React from 'react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

type WorkspaceItem = {
  id: string;
  name: string;
  description?: string | null;
  projectCount?: number | string | null;
};

function WorkspaceCard({ ws }: { ws: WorkspaceItem }) {
  return (
    <Link
      href={`/dashboard/workspace/${ws.id}`}
      className="block rounded-lg border p-4 hover:bg-muted/40 transition-colors"
    >
      <div className="font-medium">{ws.name}</div>
      <div className="text-sm text-muted-foreground mt-1">{ws.projectCount ?? 0} projects</div>
    </Link>
  );
}

export default function WorkspaceSearchAndList({ initialItems }: { initialItems: WorkspaceItem[] }) {
  const [query, setQuery] = React.useState('');
  const items = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return initialItems;
    return initialItems.filter((w) => w.name.toLowerCase().includes(q));
  }, [query, initialItems]);

  return (
    <div className="space-y-4">
      <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link href="/workspaces/new">
          <Button>Create Workspace</Button>
        </Link>
        <div className="flex w-full sm:justify-end">
          <Input
            placeholder="Search workspaces"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full max-w-sm"
          />
        </div>
      </div>

      {items.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          No workspaces found
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          {items.map((ws) => (
            <WorkspaceCard key={ws.id} ws={ws} />
          ))}
        </div>
      )}
    </div>
  );
}