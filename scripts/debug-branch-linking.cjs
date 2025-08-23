const postgres = require('postgres');

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

  try {
    // Check specific task
    const taskId = 'c8591ab3-30d2-4095-9ef5-2808d806c607';
    console.log(`\n🔍 Checking specific task: ${taskId}`);

    // Get task details
    const taskDetails = await client`
      SELECT id, title, project_id, project_task_id
      FROM tasks
      WHERE id = ${taskId}
    `;

    if (taskDetails.length > 0) {
      console.log('Task found:', {
        id: taskDetails[0].id,
        title: taskDetails[0].title,
        projectId: taskDetails[0].project_id,
        projectTaskId: taskDetails[0].project_task_id
      });
    } else {
      console.log('❌ Task not found');
    }

    // Check activities for this task
    console.log('\n📋 GitHub Activities for this task:');
    const taskActivities = await client`
      SELECT id, activity_type, title, task_id, project_repository_id, actor_login, github_created_at
      FROM github_activities
      WHERE task_id = ${taskId}
      ORDER BY github_created_at DESC
    `;

    console.log(`Found ${taskActivities.length} activities for task ${taskId}:`);
    taskActivities.forEach(activity => {
      console.log(`  - ID: ${activity.id}`);
      console.log(`    Activity Type: ${activity.activity_type}`);
      console.log(`    Title: ${activity.title}`);
      console.log(`    Task ID: ${activity.task_id}`);
      console.log(`    Project Repository ID: ${activity.project_repository_id}`);
      console.log(`    Actor: ${activity.actor_login}`);
      console.log(`    Created: ${activity.github_created_at}`);
      console.log('');
    });

    // Check branches for this task
    console.log('\n🌿 GitHub Branches for this task:');
    const taskBranches = await client`
      SELECT id, task_id, project_repository_id, branch_name, github_branch_ref, created_at
      FROM github_branches
      WHERE task_id = ${taskId}
    `;

    console.log(`Found ${taskBranches.length} branches for task ${taskId}:`);
    taskBranches.forEach(branch => {
      console.log(`  - ID: ${branch.id}`);
      console.log(`    Task ID: ${branch.task_id}`);
      console.log(`    Project Repository ID: ${branch.project_repository_id}`);
      console.log(`    Branch Name: ${branch.branch_name}`);
      console.log(`    GitHub Branch Ref: ${branch.github_branch_ref}`);
      console.log(`    Created: ${branch.created_at}`);
      console.log('');
    });

    // Check all project repositories
    console.log('\n🏢 All Project Repositories:');
    const repositories = await client`
      SELECT id, repository_name, repository_full_name, github_repo_id
      FROM project_repositories
    `;

    console.log(`Found ${repositories.length} repositories:`);
    repositories.forEach(repo => {
      console.log(`  - ID: ${repo.id}`);
      console.log(`    Name: ${repo.repository_name}`);
      console.log(`    Full Name: ${repo.repository_full_name}`);
      console.log(`    GitHub Repo ID: ${repo.github_repo_id}`);
    });

    // If we have branches, check if they're linked to existing repositories
    if (taskBranches.length > 0) {
      console.log('\n🔗 Checking if branches are linked to existing repositories:');
      for (const branch of taskBranches) {
        const repo = await client`
          SELECT repository_full_name
          FROM project_repositories
          WHERE id = ${branch.project_repository_id}
        `;
        if (repo.length > 0) {
          console.log(`✅ Branch ${branch.branch_name} is linked to repository ${repo[0].repository_full_name}`);
        } else {
          console.log(`❌ Branch ${branch.branch_name} has invalid repository ID: ${branch.project_repository_id}`);
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
