## SprintIQ AI Features Roadmap and API Mapping

This document proposes a comprehensive set of AI-powered features for SprintIQ and maps them directly to the available backend APIs. It highlights what exists today, what can be added next with minimal backend work, and advanced ideas for later phases. The goal is to enable a robust, permission-aware AI assistant that can plan, act, and analyze across tasks, projects, sprints, workspaces, and notifications.

### Current AI capabilities (already implemented)

- **AI Chat endpoint**: `POST /api/ai/chat`
  - Uses `buildSystemMessage` and `generateAIResponse` with optional MCP-provided context.
  - Returns text only; no auto-creation of entities.
- **AI tools (available today)**
  - `POST /api/ai/tools/create-task` → Creates tasks with RBAC checks
  - `POST /api/ai/tools/create-bug` → Creates bugs with RBAC checks
  - `POST /api/ai/tools/assign-task` → Assigns tasks with membership enforcement
  - `POST /api/ai/tools/comment` → Adds task comments with @mention detection

### Relevant existing APIs the AI can leverage

- **Tasks**
  - `POST /api/tasks` → create
  - `GET /api/tasks?projectId=...` → list + filters (`status`, `priority`, `assigneeId`, `type`, `sprintId`)
  - `GET /api/tasks/[taskId]` → details with assignee and creator
  - `PATCH /api/tasks/[taskId]` → update fields (`title`, `description`, `status`, `priority`, `type`, `assigneeId`, `sprintId`, `dueDate`, `storyPoints`)
  - `DELETE /api/tasks/[taskId]` → delete
  - `GET /api/tasks/[taskId]/history` → structured per-field change history
  - `GET|POST /api/tasks/[taskId]/comments` → comments with author and @mentions
  - `GET|POST /api/tasks/[taskId]/subtasks` and `PATCH|DELETE /api/tasks/[taskId]/subtasks/[subtaskId]`
  - `GET|POST /api/tasks/[taskId]/links` → link tasks with `relation`
  - `GET|POST /api/tasks/[taskId]/attachments` + `POST /api/uploads/presigned-url` → file attachments via S3
  - `GET /api/tasks/search?projectId=...&q=...` → search tasks by title
- **Projects**
  - `GET|POST /api/projects` (workspace-scoped)
  - `GET|PATCH|DELETE /api/projects/[projectId]` → settings and lifecycle
  - `GET|POST /api/projects/[projectId]/sprints` → create + list
  - `GET|POST /api/projects/[projectId]/milestones` and `GET /api/projects/[projectId]/milestones/[milestoneId]`
  - `GET /api/projects/[projectId]/releases`
  - `GET /api/projects/[projectId]/reports` → project analytics (velocity, cycle time, CFD, workload)
  - `GET /api/projects/[projectId]/timeline` → sprints, tasks, milestones, releases, overlays
  - `GET|POST|DELETE /api/projects/[projectId]/members` → project roster management (RBAC)
  - `GET|POST|PATCH|DELETE /api/projects/[projectId]/task-statuses` → custom workflows
- **Sprints**
  - `GET|PATCH /api/sprints/[sprintId]`
- **Workspaces**
  - `GET /api/workspaces/[workspaceId]/projects` and `/compact`
  - `GET /api/workspaces/[workspaceId]/reports` → cross-project analytics and health
  - `GET|POST|DELETE /api/workspaces/[workspaceId]/members` → membership + role changes
  - `GET /api/workspaces/[workspaceId]/audit-logs` → filterable audit log stream
- **Users & notifications**
  - `GET /api/users/[userId]/tasks/assigned` → personal workload
  - `GET|PATCH /api/users/me/notification-preferences`
  - `GET /api/notifications` | `/unread` | `PATCH /api/notifications/[id]/mark-read` | `POST /api/notifications/mark-all-read`
- **Invitations & onboarding**
  - `POST /api/invitations/send`, `GET /api/invitations/validate`, `POST /api/invitations/accept`
  - `POST /api/onboarding` and `POST /api/onboarding/join`
- **Permissions**
  - `GET /api/permissions?contextId=...&contextType=project|workspace` → capability list via `PermissionManager`

---

## AI feature backlog (not implemented yet) mapped to APIs

Below is a comprehensive list of AI features the assistant can support using existing endpoints. Items marked Ready require only AI tool wrappers and prompt work; items marked Next require small backend additions; Advanced are aspirational/analytical.

### A. Task lifecycle and execution

- Ready: Update task fields (title, description, status, priority, type, due date, story points)
  - API: `PATCH /api/tasks/[taskId]`
  - AI tool: `ai/tools/update-task`
