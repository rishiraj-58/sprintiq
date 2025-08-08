import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { PermissionManager } from '@/lib/permissions';

export async function GET(req: Request) {
  try {
    const profile = await requireAuth();
    const { searchParams } = new URL(req.url);
    const contextId = searchParams.get('contextId');
    const contextType = (searchParams.get('contextType') as 'workspace' | 'project') || 'workspace';

    if (!contextId) {
      return new NextResponse('Context ID is required', { status: 400 });
    }

    const capabilities = await PermissionManager.getUserCapabilities(profile.id, contextId, contextType);
    return NextResponse.json({ capabilities });

  } catch (error) {
    console.error("API Error fetching permissions:", error);
    if (error instanceof Error && error.message.includes('Not authenticated')) {
      return new NextResponse('Unauthorized', { status: 401 });
    }
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}