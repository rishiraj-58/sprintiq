import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/db';
import { projects, projectRepositories, githubIntegrations, workspaceMembers, externalTaskLinks, tasks } from '@/db/schema';
import { eq, and, inArray, sql } from 'drizzle-orm';
import { GitHubService } from '@/lib/github';

export async function GET(request: NextRequest) {
  try {
    console.log('Starting GitHub issues unlinked request');

    const profile = await requireAuth();
    console.log('Auth successful, profile:', profile.id);
    const searchParams = request.nextUrl.searchParams;
    const projectId = searchParams.get('projectId');
    console.log('Project ID:', projectId);

    if (!projectId) {
      return NextResponse.json({ error: 'projectId is required' }, { status: 400 });
    }

    // Verify user has access to the project using raw SQL
    console.log('Querying project...');
    const projectRaw = await db.execute(sql`
      SELECT p.id, p.workspace_id
      FROM projects p
      WHERE p.id = ${projectId}
      LIMIT 1
    `);

    // Handle different possible result formats based on drizzle-orm behavior
    const projectRows = Array.isArray(projectRaw) ? projectRaw : (projectRaw as any)?.rows || [];
    console.log('Project rows found:', projectRows.length);
    if (!projectRows.length) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }
    const project = projectRows[0];
    console.log('Project found:', project);

    // Check workspace membership using raw SQL
    const workspaceMemberRaw = await db.execute(sql`
      SELECT wm.id
      FROM workspace_members wm
      WHERE wm.workspace_id = ${project.workspace_id} AND wm.profile_id = ${profile.id}
      LIMIT 1
    `);

    // Handle different possible result formats based on drizzle-orm behavior
    const workspaceMemberRows = Array.isArray(workspaceMemberRaw) ? workspaceMemberRaw : (workspaceMemberRaw as any)?.rows || [];

    if (!workspaceMemberRows.length) {
      return NextResponse.json({ error: 'No access to project' }, { status: 403 });
    }

    // Get GitHub integration for workspace using raw SQL
    const integrationRaw = await db.execute(sql`
      SELECT gi.id, gi.access_token
      FROM github_integrations gi
      WHERE gi.workspace_id = ${project.workspace_id}
      LIMIT 1
    `);

    const integrationRows = Array.isArray(integrationRaw) ? integrationRaw : (integrationRaw as any)?.rows || [];
    if (!integrationRows.length) {
      return NextResponse.json({ error: 'GitHub not connected' }, { status: 404 });
    }

    const integration = integrationRows[0];

    // Get linked repositories for this project using raw SQL
    const linkedReposRaw = await db.execute(sql`
      SELECT pr.id, pr.github_repo_id, pr.repository_name, pr.repository_full_name
      FROM project_repositories pr
      WHERE pr.project_id = ${projectId}
    `);

    const linkedReposRows = Array.isArray(linkedReposRaw) ? linkedReposRaw : (linkedReposRaw as any)?.rows || [];
    const linkedRepos = linkedReposRows.map((row: any) => ({
      id: row.id,
      githubRepoId: row.github_repo_id,
      name: row.repository_name,
      fullName: row.repository_full_name
    }));

    if (linkedRepos.length === 0) {
      return NextResponse.json({
        issues: [],
        totalCount: 0,
        linkedCount: 0,
        message: 'No repositories linked to this project'
      });
    }

    const githubService = new GitHubService(integration.access_token);
    const allIssues: any[] = [];
    const linkedIssueUrls: string[] = [];

    // Get all GitHub issue URLs that are already linked to tasks
    let existingLinks = [];
    try {
      console.log('Querying external_task_links table...');
      // Use raw SQL for the complex query to avoid Drizzle issues
      const existingLinksRaw = await db.execute(sql`
        SELECT etl.external_url
        FROM external_task_links etl
        INNER JOIN tasks t ON etl.task_id = t.id
        WHERE t.project_id = ${projectId}
        AND etl.link_type = 'github_issue'
      `);

      existingLinks = Array.isArray(existingLinksRaw) ? existingLinksRaw : (existingLinksRaw as any)?.rows || [];
      console.log(`Found ${existingLinks.length} existing links`);
    } catch (error) {
      console.error('Error fetching existing links:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : String(error),
        code: error instanceof Error && 'code' in error ? (error as any).code : 'Unknown',
        severity: error instanceof Error && 'severity' in error ? (error as any).severity : 'Unknown'
      });
      // If the table doesn't exist yet, just continue with empty array
      existingLinks = [];
    }

    existingLinks.forEach((link: any) => {
      if (link.external_url) {
        linkedIssueUrls.push(link.external_url);
      }
    });

    // Fetch issues from each linked repository
    for (const repo of linkedRepos) {
      try {
        const [owner, repoName] = repo.fullName.split('/');
        const issues = await githubService.getRepositoryIssues(owner, repoName, 'open');

        // Filter out already linked issues
        const unlinkedIssues = issues.filter(issue =>
          !linkedIssueUrls.includes(issue.htmlUrl)
        );

        allIssues.push(...unlinkedIssues.map(issue => ({
          ...issue,
          repository: {
            ...issue.repository,
            projectRepositoryId: repo.id,
          }
        })));
      } catch (error) {
        console.error(`Error fetching issues for ${repo.fullName}:`, error);
        // Continue with other repositories even if one fails
      }
    }

    // Sort by most recently updated
    allIssues.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    return NextResponse.json({
      issues: allIssues,
      totalCount: allIssues.length,
      linkedCount: linkedIssueUrls.length,
      repositoriesCount: linkedRepos.length,
    });

  } catch (error) {
    console.error('Error fetching unlinked GitHub issues:', error);
    return NextResponse.json({ error: 'Failed to fetch issues' }, { status: 500 });
  }
}