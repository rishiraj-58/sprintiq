import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/db';
import { bugs, profiles } from '@/db/schema';
import { and, eq, ilike } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    await requireAuth();
    const { searchParams } = new URL(request.url);
    const bugId = searchParams.get('bugId');
    const bugTitle = searchParams.get('bugTitle');
    const projectId = searchParams.get('projectId');

    if (!bugId && !bugTitle) {
      return NextResponse.json({ error: 'bugId or bugTitle is required' }, { status: 400 });
    }

    let whereConditions = [];

    if (bugId) {
      whereConditions.push(eq(bugs.id, bugId));
    } else if (bugTitle) {
      whereConditions.push(ilike(bugs.title, `%${bugTitle.trim()}%`));
      if (projectId) {
        whereConditions.push(eq(bugs.projectId, projectId));
      }
    }

    const bugWithDetails = await db
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
      .limit(1);

    if (bugWithDetails.length === 0) {
      return NextResponse.json({ error: 'Bug not found' }, { status: 404 });
    }

    return NextResponse.json({ bug: bugWithDetails[0] });
  } catch (error) {
    console.error('Get bug details error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

