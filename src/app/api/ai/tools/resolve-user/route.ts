import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/db';
import { workspaceMembers, projectMembers, profiles } from '@/db/schema';
import { and, eq, ilike, or } from 'drizzle-orm';

export async function POST(req: Request) {
  try {
    const user = await requireAuth();
    const { name, context } = await req.json();

    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    // First, get the current user's workspace ID
    const userWorkspace = await db
      .select({ workspaceId: workspaceMembers.workspaceId })
      .from(workspaceMembers)
      .where(eq(workspaceMembers.profileId, user.id))
      .limit(1);

    if (userWorkspace.length === 0) {
      return NextResponse.json({ error: 'User not found in any workspace' }, { status: 404 });
    }

    const userWorkspaceId = userWorkspace[0].workspaceId;

    console.log('🔍 [resolve-user] Searching for users with name:', { name, userWorkspaceId, userId: user.id });

    // Search for users by name in the current user's workspace
    let workspaceMemberships = await db
      .select({
        profileId: workspaceMembers.profileId,
        role: workspaceMembers.role,
        profile: profiles
      })
      .from(workspaceMembers)
      .innerJoin(profiles, eq(workspaceMembers.profileId, profiles.id))
      .where(
        and(
          eq(workspaceMembers.workspaceId, userWorkspaceId),
          or(
            ilike(profiles.firstName, `%${name}%`),
            ilike(profiles.lastName, `%${name}%`),
            ilike(profiles.email, `%${name}%`)
          )
        )
      )
      .limit(10);

    console.log('🔍 [resolve-user] Found workspace members:', workspaceMemberships.length);

    // Fallback: tokenized full-name match (e.g., "rishi raj" => first:"rishi", last:"raj")
    if (workspaceMemberships.length === 0) {
      const tokens = String(name).trim().split(/\s+/).filter(Boolean);
      if (tokens.length >= 2) {
        const [first, ...rest] = tokens;
        const last = rest.join(' ');
        const tokenResults = await db
          .select({
            profileId: workspaceMembers.profileId,
            role: workspaceMembers.role,
            profile: profiles
          })
          .from(workspaceMembers)
          .innerJoin(profiles, eq(workspaceMembers.profileId, profiles.id))
          .where(
            and(
              eq(workspaceMembers.workspaceId, userWorkspaceId),
              and(
                ilike(profiles.firstName, `%${first}%`),
                ilike(profiles.lastName, `%${last}%`)
              )
            )
          )
          .limit(10);
        workspaceMemberships = tokenResults;
        console.log('🔍 [resolve-user] Tokenized name fallback results:', tokenResults.length);
      }
    }

    // If context includes projectId, also check project membership
    let projectMemberships: any[] = [];
    if (context?.projectId) {
      projectMemberships = await db
        .select({
          profileId: projectMembers.profileId,
          role: projectMembers.role,
          profile: profiles
        })
        .from(projectMembers)
        .innerJoin(profiles, eq(projectMembers.profileId, profiles.id))
        .where(
          and(
            eq(projectMembers.projectId, context.projectId),
            or(
              ilike(profiles.firstName, `%${name}%`),
              ilike(profiles.lastName, `%${name}%`),
              ilike(profiles.email, `%${name}%`)
            )
          )
        )
        .limit(10);

      if (projectMemberships.length === 0) {
        const tokens = String(name).trim().split(/\s+/).filter(Boolean);
        if (tokens.length >= 2) {
          const [first, ...rest] = tokens;
          const last = rest.join(' ');
          const tokenResultsProj = await db
            .select({
              profileId: projectMembers.profileId,
              role: projectMembers.role,
              profile: profiles
            })
            .from(projectMembers)
            .innerJoin(profiles, eq(projectMembers.profileId, profiles.id))
            .where(
              and(
                eq(projectMembers.projectId, context.projectId),
                and(
                  ilike(profiles.firstName, `%${first}%`),
                  ilike(profiles.lastName, `%${last}%`)
                )
              )
            )
            .limit(10);
          projectMemberships = tokenResultsProj;
          console.log('🔍 [resolve-user] Project tokenized name fallback results:', tokenResultsProj.length);
        }
      }
    }

    // Combine and deduplicate results
    const allResults = [...workspaceMemberships, ...projectMemberships];
    const uniqueResults = allResults.filter((result, index, self) => 
      index === self.findIndex(r => r.profileId === result.profileId)
    );

    if (uniqueResults.length === 0) {
      return NextResponse.json({ error: 'No users found with that name', candidates: [] });
    }

    // Find best match (prioritize exact matches, then partial)
    let bestMatch = null;
    let bestScore = 0;

    for (const result of uniqueResults) {
      const fullName = `${result.profile.firstName || ''} ${result.profile.lastName || ''}`.trim();
      const email = result.profile.email || '';
      
      // Calculate similarity score
      let score = 0;
      if (fullName.toLowerCase().includes(name.toLowerCase())) score += 0.8;
      if (email.toLowerCase().includes(name.toLowerCase())) score += 0.6;
      if (fullName.toLowerCase() === name.toLowerCase()) score += 0.2;
      
      if (score > bestScore) {
        bestScore = score;
        bestMatch = result;
      }
    }

    const result = {
      best: bestMatch ? {
        id: bestMatch.profileId,
        name: `${bestMatch.profile.firstName || ''} ${bestMatch.profile.lastName || ''}`.trim(),
        email: bestMatch.profile.email,
        role: bestMatch.role,
        score: bestScore
      } : null,
      candidates: uniqueResults.map(result => ({
        id: result.profileId,
        name: `${result.profile.firstName || ''} ${result.profile.lastName || ''}`.trim(),
        email: result.profile.email,
        role: result.role
      }))
    };

    console.log('🔍 [resolve-user] Returning result:', result);
    return NextResponse.json(result);

  } catch (error) {
    console.error('Error resolving user ID:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
