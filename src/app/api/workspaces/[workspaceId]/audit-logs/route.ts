import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/db';
import { auditLogs, profiles, workspaceMembers } from '@/db/schema';
import { and, desc, eq, gte, lte, ilike } from 'drizzle-orm';

function parseDateParam(value: string | null): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

function startOfDay(d: Date): Date {
  const n = new Date(d);
  n.setHours(0, 0, 0, 0);
  return n;
}

function endOfDay(d: Date): Date {
  const n = new Date(d);
  n.setHours(23, 59, 59, 999);
  return n;
}

export async function GET(req: Request, { params }: { params: { workspaceId: string } }) {
  try {
    const profile = await requireAuth();
    const { workspaceId } = params;
    const url = new URL(req.url);
    const action = url.searchParams.get('action');
    const severity = url.searchParams.get('severity');
    const startParam = url.searchParams.get('start');
    const endParam = url.searchParams.get('end');
    const limitParam = url.searchParams.get('limit');
    const cursorParam = url.searchParams.get('cursor'); // for pagination, use created_at < cursor

    // must be a member
    const [membership] = await db
      .select({ id: workspaceMembers.id })
      .from(workspaceMembers)
      .where(and(eq(workspaceMembers.workspaceId, workspaceId), eq(workspaceMembers.profileId, profile.id)));
    if (!membership) return new NextResponse('Forbidden', { status: 403 });

    const startDate = startOfDay(parseDateParam(startParam) ?? new Date(Date.now() - 29 * 24 * 3600 * 1000));
    const endDate = endOfDay(parseDateParam(endParam) ?? new Date());
    const limit = Math.min(200, Math.max(1, Number(limitParam) || 50));

    // Build where clauses
    const whereClauses: any[] = [eq(auditLogs.workspaceId, workspaceId), gte(auditLogs.createdAt, startDate), lte(auditLogs.createdAt, endDate)];
    if (action) whereClauses.push(ilike(auditLogs.action, `%${action}%`));
    if (severity) whereClauses.push(eq(auditLogs.severity, severity));
    if (cursorParam) whereClauses.push(lte(auditLogs.createdAt, new Date(cursorParam)));

    const rows = await db
      .select({
        id: auditLogs.id,
        createdAt: auditLogs.createdAt,
        action: auditLogs.action,
        severity: auditLogs.severity,
        ipAddress: auditLogs.ipAddress,
        details: auditLogs.details,
        actorId: auditLogs.actorId,
        firstName: profiles.firstName,
        lastName: profiles.lastName,
        email: profiles.email,
      })
      .from(auditLogs)
      .innerJoin(profiles, eq(auditLogs.actorId, profiles.id))
      .where(and(...whereClauses))
      .orderBy(desc(auditLogs.createdAt))
      .limit(limit);

    return NextResponse.json(
      rows.map((r) => ({
        id: r.id,
        createdAt: r.createdAt,
        action: r.action,
        severity: r.severity,
        ipAddress: r.ipAddress,
        actor: {
          id: r.actorId,
          name: [r.firstName, r.lastName].filter(Boolean).join(' ') || r.email || r.actorId,
          email: r.email,
          initials: [r.firstName, r.lastName].filter(Boolean).map((n) => n?.[0]).join('') || 'U',
        },
        details: r.details,
      }))
    );
  } catch (e) {
    console.error('GET audit logs error', e);
    if (e instanceof Error && e.message.includes('Not authenticated')) return new NextResponse('Unauthorized', { status: 401 });
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}


