'use client';

import { useEffect, useState } from 'react';

type TimelineProps = { projectId: string };

export function Timeline({ projectId }: TimelineProps) {
  const [data, setData] = useState<{ tasks: any[]; sprints: any[] } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/projects/${projectId}/timeline`);
        const json = await res.json();
        setData(json);
      } finally {
        setLoading(false);
      }
    })();
  }, [projectId]);

  if (loading) return <div className="text-sm text-muted-foreground">Loading…</div>;
  if (!data) return <div className="text-sm text-muted-foreground">No data.</div>;

  return (
    <div className="space-y-4">
      <div>
        <div className="mb-2 text-sm font-semibold">Sprints</div>
        {data.sprints.length === 0 ? (
          <div className="text-sm text-muted-foreground">No sprints.</div>
        ) : (
          <ul className="list-disc pl-5 text-sm">
            {data.sprints.map((s) => (
              <li key={s.id}>
                {s.name} — {s.startDate ? new Date(s.startDate).toLocaleDateString() : 'N/A'} → {s.endDate ? new Date(s.endDate).toLocaleDateString() : 'N/A'} ({s.status})
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <div className="mb-2 text-sm font-semibold">Upcoming tasks (by due date)</div>
        {data.tasks.length === 0 ? (
          <div className="text-sm text-muted-foreground">No tasks.</div>
        ) : (
          <ul className="list-disc pl-5 text-sm">
            {data.tasks
              .filter((t) => !!t.dueDate)
              .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
              .slice(0, 20)
              .map((t) => (
                <li key={t.id}>
                  {t.title} — {t.dueDate ? new Date(t.dueDate).toLocaleDateString() : 'N/A'} ({t.status})
                </li>
              ))}
          </ul>
        )}
      </div>
    </div>
  );
}


