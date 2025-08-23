const { createClient } = require('@supabase/supabase-js');
const { drizzle } = require('drizzle-orm/postgres-js');
const postgres = require('postgres');
const { githubIntegrations, githubActivities, githubBranches, projectRepositories, tasks, projects } = require('../src/db/schema');
const { eq, and } = require('drizzle-orm');

async function debugBranchLinking() {
  console.log('🔍 Debugging Branch Linking Issue...\n');

  // Connect to database
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('❌ DATABASE_URL not found in environment variables');
    return;
  }

  console.log('📊 Database connection:', connectionString.replace(/\/\/[^@]*@/, '//***:***@'));

  const client = postgres(connectionString);
  const db = drizzle(client);

  try {
    // Check specific task
    const taskId = 'c8591ab3-30d2-4095-9ef5-2808d806c607';
    console.log(`\n🔍 Checking specific task: ${taskId}`);

    // Get task details
    const taskDetails = await db.select().from(tasks).where(eq(tasks.id, taskId));
    if (taskDetails.length > 0) {
      console.log('Task found:', {
        id: taskDetails[0].id,
        title: taskDetails[0].title,
        projectId: taskDetails[0].projectId,
        projectTaskId: taskDetails[0].projectTaskId
      });
    } else {
      console.log('❌ Task not found');
    }

    // Check activities for this task
    console.log('\n📋 GitHub Activities for this task:');
    const taskActivities = await db.select().from(githubActivities).where(eq(githubActivities.taskId, taskId));
    console.log(`Found ${taskActivities.length} activities for task ${taskId}:`);
    taskActivities.forEach(activity => {
      console.log(`  - ID: ${activity.id}`);
      console.log(`    Activity Type: ${activity.activityType}`);
      console.log(`    Title: ${activity.title}`);
      console.log(`    Task ID: ${activity.taskId}`);
      console.log(`    Project Repository ID: ${activity.projectRepositoryId}`);
      console.log(`    Actor: ${activity.actorLogin}`);
      console.log(`    Created: ${activity.githubCreatedAt}`);
      console.log('');
    });

    // Check branches for this task
    console.log('\n🌿 GitHub Branches for this task:');
    const taskBranches = await db.select().from(githubBranches).where(eq(githubBranches.taskId, taskId));
    console.log(`Found ${taskBranches.length} branches for task ${taskId}:`);
    taskBranches.forEach(branch => {
      console.log(`  - ID: ${branch.id}`);
      console.log(`    Task ID: ${branch.taskId}`);
      console.log(`    Project Repository ID: ${branch.projectRepositoryId}`);
      console.log(`    Branch Name: ${branch.branchName}`);
      console.log(`    GitHub Branch Ref: ${branch.githubBranchRef}`);
      console.log(`    Created: ${branch.createdAt}`);
      console.log('');
    });

    // Check all project repositories
    console.log('\n🏢 All Project Repositories:');
    const repositories = await db.select().from(projectRepositories);
    console.log(`Found ${repositories.length} repositories:`);
    repositories.forEach(repo => {
      console.log(`  - ID: ${repo.id}`);
      console.log(`    Name: ${repo.repositoryName}`);
      console.log(`    Full Name: ${repo.repositoryFullName}`);
      console.log(`    GitHub Repo ID: ${repo.githubRepoId}`);
    });

    // If we have branches, check if they're linked to existing repositories
    if (taskBranches.length > 0) {
      console.log('\n🔗 Checking if branches are linked to existing repositories:');
      for (const branch of taskBranches) {
        const repo = await db.select().from(projectRepositories).where(eq(projectRepositories.id, branch.projectRepositoryId));
        if (repo.length > 0) {
          console.log(`✅ Branch ${branch.branchName} is linked to repository ${repo[0].repositoryFullName}`);
        } else {
          console.log(`❌ Branch ${branch.branchName} has invalid repository ID: ${branch.projectRepositoryId}`);
        }
      }
    }

    console.log('\n✅ Debug completed successfully!');

  } catch (error) {
    console.error('❌ Error during debug:', error);
  } finally {
    await client.end();
  }
}

debugBranchLinking();
