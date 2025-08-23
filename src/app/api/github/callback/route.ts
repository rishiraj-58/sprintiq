// File: src/app/api/github/callback/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/db';
import { githubIntegrations, workspaceMembers } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET } from '@/lib/github';
import { Octokit } from '@octokit/rest';

// Helper function to create absolute redirect URLs
function createRedirectUrl(path: string, params: Record<string, string> = {}) {
  const url = new URL(path, process.env.NEXT_PUBLIC_APP_URL);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return url.toString();
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.redirect(createRedirectUrl('/auth/sign-in', { error: 'unauthorized' }));
    }

    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    if (error) {
      return NextResponse.redirect(createRedirectUrl('/dashboard', { error: 'github_auth_failed', message: error }));
    }

    if (!code || !state) {
      return NextResponse.redirect(createRedirectUrl('/dashboard', { error: 'github_auth_failed', message: 'missing_code_or_state' }));
    }

    // Decode and validate state
    let stateData;
    try {
      stateData = JSON.parse(Buffer.from(state, 'base64').toString());
    } catch {
      return NextResponse.redirect(createRedirectUrl('/dashboard', { error: 'github_auth_failed', message: 'invalid_state' }));
    }

    const { workspaceId, userId: stateUserId, timestamp } = stateData;

    // Validate state
    if (stateUserId !== userId) {
      return NextResponse.redirect(createRedirectUrl('/dashboard', { error: 'github_auth_failed', message: 'user_mismatch' }));
    }

    if (Date.now() - timestamp > 15 * 60 * 1000) {
      return NextResponse.redirect(createRedirectUrl('/dashboard', { error: 'github_auth_failed', message: 'state_expired' }));
    }

    const workspaceMember = await db
      .select()
      .from(workspaceMembers)
      .where(and(eq(workspaceMembers.workspaceId, workspaceId), eq(workspaceMembers.profileId, userId)))
      .limit(1);

    if (!workspaceMember.length) {
      return NextResponse.redirect(createRedirectUrl('/dashboard', { error: 'github_auth_failed', message: 'no_workspace_access' }));
    }

    // Exchange code for access token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: GITHUB_CLIENT_ID,
        client_secret: GITHUB_CLIENT_SECRET,
        code,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      return NextResponse.redirect(createRedirectUrl('/dashboard', { error: 'github_auth_failed', message: tokenData.error }));
    }

    const { access_token, refresh_token, expires_in } = tokenData;

    const octokit = new Octokit({ auth: access_token });
    const { data: user } = await octokit.rest.users.getAuthenticated();
    const { data: orgs } = await octokit.rest.orgs.listForAuthenticatedUser();
    const githubOrgName = orgs.length > 0 ? orgs[0].login : user.login;

    const existingIntegration = await db
      .select()
      .from(githubIntegrations)
      .where(eq(githubIntegrations.workspaceId, workspaceId))
      .limit(1);

    const expiresAt = expires_in ? new Date(Date.now() + expires_in * 1000) : null;

    if (existingIntegration.length > 0) {
      await db
        .update(githubIntegrations)
        .set({
          githubOrgName,
          accessToken: access_token, // IMPORTANT: Encrypt this in production
          refreshToken: refresh_token, // IMPORTANT: Encrypt this in production
          expiresAt,
          connectedById: userId,
          updatedAt: new Date(),
        })
        .where(eq(githubIntegrations.id, existingIntegration[0].id));
    } else {
      await db.insert(githubIntegrations).values({
        workspaceId,
        githubInstallationId: user.id.toString(),
        githubOrgName,
        accessToken: access_token, // IMPORTANT: Encrypt this in production
        refreshToken: refresh_token, // IMPORTANT: Encrypt this in production
        expiresAt,
        connectedById: userId,
      });
    }

    return NextResponse.redirect(createRedirectUrl(`/dashboard/workspace/${workspaceId}`, {
      tab: 'integrations',
      success: 'github_connected'
    }));
  } catch (error) {
    console.error('GitHub callback error:', error);
    // This is the final catch-all error redirect
    return NextResponse.redirect(createRedirectUrl('/dashboard', { error: 'github_auth_failed', message: 'internal_error' }));
  }
}