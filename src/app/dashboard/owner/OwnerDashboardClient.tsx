'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { useWorkspace } from '@/stores/hooks/useWorkspace';

export function OwnerDashboardClient() {
  const { currentWorkspace } = useWorkspace();
  const wsId = currentWorkspace?.id;
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight">Owner Overview</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader><CardTitle>Usage</CardTitle></CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">Monthly usage (static)</div>
            {wsId && <Link className="text-sm underline" href={`/dashboard/workspace/${wsId}/usage`}>View details</Link>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Billing</CardTitle></CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">Plan: Starter (static)</div>
            {wsId && <Link className="text-sm underline" href={`/dashboard/workspace/${wsId}/billing`}>Manage billing</Link>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Audit Logs</CardTitle></CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">Recent admin actions (static)</div>
            {wsId && <Link className="text-sm underline" href={`/dashboard/workspace/${wsId}/audit-logs`}>Open audit logs</Link>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}



