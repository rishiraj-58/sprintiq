'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function ViewerDashboardClient() {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight">Viewer Overview</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader><CardTitle>Project Status (Read-only)</CardTitle></CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">Summary data (static)</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Tasks Summary</CardTitle></CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">Open vs Completed (static)</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}



