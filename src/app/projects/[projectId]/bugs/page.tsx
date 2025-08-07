import { db } from '@/db';
import { bugs, projects } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default async function ProjectBugsPage({ params }: { params: { projectId: string } }) {
  const projectId = params.projectId;
  const [project] = await db.select().from(projects).where(eq(projects.id, projectId));
  const rows = await db.select().from(bugs).where(eq(bugs.projectId, projectId));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Bugs — {project?.name ?? ''}</h1>
        <p className="text-muted-foreground">Track and resolve issues</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {rows.map((b) => (
          <Card key={b.id}>
            <CardHeader>
              <CardTitle className="text-base">{b.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground mb-2">{b.description}</div>
              <div className="flex items-center gap-3 text-xs">
                <span className="rounded bg-amber-100 px-2 py-1 text-amber-900">{b.severity}</span>
                <span className="rounded bg-blue-100 px-2 py-1 text-blue-900">{b.status}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}


