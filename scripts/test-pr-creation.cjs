const postgres = require('postgres');

async function testPRCreation() {
  console.log('🔍 Testing PR Creation Process...\n');

  // Connect to database
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('❌ DATABASE_URL not found in environment variables');
    return;
  }

  console.log('📊 Database connection:', connectionString.replace(/\/\/[^@]*@/, '//***:***@'));

  const client = postgres(connectionString);

  try {
    // Check all pull requests in database
    console.log('\n📋 All Pull Requests in Database:');
    const allPRs = await client`
      SELECT
        id,
        task_id,
        github_pr_number,
        title,
        head_branch,
        base_branch,
        state,
        author_login,
        project_repository_id,
        github_created_at
      FROM github_pull_requests
      ORDER BY github_created_at DESC
    `;

    console.log(`Found ${allPRs.length} total PRs:`);
    allPRs.forEach((pr, index) => {
      console.log(`  ${index + 1}. PR #${pr.github_pr_number}: "${pr.title}"`);
      console.log(`     Head: ${pr.head_branch} → Base: ${pr.base_branch}`);
      console.log(`     State: ${pr.state}, Author: ${pr.author_login}`);
      console.log(`     Task ID: ${pr.task_id || 'NULL'}`);
      console.log(`     Project Repo ID: ${pr.project_repository_id}`);
      console.log(`     Created: ${pr.github_created_at}`);
      console.log('');
    });

    // Check all linked branches
    console.log('\n🌿 All Linked Branches:');
    const allBranches = await client`
      SELECT
        id,
        task_id,
        project_repository_id,
        branch_name,
        github_branch_ref,
        created_at
      FROM github_branches
      ORDER BY created_at DESC
    `;

    console.log(`Found ${allBranches.length} linked branches:`);
    allBranches.forEach((branch, index) => {
      console.log(`  ${index + 1}. Branch: ${branch.branch_name}`);
      console.log(`     Task ID: ${branch.task_id}`);
      console.log(`     GitHub Ref: ${branch.github_branch_ref}`);
      console.log(`     Created: ${branch.created_at}`);
      console.log('');
    });

    // Check all project repositories
    console.log('\n🏢 All Project Repositories:');
    const allRepos = await client`
      SELECT
        id,
        repository_name,
        repository_full_name,
        github_repo_id,
        project_id
      FROM project_repositories
    `;

    console.log(`Found ${allRepos.length} project repositories:`);
    allRepos.forEach((repo, index) => {
      console.log(`  ${index + 1}. ${repo.repository_full_name} (${repo.repository_name})`);
      console.log(`     GitHub Repo ID: ${repo.github_repo_id}`);
      console.log(`     Project Repo ID: ${repo.id}`);
      console.log('');
    });

    // Cross-reference analysis
    console.log('\n🔗 Cross-Reference Analysis:');

    if (allPRs.length > 0 && allBranches.length > 0) {
      allPRs.forEach(pr => {
        const matchingBranch = allBranches.find(b => b.branch_name === pr.head_branch);
        if (matchingBranch) {
          console.log(`✅ PR #${pr.github_pr_number} (${pr.head_branch}) matches branch linked to task ${matchingBranch.task_id}`);
          if (pr.task_id === matchingBranch.task_id) {
            console.log(`   ✅ Task IDs match: ${pr.task_id}`);
          } else {
            console.log(`   ❌ Task ID mismatch: PR has ${pr.task_id}, Branch has ${matchingBranch.task_id}`);
          }
        } else {
          console.log(`❌ PR #${pr.github_pr_number} (${pr.head_branch}) has no matching linked branch`);
        }
      });
    } else {
      console.log('No PRs or branches found to analyze');
    }

    console.log('\n✅ Analysis completed successfully!');

  } catch (error) {
    console.error('❌ Error during analysis:', error);
  } finally {
    await client.end();
  }
}

testPRCreation();
