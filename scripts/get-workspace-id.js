#!/usr/bin/env node

console.log('🔍 Getting Your Workspace ID');
console.log('==============================');
console.log('');
console.log('1. Open your SprintIQ application in the browser');
console.log('2. Navigate to any project or the dashboard');
console.log('3. Look at the URL in your browser address bar');
console.log('');
console.log('Examples:');
console.log('   - Dashboard: https://your-app.com/dashboard/workspace/abc123def456');
console.log('   - Project:   https://your-app.com/projects/xyz789/');
console.log('');
console.log('4. The workspace ID is the long string after "/workspace/"');
console.log('   - In the examples above, it would be: abc123def456');
console.log('');
console.log('5. Copy this workspace ID and use it in the API calls below');
console.log('');
console.log('6. Test your GitHub integration:');
console.log('   curl -X GET "http://localhost:3000/api/github/status?workspace_id=YOUR_WORKSPACE_ID"');
console.log('');
console.log('7. Test repository fetching:');
console.log('   curl -X GET "http://localhost:3000/api/github/repositories?workspace_id=YOUR_WORKSPACE_ID"');
console.log('');
console.log('8. Once you see your repositories, go to Project Settings → Integrations tab');
console.log('   - You should now see the "Available Repositories" section');
console.log('   - Click the "+" button to link repositories to your project');
console.log('');
