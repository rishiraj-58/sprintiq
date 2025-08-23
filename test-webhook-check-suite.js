// Test webhook for check suite completion
const testPayload = {
  action: "completed",
  check_suite: {
    id: 12345,
    status: "completed",
    conclusion: "success",
    head_branch: "feature/integ-1-adding-repositories",
    head_sha: "abc123"
  },
  repository: {
    id: 1028201411,
    full_name: "rishiraj-58/sprintiq",
    name: "sprintiq"
  },
  sender: {
    login: "github"
  }
};

console.log('Test payload for check suite completion:');
console.log(JSON.stringify(testPayload, null, 2));
