import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/db';
import { bugs, profiles } from '@/db/schema';
import { and, eq, ilike, or } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    await requireAuth();
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');
    const projectId = searchParams.get('projectId');
    const status = searchParams.get('status');
    const severity = searchParams.get('severity');

    if (!projectId) {
      return NextResponse.json({ error: 'projectId is required' }, { status: 400 });
    }

    let whereConditions = [eq(bugs.projectId, projectId)];

    if (query && query.trim()) {
      const trimmedQuery = query.trim();
      whereConditions.push(ilike(bugs.title, `%${trimmedQuery}%`));
    }

    if (status && ['open', 'in-progress', 'resolved', 'closed'].includes(status)) {
      whereConditions.push(eq(bugs.status, status));
    }

    if (severity && ['low', 'medium', 'high', 'critical'].includes(severity)) {
      whereConditions.push(eq(bugs.severity, severity));
    }

    const bugsWithReporter = await db
      .select({
        id: bugs.id,
        title: bugs.title,
        description: bugs.description,
        status: bugs.status,
        severity: bugs.severity,
        projectId: bugs.projectId,
        reporterId: bugs.reporterId,
        assigneeId: bugs.assigneeId,
        createdAt: bugs.createdAt,
        updatedAt: bugs.updatedAt,
        resolvedAt: bugs.resolvedAt,
        reporter: {
          id: profiles.id,
          firstName: profiles.firstName,
          lastName: profiles.lastName,
          email: profiles.email,
        }
      })
      .from(bugs)
      .leftJoin(profiles, eq(bugs.reporterId, profiles.id))
      .where(and(...whereConditions))
      .orderBy(bugs.updatedAt);

    return NextResponse.json({ bugs: bugsWithReporter });
  } catch (error) {
    console.error('Search bugs error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

