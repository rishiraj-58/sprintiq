const postgres = require('postgres');

// Simulate a PR webhook payload
const mockPRPayload = {
  action: 'opened',
  pull_request: {
    number: 1,
    title: 'Test PR for adding repositories',
    body: 'This is a test pull request',
    state: 'open',
    draft: false,
    head: {
      ref: 'feature/integ-1-adding-repositories',
      sha: 'abc123'
    },
    base: {
      ref: 'main',
      sha: 'def456'
    },
    user: {
      login: 'testuser'
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    merged_at: null,
    html_url: 'https://github.com/test/repo/pull/1'
  },
  repository: {
    id: '123456789', // This needs to match a linked repo
    full_name: 'test/repo',
    name: 'repo'
  },
  sender: {
    login: 'testuser'
  }
};

async function triggerPRWebhook() {
  console.log('🔍 Simulating PR Webhook...\n');
  console.log('Mock PR payload:', JSON.stringify(mockPRPayload, null, 2));

  // Check database state
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('❌ DATABASE_URL not found');
    return;
  }

  console.log('📊 Database connection:', connectionString.replace(/\/\/[^@]*@/, '//***:***@'));

  const client = postgres(connectionString);

  try {
    // Check if the repository is linked
    console.log('\n🔍 Checking Repository Links:');
    const linkedRepos = await client`
      SELECT id, repository_name, repository_full_name, github_repo_id, project_id
      FROM project_repositories
      WHERE github_repo_id = ${mockPRPayload.repository.id}
    `;

    console.log(`Found ${linkedRepos.length} linked repositories for GitHub repo ${mockPRPayload.repository.id}:`);
    linkedRepos.forEach(repo => {
      console.log(`  - ID: ${repo.id}, Name: ${repo.repository_full_name}`);
    });

    // Check if the branch is linked
    console.log('\n🔍 Checking Branch Links:');
    const linkedBranches = await client`
      SELECT id, task_id, branch_name, project_repository_id
      FROM github_branches
      WHERE branch_name = ${mockPRPayload.pull_request.head.ref}
    `;

    console.log(`Found ${linkedBranches.length} linked branches for "${mockPRPayload.pull_request.head.ref}":`);
    linkedBranches.forEach(branch => {
      console.log(`  - Branch: ${branch.branch_name}, Task: ${branch.task_id}`);
    });

    if (linkedRepos.length > 0 && linkedBranches.length > 0) {
      console.log('\n✅ PR should be linked to task!');

      // Check if PR already exists
      const existingPR = await client`
        SELECT id, task_id, github_pr_number, title
        FROM github_pull_requests
        WHERE github_pr_number = ${mockPRPayload.pull_request.number}
        AND project_repository_id = ${linkedRepos[0].id}
      `;

      console.log(`\n📋 Existing PR check:`);
      console.log(`Found ${existingPR.length} existing PRs with number ${mockPRPayload.pull_request.number}`);

      if (existingPR.length === 0) {
        console.log('✅ Ready to create new PR record');
        console.log('PR Data:', {
          taskId: linkedBranches[0].task_id,
          projectRepositoryId: linkedRepos[0].id,
          githubPrNumber: mockPRPayload.pull_request.number,
          title: mockPRPayload.pull_request.title,
          headBranch: mockPRPayload.pull_request.head.ref,
          state: mockPRPayload.pull_request.state
        });
      } else {
        console.log('ℹ️  PR already exists, would update');
      }
    } else {
      console.log('\n❌ PR would not be linked to any task');
      if (linkedRepos.length === 0) {
        console.log('  - Repository is not linked to any project');
      }
      if (linkedBranches.length === 0) {
        console.log('  - Branch is not linked to any task');
      }
    }

    console.log('\n✅ Analysis completed!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.end();
  }
}

triggerPRWebhook();
