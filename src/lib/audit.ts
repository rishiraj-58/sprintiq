import { db } from '@/db';
import { auditLogs } from '@/db/schema';

type Severity = 'low' | 'medium' | 'high';

export type AuditLogDetails = Record<string, unknown> & {
  projectId?: string;
  projectName?: string;
  userEmail?: string;
};

export async function logAuditEvent(params: {
  workspaceId: string;
  actorId: string;
  action: string;
  severity?: Severity;
  ipAddress?: string | null;
  details?: AuditLogDetails;
}) {
  const { workspaceId, actorId, action, severity = 'low', ipAddress, details } = params;
  await db.insert(auditLogs).values({
    workspaceId,
    actorId,
    action,
    severity,
    ipAddress: ipAddress || undefined,
    details: details ? (details as any) : undefined,
  });
}


