'use client';

interface ActivityFeedProps {
  taskId: string;
  workspaceId: string;
}

export function ActivityFeed({ taskId, workspaceId }: ActivityFeedProps) {
  return (
    <div className="space-y-4">
      <h3 className="font-semibold">Activity Feed</h3>
      <p>Task ID: {taskId}</p>
      <p>Workspace ID: {workspaceId}</p>
    </div>
  );
}