- Ready: Bulk status/priority changes across filtered tasks
  - API: `GET /api/tasks` filters + repeated `PATCH /api/tasks/[taskId]`
  - AI tool: `ai/tools/bulk-update-tasks`
- Ready: Create and manage subtasks
  - API: `POST /api/tasks/[taskId]/subtasks`, `PATCH|DELETE /subtasks/[subtaskId]`
  - AI tool: `ai/tools/create-subtask`, `ai/tools/update-subtask`, `ai/tools/delete-subtask`
- Ready: Link tasks (duplicates, blocks, relates-to)
  - API: `GET|POST /api/tasks/[taskId]/links`
  - AI tool: `ai/tools/link-tasks`
- Ready: Add attachments from a URL or local file
  - API: `POST /api/uploads/presigned-url` then `POST /api/tasks/[taskId]/attachments`
  - AI tool: `ai/tools/add-attachment`
- Ready: Suggest next action based on task history and status transitions
  - API: `GET /api/tasks/[taskId]/history`
  - AI: prompt-only analysis, optional tool to transition status
- Ready: Task triage and deduplication via similarity search
  - API: `GET /api/tasks/search` + heuristic comparison; optional embeddings later
  - AI tool: `ai/tools/merge-or-link-duplicates` (links similar tasks)

### B. Sprint planning and delivery

- Ready: Create sprints and populate with tasks by capacity
  - API: `POST /api/projects/[projectId]/sprints`, `PATCH /api/tasks/[taskId]` (set `sprintId`)
  - AI tool: `ai/tools/create-sprint`, `ai/tools/assign-to-sprint`
- Ready: Auto-assign story points using heuristics or LLM estimates
  - API: `PATCH /api/tasks/[taskId]` (`storyPoints`)
  - AI tool: `ai/tools/estimate-story-points`
- Ready: Sprint health summarization and burndown narration
  - API: `GET /api/projects/[projectId]/reports`
  - AI: prompt-only analysis; optional export to comments or reports

### C. Milestones, releases, timeline

- Ready: Create/update milestones; map tasks to milestones
  - API: `POST /api/projects/[projectId]/milestones`, `GET /api/projects/[projectId]/timeline`
  - AI tool: `ai/tools/create-milestone`, `ai/tools/plan-milestone`
- Ready: Release readiness/notes generation
  - API: `GET /api/projects/[projectId]/timeline`, `GET /api/tasks/[taskId]/history`
  - AI: generate release notes; optional `POST` comment on release task

### D. Reporting, insights, forecasting

- Ready: Project insights and recommendations
  - API: `GET /api/projects/[projectId]/reports`
  - AI: summarize velocity, cycle time, CFD, workload; propose actions
- Ready: Workspace-level triage and capacity suggestions
  - API: `GET /api/workspaces/[workspaceId]/reports`
  - AI: highlight at-risk projects, workload hotspots; propose rebalancing
- Advanced: Delivery date forecasting per project/sprint
  - API: reports endpoints + task histories; model-based projections
- Advanced: Risk detection and what-if impact analysis
  - API: reports + timeline; model-based narrative

### E. Team and access management

- Ready: Add/remove project members and update roles
  - API: `GET|POST|DELETE /api/projects/[projectId]/members`
  - AI tool: `ai/tools/update-project-member`
- Ready: Invite users by email (workspace or project)
  - API: `POST /api/invitations/send`, `POST /api/onboarding/join`
  - AI tool: `ai/tools/invite`
- Ready: Answer "what can I do here?" using capabilities
  - API: `GET /api/permissions?contextId=...`
  - AI: direct use in chat to condition responses

### F. Notifications and collaboration

- Ready: Summarize unread and recent notifications; mark as read
  - API: `GET /api/notifications/unread`, `GET /api/notifications`, `PATCH /api/notifications/[id]/mark-read`, `POST /api/notifications/mark-all-read`
  - AI tool: `ai/tools/mark-notifications`
- Ready: Configure personal notification preferences
  - API: `GET|PATCH /api/users/me/notification-preferences`
  - AI tool: `ai/tools/update-notification-preferences`
- Ready: @mention recommendation in comments (based on workspace members)
  - API: `POST /api/tasks/[taskId]/comments` (mentions already parsed server-side)
  - AI: suggest mention targets

### G. Search and discovery

- Ready: Guided search across tasks by project + filters
  - API: `GET /api/tasks?projectId=...` and `/search`
  - AI: resolve intent → filters → present results; optional bulk actions
- Ready: Cross-entity timeline answers
  - API: `GET /api/projects/[projectId]/timeline`
  - AI: natural-language explanations of upcoming work

### H. Files and knowledge

