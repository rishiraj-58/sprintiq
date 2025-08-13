import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/db';
import {
  projects,
  tasks,
  workspaceMembers,
} from '@/db/schema';
import { and, eq, ilike, inArray } from 'drizzle-orm';

type Entity = 'project' | 'task';

function normalize(input: string): string {
  return input.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function bigrams(s: string): string[] {
  const n = normalize(s).replace(/\s+/g, '');
  const grams: string[] = [];
  for (let i = 0; i < n.length - 1; i++) grams.push(n.slice(i, i + 2));
  return grams.length > 0 ? grams : n ? [n] : [];
}

function diceCoefficient(a: string, b: string): number {
  const aGrams = bigrams(a);
  const bGrams = bigrams(b);
  if (aGrams.length === 0 || bGrams.length === 0) return 0;
  const counts = new Map<string, number>();
  for (const g of aGrams) counts.set(g, (counts.get(g) || 0) + 1);
  let matches = 0;
  for (const g of bGrams) {
    const c = counts.get(g) || 0;
    if (c > 0) {
      matches += 1;
      counts.set(g, c - 1);
    }
  }
  return (2 * matches) / (aGrams.length + bGrams.length);
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const entity: Entity = (body.entity || '').toLowerCase();
    const name: string = String(body.name || '').trim();
    const context = (body.context || {}) as { workspaceId?: string; projectId?: string };
    const limit = Math.min(20, Math.max(1, Number(body.limit) || 10));

    if (!entity || !name) {
      return NextResponse.json({ error: 'entity and name are required' }, { status: 400 });
    }

    if (entity === 'project') {
      // This project logic is already good, no changes needed here.
      const rows = await db
        .select({ id: projects.id, name: projects.name })
        .from(projects)
        .innerJoin(workspaceMembers, eq(projects.workspaceId, workspaceMembers.workspaceId))
        .where(and(eq(workspaceMembers.profileId, user.id), ilike(projects.name, `%${name}%`)))
        .limit(limit);

      let candidates = rows.map((r) => ({ id: r.id as string, name: r.name as string, score: diceCoefficient(r.name || '', name) }));

      if (candidates.length === 0) {
        const all = await db
          .select({ id: projects.id, name: projects.name })
          .from(projects)
          .innerJoin(workspaceMembers, eq(projects.workspaceId, workspaceMembers.workspaceId))
          .where(eq(workspaceMembers.profileId, user.id));
        candidates = all
          .map((r) => ({ id: r.id as string, name: r.name as string, score: diceCoefficient(r.name || '', name) }))
          .sort((a, b) => b.score - a.score)
          .slice(0, limit);
      } else {
        candidates.sort((a, b) => b.score - a.score);
      }

      const best = candidates[0] || null;
      return NextResponse.json({ entity, query: name, best, candidates });
    }

    if (entity === 'task') {
      // --- Start of Modified Logic ---

      // First, determine which projects to search within. This part is unchanged.
      let projectIds: string[] | null = null;
      if (context?.projectId) {
        projectIds = [context.projectId];
      } else if (context?.workspaceId) {
        const wsMembership = await db
          .select({ id: workspaceMembers.id })
          .from(workspaceMembers)
          .where(and(eq(workspaceMembers.profileId, user.id), eq(workspaceMembers.workspaceId, context.workspaceId)));
        if (wsMembership.length === 0) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
        const rows = await db.select({ id: projects.id }).from(projects).where(eq(projects.workspaceId, context.workspaceId));
        projectIds = rows.map((r) => r.id as string);
      } else {
        const rows = await db
          .select({ id: projects.id })
          .from(projects)
          .innerJoin(workspaceMembers, eq(projects.workspaceId, workspaceMembers.workspaceId))
          .where(eq(workspaceMembers.profileId, user.id));
        projectIds = rows.map((r) => r.id as string);
      }

      if (!projectIds || projectIds.length === 0) {
        return NextResponse.json({ entity, query: name, best: null, candidates: [] });
      }

      // **IMPROVEMENT**: Perform an `ilike` search directly in the database.
      // This is much more efficient than fetching hundreds of rows and scoring them in-memory.
      let rows = await db
        .select({ id: tasks.id, title: tasks.title })
        .from(tasks)
        .where(
          and(
            inArray(tasks.projectId, projectIds),
            ilike(tasks.title, `%${name}%`) // The key change is here
          )
        )
        .limit(limit); // Limit the number of direct matches to score

      // Fallback: if no direct substring match, try tokenized AND matching (all words must appear)
      if (!rows || rows.length === 0) {
        const tokens = normalize(name).split(/\s+/).filter(Boolean);
        if (tokens.length > 0) {
          rows = await db
            .select({ id: tasks.id, title: tasks.title })
            .from(tasks)
            .where(
              and(
                inArray(tasks.projectId, projectIds),
                // require every token to appear somewhere in the title
                ...tokens.map((t) => ilike(tasks.title, `%${t}%`))
              )
            )
            .limit(limit);
        }
      }

      // Now, score only the relevant candidates returned by the database search.
      const candidates = rows
        .map((r) => ({ id: r.id as string, name: (r.title as string) || '', score: diceCoefficient((r.title as string) || '', name) }))
        .filter((c) => c.name)
        .sort((a, b) => b.score - a.score);
      
      const best = candidates[0] || null;
      return NextResponse.json({ entity, query: name, best, candidates });
      
      // --- End of Modified Logic ---
    }

    return NextResponse.json({ error: 'Unsupported entity' }, { status: 400 });
  } catch (e) {
    console.error('resolve-id error', e);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}