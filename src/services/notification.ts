import { db } from '@/db';
import { notifications, userNotificationPreferences, NotificationRow } from '@/db/schema';
import { eq } from 'drizzle-orm';

type NotificationType = 'mention' | 'task_assigned' | 'status_update' | 'comment_added' | 'system_alert';

export class NotificationService {
  // Socket is obtained per-send to ensure availability in serverless context

  static async isAllowed(userId: string, type: NotificationType): Promise<boolean> {
    const [prefs] = await db
      .select()
      .from(userNotificationPreferences)
      .where(eq(userNotificationPreferences.userId, userId));
    if (!prefs) return true;
    switch (type) {
      case 'mention':
        return prefs.mention;
      case 'task_assigned':
        return prefs.taskAssigned;
      case 'status_update':
        return prefs.statusUpdate;
      case 'comment_added':
        return prefs.commentAdded;
      default:
        return true;
    }
  }

  static async createNotification(data: {
    recipientId: string;
    actorId?: string | null;
    type: NotificationType;
    content: string;
    projectId?: string | null;
    taskId?: string | null;
  }): Promise<NotificationRow | null> {
    const allowed = await NotificationService.isAllowed(data.recipientId, data.type);
    if (!allowed) return null;
    const [row] = await db
      .insert(notifications)
      .values({
        recipientId: data.recipientId,
        actorId: data.actorId || undefined,
        type: data.type,
        content: data.content,
        projectId: data.projectId || undefined,
        taskId: data.taskId || undefined,
      })
      .returning();

    // Emit via socket
    try {
      // Prefer HTTP fallback to the socket server to avoid bundling socket client types
      const url = (process.env.SOCKET_URL || process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4001').replace(/\/$/, '');
      await fetch(`${url}/notify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: data.recipientId, notification: row }),
      }).catch(() => {});
    } catch {}
    return row;
  }
}