- Ready: Attachment ingestion for context
  - API: `POST /api/uploads/presigned-url` + `POST /api/tasks/[taskId]/attachments`
  - AI: pull key points from uploaded docs and add to task description/comment
- Advanced: Build a lightweight RAG over task descriptions/comments/attachments
  - API: tasks/comments/attachments; add vector index later

---

### I. Project and workspace configuration

- Ready: Create new projects within a workspace
  - API: `POST /api/projects` (workspace-scoped)
  - AI tool: `ai/tools/create-project`
- Ready: Manage task statuses (custom workflows)
  - API: `GET|POST|PATCH /api/projects/[projectId]/task-statuses`, `DELETE /api/projects/[projectId]/task-statuses/[statusId]`
  - AI tool: `ai/tools/list-task-statuses`, `ai/tools/create-task-status`, `ai/tools/update-task-status`, `ai/tools/delete-task-status`
- Ready: Update project settings (name, description, visibility, dates, budget)
  - API: `PATCH /api/projects/[projectId]`
  - AI tool: `ai/tools/update-project-settings`

---

## Proposed AI tool endpoints to add (MVP set)

Implement the following under `src/app/api/ai/tools/` with RBAC using `PermissionManager` and input validation. Each tool should return a compact, structured JSON payload for the chat client.

- `update-task` (PATCH)
  - Params: `taskId`, optionally `title`, `description`, `status`, `priority`, `type`, `assigneeId`, `sprintId`, `dueDate`, `storyPoints`
  - Calls: `PATCH /api/tasks/[taskId]`
- `bulk-update-tasks` (POST)
  - Params: `projectId`, `filters` (same as tasks GET), `changes` (same fields as `update-task`)
  - Calls: `GET /api/tasks` → iterate `PATCH`
- `create-subtask` (POST)
  - Params: `taskId`, `title`, optional `assigneeId`
  - Calls: `POST /api/tasks/[taskId]/subtasks`
- `update-subtask` (PATCH)
  - Params: `taskId`, `subtaskId`, `title?`, `isCompleted?`, `assigneeId?`
  - Calls: `PATCH /api/tasks/[taskId]/subtasks/[subtaskId]`
- `delete-subtask` (DELETE)
  - Params: `taskId`, `subtaskId`
  - Calls: `DELETE /api/tasks/[taskId]/subtasks/[subtaskId]`
- `link-tasks` (POST)
  - Params: `taskId`, `linkedTaskId`, `relation` (e.g., "duplicates", "blocks", "relates")
  - Calls: `POST /api/tasks/[taskId]/links`
- `add-attachment` (POST)
  - Params: `taskId`, `source` (`url`|`upload`), `fileName`, `fileType`, `bytes`, `url?`
  - Calls: `POST /api/uploads/presigned-url` → upload → `POST /api/tasks/[taskId]/attachments`
- `create-sprint` (POST)
  - Params: `projectId`, `name`, `goal?`, `startDate?`, `endDate?`
  - Calls: `POST /api/projects/[projectId]/sprints`
- `assign-to-sprint` (POST)
  - Params: `projectId`, `sprintId`, `taskIds[]`
  - Calls: `PATCH /api/tasks/[taskId]` per ID
- `create-milestone` (POST)
  - Params: `projectId`, `name`, `description?`, `date?`, `status?`
  - Calls: `POST /api/projects/[projectId]/milestones`
- `create-project` (POST)
  - Params: `workspaceId`, `name`, `description?`
  - Calls: `POST /api/projects`
- `list-task-statuses` (GET)
  - Params: `projectId`
  - Calls: `GET /api/projects/[projectId]/task-statuses`
- `create-task-status` (POST)
  - Params: `projectId`, `name`, `color?`, `order?`
  - Calls: `POST /api/projects/[projectId]/task-statuses`
- `update-task-status` (PATCH)
  - Params: `projectId`, `statusId`, `name?`, `color?`, `order?`
  - Calls: `PATCH /api/projects/[projectId]/task-statuses/[statusId]`
- `delete-task-status` (DELETE)
  - Params: `projectId`, `statusId`
  - Calls: `DELETE /api/projects/[projectId]/task-statuses/[statusId]`
- `update-project-settings` (PATCH)
  - Params: `projectId`, optionally `name`, `description`, `status`, `visibility`, `category`, `currency`, `startDate`, `targetEndDate`, `budget`
  - Calls: `PATCH /api/projects/[projectId]`
- `update-project-member` (POST/DELETE)
  - Params: `projectId`, `action` (`add|updateRole|remove`), `profileId?`, `email?`, `role`
  - Calls: `GET|POST|DELETE /api/projects/[projectId]/members`
