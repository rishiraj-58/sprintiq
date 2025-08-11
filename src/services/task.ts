export interface AssignedTaskRow {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate: string | null;
  projectId: string;
  projectName: string;
}

export const taskService = {
  async getAssignedTasksForUser(userId: string): Promise<AssignedTaskRow[]> {
    const res = await fetch(`/api/users/${userId}/tasks/assigned`, { headers: { 'Cache-Control': 'no-cache' } });
    if (!res.ok) {
      throw new Error('Failed to load assigned tasks');
    }
    return res.json();
  },
  async updateTaskStatus(taskId: string, status: string) {
    const res = await fetch(`/api/tasks/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      throw new Error('Failed to update task status');
    }
    return res.json();
  },
};


