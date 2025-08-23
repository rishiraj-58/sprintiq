import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { GITHUB_CLIENT_ID, GITHUB_REDIRECT_URI } from '@/lib/github';

export async function GET(request: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const workspaceId = searchParams.get('workspace_id');
    
    if (!workspaceId) {
      return NextResponse.json({ error: 'workspace_id is required' }, { status: 400 });
    }

    // Generate state parameter to prevent CSRF attacks
    const state = JSON.stringify({
      workspaceId,
      userId,
      timestamp: Date.now(),
    });

    // GitHub OAuth URL
    const githubAuthUrl = new URL('https://github.com/login/oauth/authorize');
    githubAuthUrl.searchParams.set('client_id', GITHUB_CLIENT_ID);
    githubAuthUrl.searchParams.set('redirect_uri', GITHUB_REDIRECT_URI);
    githubAuthUrl.searchParams.set('scope', 'repo,admin:org,read:user');
    githubAuthUrl.searchParams.set('state', Buffer.from(state).toString('base64'));

    return NextResponse.redirect(githubAuthUrl.toString());
  } catch (error) {
    console.error('GitHub auth error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
