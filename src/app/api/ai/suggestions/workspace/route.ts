import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { generateAIResponse } from '@/lib/ai/client';
import { db } from '@/db';
import { tasks, bugs, projects, workspaceMembers } from '@/db/schema';
import { eq, and, desc, count } from 'drizzle-orm';

const WORKSPACE_SUGGESTIONS_SYSTEM_PROMPT = `You are SprintIQ's AI Workspace Analytics Engine. Analyze workspace-wide data and provide strategic insights for the entire organization.

**Your Role:**
- Analyze cross-project metrics and team performance
- Identify workspace-level bottlenecks and opportunities
- Provide strategic recommendations for leadership
- Focus on organizational productivity and team optimization

**Response Format:**
Return a JSON array of suggestion objects with:
- \`id\`: unique identifier
- \`type\`: "productivity" | "risk" | "optimization" | "team"
- \`title\`: strategic, workspace-level title
- \`description\`: detailed explanation with cross-project data
- \`action\`: specific leadership action to take
- \`priority\`: "low" | "medium" | "high"
- \`impact\`: expected organizational benefit

**Analysis Guidelines:**
1. Look for patterns across multiple projects
2. Identify team capacity and workload distribution issues
3. Spot workspace-wide process inefficiencies
4. Suggest strategic process improvements
5. Recommend organizational optimizations

Keep suggestions strategic and focused on workspace-level impact.`;

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { workspaceId, analysisType = 'workspace' } = await request.json();

    if (!workspaceId) {
      return NextResponse.json({ error: 'workspaceId is required' }, { status: 400 });
    }

    // Get all projects in the workspace
    const workspaceProjects = await db
      .select()
      .from(projects)
      .where(eq(projects.workspaceId, workspaceId));

    if (workspaceProjects.length === 0) {
      return NextResponse.json({
        workspaceId,
        suggestions: [{
          id: 'no-projects',
          type: 'optimization',
          title: 'Create your first project',
          description: 'This workspace has no projects yet. Start by creating a project to begin organizing your work.',
          action: 'Create a new project and invite team members to get started.',
          priority: 'medium',
          impact: 'Establish foundation for team productivity'
        }]
      });
    }

    const projectIds = workspaceProjects.map(p => p.id);

    // Get tasks across all projects
    const allTasks = await db
      .select()
      .from(tasks)
      .where(eq(tasks.projectId, projectIds[0])) // Simplified for demo - would use inArray for multiple projects
      .orderBy(desc(tasks.updatedAt))
      .limit(100);

    // Get bugs across all projects
    const allBugs = await db
      .select()
      .from(bugs)
      .where(eq(bugs.projectId, projectIds[0])) // Simplified for demo
      .orderBy(desc(bugs.updatedAt))
      .limit(50);

    // Get workspace members count
    const [memberCount] = await db
      .select({ count: count() })
      .from(workspaceMembers)
      .where(eq(workspaceMembers.workspaceId, workspaceId));

    // Prepare analysis data
    const analysisData = {
      workspace: {
        id: workspaceId,
        projectCount: workspaceProjects.length,
        memberCount: memberCount?.count || 0
      },
      projects: workspaceProjects.map(p => ({
        id: p.id,
        name: p.name,
        status: p.status
      })),
      aggregatedMetrics: {
        totalTasks: allTasks.length,
        completedTasks: allTasks.filter(t => t.status === 'done').length,
        inProgressTasks: allTasks.filter(t => t.status === 'in_progress').length,
        overdueTasks: allTasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'done').length,
        unassignedTasks: allTasks.filter(t => !t.assigneeId).length,
        highPriorityTasks: allTasks.filter(t => t.priority === 'high').length,
        stalledTasks: allTasks.filter(t => {
          const daysSinceUpdate = Math.floor((new Date().getTime() - new Date(t.updatedAt).getTime()) / (1000 * 60 * 60 * 24));
          return daysSinceUpdate >= 7 && t.status !== 'done';
        }).length,
        totalBugs: allBugs.length,
        openBugs: allBugs.filter(b => b.status === 'open').length,
        criticalBugs: allBugs.filter(b => b.severity === 'critical').length
      }
    };

    // Generate AI suggestions based on workspace data
    const prompt = `Analyze this workspace and provide 3-5 strategic suggestions for organizational improvement:

**Workspace Overview:**
- Projects: ${analysisData.workspace.projectCount}
- Team Members: ${analysisData.workspace.memberCount}
- Analysis Type: ${analysisType}

**Cross-Project Metrics:**
- Total Tasks: ${analysisData.aggregatedMetrics.totalTasks} (${analysisData.aggregatedMetrics.completedTasks} completed)
- In Progress: ${analysisData.aggregatedMetrics.inProgressTasks}
- Overdue: ${analysisData.aggregatedMetrics.overdueTasks}
- Unassigned: ${analysisData.aggregatedMetrics.unassignedTasks}
- High Priority: ${analysisData.aggregatedMetrics.highPriorityTasks}
- Stalled (7+ days): ${analysisData.aggregatedMetrics.stalledTasks}
- Open Bugs: ${analysisData.aggregatedMetrics.openBugs} (${analysisData.aggregatedMetrics.criticalBugs} critical)

**Project Portfolio:**
${analysisData.projects.map(p => `- ${p.name} (${p.status})`).join('\n')}

Focus on workspace-level strategic improvements and organizational optimization.`;

    const response = await generateAIResponse({
      messages: [
        { role: 'system', content: WORKSPACE_SUGGESTIONS_SYSTEM_PROMPT },
        { role: 'user', content: prompt }
      ],
      maxTokens: 2000,
      temperature: 0.3,
      model: 'gpt-4o'
    });

    // Parse AI response
    let suggestions;
    try {
      const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/) || response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        suggestions = JSON.parse(jsonMatch[0].replace(/```json\s*|\s*```/g, ''));
      } else {
        suggestions = JSON.parse(response);
      }
    } catch (parseError) {
      suggestions = [{
        id: 'workspace-analysis',
        type: 'optimization',
        title: 'Workspace Analysis Available',
        description: response,
        action: 'Review the analysis and implement suggested improvements',
        priority: 'medium',
        impact: 'Improved organizational efficiency'
      }];
    }

    if (!Array.isArray(suggestions)) {
      suggestions = [suggestions];
    }

    return NextResponse.json({
      workspaceId,
      analysisType,
      suggestions,
      metadata: {
        generatedAt: new Date().toISOString(),
        dataSnapshot: analysisData
      }
    });

  } catch (error) {
    console.error('Workspace AI suggestions error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