- `invite` (POST)
  - Params: `workspaceId`, `invites[]` with `{email, role, projectId?}`
  - Calls: `POST /api/invitations/send`
- `update-notification-preferences` (PATCH)
  - Params: `mention?`, `taskAssigned?`, `statusUpdate?`, `commentAdded?`
  - Calls: `PATCH /api/users/me/notification-preferences`
- `mark-notifications` (POST/PATCH)
  - Params: `mode` (`allRead|readIds`), `ids?[]`
  - Calls: `POST /api/notifications/mark-all-read` or `PATCH /api/notifications/[id]/mark-read`

Reader tools (core; no side-effects) for better answers and safer orchestration:

- `get-project-reports` → `GET /api/projects/[projectId]/reports`
- `get-workspace-reports` → `GET /api/workspaces/[workspaceId]/reports`
- `get-project-timeline` → `GET /api/projects/[projectId]/timeline`
- `get-task-details` → `GET /api/tasks/[taskId]`
- `get-task-history` → `GET /api/tasks/[taskId]/history`
- `list-tasks` (with filters) → `GET /api/tasks?projectId=...&status=...&priority=...&assigneeId=...&type=...&sprintId=...`
- `list-project-members` → `GET /api/projects/[projectId]/members`
- `query-audit-log` → `GET /api/workspaces/[workspaceId]/audit-logs` (supports filters and date range)

---

## UX integration plan

- **Chat intents to tools**: Map natural language intents to tool calls using lightweight intent routing; show a confirmation with the derived parameters before executing mutating actions.
- **Result framing**: After a tool runs, return a short, structured summary with links/IDs for the UI to deep-link (e.g., a created task ID, sprint ID).
- **Inline recommendations**: For purely analytical answers (reports), provide optional one-click actions (e.g., "Create sprint with 20 points", "Reassign 2 tasks from Alice to Bob").
- **Context grounding**: Pass `projectId`/`workspaceId` and recent entities from the page state or MCP to reduce follow-up questions.

---

## RBAC, safety, and auditing

- Rely on existing RBAC checks enforced server-side via `requireAuth` + `PermissionManager` in every tool route. Block if missing `create|edit|delete|manage_members|manage_settings`.
- All AI tool routes should:
  - Validate inputs strictly; never default to unsafe values.
  - Return 403 on insufficient capabilities; never escalate privileges.
  - Log key actions to `auditLogs` where appropriate (e.g., member role changes, bulk actions).
  - Avoid returning sensitive data that the user cannot view via normal UI.

---

## Prioritized rollout

1) High-value, low-effort (wrap existing APIs)
- Update task, bulk update tasks
- Create/manage subtasks, link tasks
- Add attachment
- Create sprint; assign tasks to sprint
- Notification triage; update notification preferences

2) Planning and insights
- Milestone planner, project/workspace report summarizer
- Story point estimator (LLM-based heuristics)

3) Collaboration & access
- Member management and invitations
- Capability-aware help ("what can I do here?")

4) Advanced analytics
- Delivery forecasting, risk modeling, workspace rebalancing suggestions
- Release notes generator using histories and recent changes

---

## Tool input schemas (examples)

```json
// ai/tools/update-task
{
  "taskId": "uuid",
  "title": "?string",
  "description": "?string",
  "status": "?todo|in_progress|done|blocked|...",
  "priority": "?low|medium|high|urgent",
  "type": "?feature|bug|chore",
  "assigneeId": "?uuid|null",
  "sprintId": "?uuid|null",
  "dueDate": "?ISO8601|null",
  "storyPoints": "?number|null"
}
```

```json
// ai/tools/create-sprint
{
  "projectId": "uuid",
  "name": "string",
  "goal": "?string",
  "startDate": "?ISO8601",
  "endDate": "?ISO8601"
}
```

---

## Observability and quotas

- Add lightweight metrics for AI tool calls (count, latency, error rate) and optional per-user credit counters (future `usage` table) for AI spend control.
- Bubble backend error messages to the chat in a human-readable form with suggested fixes (e.g., missing permissions, missing `projectId`).

---

## Notes on MCP integration

- The chat handler already supports loading external MCP context via `MCP_SERVER_URL`. As we add tools, include structured outputs (IDs, titles, statuses) so MCP or the UI can ground follow-up answers without repeated DB queries.

---

## Acceptance criteria for MVP

- The AI can:
  - Create, update, and bulk-update tasks with confirmation.
  - Create subtasks, link tasks, add attachments end-to-end.
  - Create sprints and assign tasks; provide sprint planning summaries.
  - Summarize project/workspace reports and propose next steps.
  - Manage notifications and personal preferences.
  - Respect RBAC for all actions and fail gracefully with guidance.


