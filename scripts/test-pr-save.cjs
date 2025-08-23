const postgres = require('postgres');

// Test data for PR #2 that was reopened
const testPRData = {
  taskId: 'c8591ab3-30d2-4095-9ef5-2808d806c607',
  projectRepositoryId: '04cf5c6b-3fb0-4ac3-a209-5ca931342eb3',
  githubPrNumber: 2,
  title: 'Create test',
  body: '',
  state: 'open',
  isDraft: false,
  headBranch: 'feature/integ-1-adding-repositories',
  baseBranch: 'main',
  authorLogin: 'rishiraj-58',
  githubCreatedAt: new Date('2025-08-23T06:50:00Z'),
  githubUpdatedAt: new Date('2025-08-23T07:00:00Z'),
  githubMergedAt: null,
  checksStatus: 'pending',
  reviewStatus: 'pending'
};

async function testPRSave() {
  console.log('🧪 Testing PR Save Logic...\n');
  console.log('Test PR Data:', JSON.stringify(testPRData, null, 2));

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('❌ DATABASE_URL not found');
    return;
  }

  const client = postgres(connectionString);

  try {
    console.log('\n🔍 Checking if PR already exists...');

    // Check if PR already exists
    const existingPR = await client`
      SELECT id, task_id, github_pr_number, title, state, head_branch
      FROM github_pull_requests
      WHERE project_repository_id = ${testPRData.projectRepositoryId}
      AND github_pr_number = ${testPRData.githubPrNumber}
    `;

    console.log(`Found ${existingPR.length} existing PRs`);

    if (existingPR.length > 0) {
      console.log('Existing PR:', existingPR[0]);
      console.log('✅ PR already exists - would update it');
    } else {
      console.log('✅ PR does not exist - would create it');

      // Test inserting the PR
      try {
        const [newPR] = await client`
          INSERT INTO github_pull_requests (
            task_id, project_repository_id, github_pr_number, title, body, state,
            is_draft, head_branch, base_branch, author_login, github_created_at,
            github_updated_at, github_merged_at, checks_status, review_status
          ) VALUES (
            ${testPRData.taskId}, ${testPRData.projectRepositoryId}, ${testPRData.githubPrNumber},
            ${testPRData.title}, ${testPRData.body}, ${testPRData.state}, ${testPRData.isDraft},
            ${testPRData.headBranch}, ${testPRData.baseBranch}, ${testPRData.authorLogin},
            ${testPRData.githubCreatedAt}, ${testPRData.githubUpdatedAt}, ${testPRData.githubMergedAt},
            ${testPRData.checksStatus}, ${testPRData.reviewStatus}
          )
          RETURNING id, github_pr_number, title
        `;

        console.log('✅ Successfully created PR:', newPR);

      } catch (insertError) {
        console.error('❌ Error creating PR:', insertError);
      }
    }

    // Check all PRs after operation
    console.log('\n📋 All PRs in database:');
    const allPRs = await client`
      SELECT id, task_id, github_pr_number, title, state, head_branch, project_repository_id
      FROM github_pull_requests
      ORDER BY github_pr_number
    `;

    console.log(`Total PRs: ${allPRs.length}`);
    allPRs.forEach(pr => {
      console.log(`  PR #${pr.github_pr_number}: "${pr.title}" - State: ${pr.state} - Task: ${pr.task_id}`);
    });

    console.log('\n✅ Test completed successfully!');

  } catch (error) {
    console.error('❌ Error during test:', error);
  } finally {
    await client.end();
  }
}

testPRSave();
