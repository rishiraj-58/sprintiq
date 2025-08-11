'use client';

import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function ProjectReportsPage() {
  const params = useParams();
  const projectId = params?.projectId as string;

  return (
    <div className="space-y-6">
      {/* Main content - Sidebar handled by SidebarLayout */}
          <h1 className="text-2xl font-bold">Reports</h1>
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader><CardTitle>Burndown (static)</CardTitle></CardHeader>
              <CardContent>
                <div className="h-48 rounded border bg-gradient-to-b from-blue-200/50 to-transparent" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Workload Heatmap (static)</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: 35 }).map((_, i) => (
                    <div key={i} className={`h-6 rounded ${i % 5 === 0 ? 'bg-red-500/40' : i % 3 === 0 ? 'bg-yellow-500/30' : 'bg-green-500/30'}`} />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
    </div>
  );
}


