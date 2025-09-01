import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { generateAIResponse } from '@/lib/ai/client';
import { db } from '@/db';
import { tasks, bugs, sprints, projects } from '@/db/schema';
import { eq, and, gte, lte, desc } from 'drizzle-orm';

const SUGGESTIONS_SYSTEM_PROMPT = `You are SprintIQ's AI Suggestion Engine. Analyze project data and provide actionable, contextual suggestions.

**Your Role:**
- Analyze project metrics, tasks, and team performance
- Provide specific, actionable recommendations
- Focus on productivity improvements and risk mitigation
- Use data-driven insights to support your suggestions

**Response Format:**
Return a JSON array of suggestion objects with:
- \`id\`: unique identifier
- \`type\`: "productivity" | "risk" | "optimization" | "team"
- \`title\`: short, clear title
- \`description\`: detailed explanation with specific data
- \`action\`: specific action to take
- \`priority\`: "low" | "medium" | "high"
- \`impact\`: expected benefit of taking the action

**Analysis Guidelines:**
1. Look for patterns in task completion rates
2. Identify bottlenecks in the workflow
3. Spot tasks that might be at risk
4. Suggest process improvements
5. Recommend team optimizations

Keep suggestions practical and immediately actionable.`;

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { projectId, analysisType = 'general' } = await request.json();

    if (!projectId) {
      return NextResponse.json({ error: 'projectId is required' }, { status: 400 });
    }

    // Gather project data for analysis
    const [project] = await db.select().from(projects).where(eq(projects.id, projectId));
    
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Get recent tasks data
    const recentTasks = await db
      .select()
      .from(tasks)
      .where(eq(tasks.projectId, projectId))
      .orderBy(desc(tasks.updatedAt))
      .limit(50);

    // Get recent bugs
    const recentBugs = await db
      .select()
      .from(bugs)
      .where(eq(bugs.projectId, projectId))
      .orderBy(desc(bugs.updatedAt))
      .limit(20);

    // Get active sprints
    const activeSprints = await db
      .select()
      .from(sprints)
      .where(
        and(
          eq(sprints.projectId, projectId),
          lte(sprints.startDate, new Date()),
          gte(sprints.endDate, new Date())
        )
      );

    // Prepare analysis data
    const analysisData = {
      project: {
        name: project.name,
        id: project.id,
        status: project.status
      },
      tasks: {
        total: recentTasks.length,
        completed: recentTasks.filter(t => t.status === 'done').length,
        inProgress: recentTasks.filter(t => t.status === 'in_progress').length,
        todo: recentTasks.filter(t => t.status === 'todo').length,
        overdue: recentTasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'done').length,
        unassigned: recentTasks.filter(t => !t.assigneeId).length,
        highPriority: recentTasks.filter(t => t.priority === 'high').length,
        withoutEstimates: recentTasks.filter(t => !t.storyPoints).length,
        stalled: recentTasks.filter(t => {
          if (!t.updatedAt) return false;
          const daysSinceUpdate = Math.floor((new Date().getTime() - new Date(t.updatedAt).getTime()) / (1000 * 60 * 60 * 24));
          return daysSinceUpdate >= 7 && t.status !== 'done';
        }).length
      },
      bugs: {
        total: recentBugs.length,
        open: recentBugs.filter(b => b.status === 'open').length,
        critical: recentBugs.filter(b => b.severity === 'critical').length,
        resolved: recentBugs.filter(b => b.status === 'resolved').length
      },
      sprints: {
        active: activeSprints.length,
        current: activeSprints[0] || null
      }
    };

    // Generate AI suggestions based on the data
    const prompt = `Analyze this project data and provide 3-5 actionable suggestions:

**Project:** ${project.name}
**Analysis Type:** ${analysisType}

**Current Status:**
- Tasks: ${analysisData.tasks.total} total (${analysisData.tasks.completed} completed, ${analysisData.tasks.inProgress} in progress)
- Overdue tasks: ${analysisData.tasks.overdue}
- Unassigned tasks: ${analysisData.tasks.unassigned}
- High priority tasks: ${analysisData.tasks.highPriority}
- Tasks without estimates: ${analysisData.tasks.withoutEstimates}
- Stalled tasks (7+ days no update): ${analysisData.tasks.stalled}
- Active bugs: ${analysisData.bugs.open} (${analysisData.bugs.critical} critical)
- Active sprints: ${analysisData.sprints.active}

Focus on the most impactful improvements for this project's current state.`;

    const response = await generateAIResponse({
      messages: [
        { role: 'system', content: SUGGESTIONS_SYSTEM_PROMPT },
        { role: 'user', content: prompt }
      ],
      maxTokens: 2000,
      temperature: 0.3,
      model: 'gpt-4o'
    });

    // Parse AI response
    let suggestions;
    try {
      // Look for JSON in the response
      const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/) || response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        suggestions = JSON.parse(jsonMatch[0].replace(/```json\s*|\s*```/g, ''));
      } else {
        // Fallback parsing
        suggestions = JSON.parse(response);
      }
    } catch (parseError) {
      // If parsing fails, create a default response
      suggestions = [{
        id: 'analysis',
        type: 'productivity',
        title: 'Project Analysis Available',
        description: response,
        action: 'Review the analysis and implement suggested improvements',
        priority: 'medium',
        impact: 'Improved project efficiency'
      }];
    }

    // Ensure suggestions is an array
    if (!Array.isArray(suggestions)) {
      suggestions = [suggestions];
    }

    return NextResponse.json({
      projectId,
      analysisType,
      suggestions,
      metadata: {
        generatedAt: new Date().toISOString(),
        dataSnapshot: analysisData
      }
    });

  } catch (error) {
    console.error('AI suggestions error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
