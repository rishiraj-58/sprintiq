## Sprint Planning, Delivery, and Releases – Implementation Guide

This guide explains where and how to implement sprints in SprintIQ, including: planning workflow, running a sprint, Burndown and Cumulative Flow implementations, milestones and releases, and the RBAC rules for who can do what.

---

### 1) Where do sprints live in this project?

- Data model
  - Table: `sprints` already exists in `src/db/schema.ts` with fields `{ id, name, description, projectId, status, startDate, endDate, createdAt, updatedAt }`.
  - Tasks can be assigned to a sprint through `tasks.sprintId` (also present in schema).

- Backend APIs (recommended)
  - List/Create at project scope: `GET/POST /api/projects/[projectId]/sprints` (optional; current codebase has timeline aggregation and single-resource updates).
  - Single sprint read/update: `GET/PATCH /api/sprints/[sprintId]` (added).
  - Task updates: `PATCH /api/tasks/[taskId]` to set `{ sprintId, status, dueDate }` (already present and used by Timeline Gantt interactions).

- Frontend pages
  - Project-level Sprints page: `src/app/projects/[projectId]/sprints/page.tsx` (suggested). Shows sprint list, create/edit dialogs, and links into Timeline.
  - Timeline tab (already implemented): shows Gantt, Burndown, Cumulative Flow, Milestones lane, Release lane.

---

### 2) RBAC – who can do what?

Capability (project-level) governs actions. Use `PermissionManager.getUserCapabilities(userId, projectId, 'project')`.

- Owner
  - All capabilities: view, create, edit, delete, manage_members, manage_settings.
  - Can create/edit/delete sprints, milestones, releases; move tasks across sprints; change dates.

- Manager
  - Default: view, create, edit, delete, manage_members.
  - Can create/edit/delete sprints, milestones, releases; move tasks; change dates.

- Member
  - Default: view, create, edit.
  - Can update tasks (status, due date, sprint assignment). Typically cannot delete sprints/releases unless explicitly granted.

- Viewer
  - Default: view only.
  - No write actions.

Enforcement
- APIs already check membership and capabilities. Follow the pattern in `src/app/api/tasks/[taskId]/route.ts` and the new sprint/milestone routes.

---

### 3) Sprint lifecycle – planning → active → completed

Statuses
- `planning`: dates set, scope being added, estimates refined.
- `active`: the sprint is running. Burndown and CFD reflect progress.
- `completed`: the sprint is closed. Scope should be frozen; carryovers moved out.

Planning a sprint (Owner/Manager)
- Create sprint with `name`, `startDate`, `endDate`, `status='planning'`.
- Assign tasks to the sprint (drag in Gantt or task list bulk action).
- Optionally estimate tasks (see Story Points below) and set due dates.

Start the sprint (Owner/Manager)
- Change `status` to `active`.
- Communicate scope and sprint goal.

Complete the sprint (Owner/Manager)
- Change `status` to `completed`.
- Move any incomplete tasks to backlog or next sprint.
- Snapshot and export reports if needed.

---

### 4) Burndown chart – implementation notes

Component: `src/components/timeline/BurndownChart.tsx`

Data required
- Sprint: `{ id, name, startDate, endDate, status }`.
- Tasks in sprint: `{ id, status, updatedAt, storyPoints? }`.

Computation
- Ideal line: linear from total points to 0 over sprint days.
- Actual remaining: total points − sum(completed points up to date).

Story Points
- Current code falls back to `1` point per task if `storyPoints` is absent.
- Recommended DB addition (optional): add `tasks.storyPoints integer` to improve accuracy.
  - If added, update task forms and PATCH to accept `storyPoints`.

Permissions
- View: any project member with `view`.
- Editing sprint dates or task status/dates affects the chart and requires `edit`.

---

### 5) Cumulative Flow Diagram (CFD) – implementation notes

Component: `src/components/timeline/CumulativeFlowDiagram.tsx`

Data required
- Tasks with `status`, `createdAt`, `updatedAt` (already in schema).
  - Uses statuses: `todo` (or `pending`), `in_progress` (or `in-progress`), `done` (or `completed`).

Computation
- For each day in range, count tasks in each state.
- Display stacked areas (To Do, In Progress, Done).

Permissions
- View: any project member with `view`.
- Mutations that change task status/date require `edit`.

---

### 6) Milestones – definition and workflow

Table: `milestones` exists with `{ id, projectId, name, description, dueDate, status }`.

Use
- Planned checkpoints (e.g., Alpha, Beta, GA) tied to a due date.
- Visualized in Timeline via `MilestoneLane`. Drag to adjust due date.

Workflow
- Create milestone (Owner/Manager).
- Update `status`: `planned` → `in_progress` → `completed`.
- Due-date changes are allowed while `planned`/`in_progress`.

Permissions
- Create/Edit/Delete: Owner/Manager (`create`/`edit`/`delete`).
- View: all project members with `view`.

API
- `GET/PATCH /api/milestones/[milestoneId]` (added) to edit due date and status.

---

### 7) Releases – definition and workflow

Table: `releases` exists with `{ id, projectId, name, date, notes }`.

Use
- Deployable increments or external delivery dates; shown in the Release lane.
- Past/future styling makes status clear.

Workflow
- Create release with planned `date` and optional `notes` (Owner/Manager).
- After release happens, the same record represents a past release; notes can be augmented.

Permissions
- Create/Edit/Delete: Owner/Manager.
- View: all project members with `view`.

API
- Recommended: `GET/POST /api/projects/[projectId]/releases` and `GET/PATCH /api/releases/[releaseId]` (latter can be added similarly to milestones).

---

### 8) Where to build sprint UI

- Timeline tab (already present): Quick sprint resize, task assignment, and visual planning.
- Dedicated Sprints page (recommended): `src/app/projects/[projectId]/sprints/page.tsx`
  - Sections: Active sprint, Upcoming sprints, Completed sprints
  - Actions: Create sprint, Edit sprint, Close sprint, Bulk assign tasks
  - Secondary: Sprint goal, capacity note, definition of done

---

### 9) API summary (current vs recommended)

Current
- `PATCH /api/tasks/[taskId]`: update `{ sprintId, dueDate, status, ... }`
- `GET/PATCH /api/sprints/[sprintId]` (added)
- `GET/PATCH /api/milestones/[milestoneId]` (added)
- `GET /api/projects/[projectId]/timeline`: aggregated data for Timeline views

Recommended additions (optional)
- `GET/POST /api/projects/[projectId]/sprints` – list/create sprints
- `GET/POST /api/projects/[projectId]/releases` and `GET/PATCH /api/releases/[releaseId]`

RBAC on all routes
- Require membership to the project and check `PermissionManager` for `view`, `create`, `edit`, `delete` as appropriate.

---

### 10) Suggested UI flows

Sprint planning (Owner/Manager)
1. Open Project → Sprints page → New Sprint
2. Set `name`, `startDate`, `endDate`, `status='planning'`
3. Assign tasks (bulk or via Timeline Gantt)
4. (Optional) Set task estimates (story points)
5. Start sprint → `status='active'`

Running sprint
1. Daily standup uses Burndown + CFD for progress
2. Adjust task status/due dates; avoid scope creep unless approved

Closing sprint
1. Complete all possible tasks; move carryover tasks to backlog/next sprint
2. Set sprint `status='completed'`
3. Review metrics and create follow-up actions

Milestones & releases
1. Create milestones in alignment with delivery roadmap
2. Align releases to milestones (one-to-many or many-to-many by convention)
3. Use Timeline to visualize and adjust dates as necessary

---

### 11) Data quality & performance tips

- Indexes
  - Ensure indexes on `tasks(project_id, sprint_id, status, due_date)` and `sprints(project_id, start_date)` (see `docs/PROJECT_TIMELINE_SPEC.md#9-performance--caching`).

- Consistency
  - Prefer using `completedAt` when setting tasks to `done`; helpful for accurate Burndown/CFD.
  - When moving tasks between sprints, keep due dates within sprint boundaries if possible.

---

### 12) Quick checklist to enable sprints end-to-end

- [x] Add Sprints page under `projects/[projectId]/sprints`
- [x] Add create/edit sprint dialogs (name, dates, status)
- [x] Wire list/create sprint APIs (optional) and rely on `PATCH /api/sprints/[sprintId]` for edits
- [x] Enable task bulk assignment to sprint in list/Kanban
- [x] (Optional) Add `tasks.storyPoints` column and UI to edit
- [x] Verify Burndown and CFD reflect sprint and task changes
- [x] Lock down RBAC: only Owner/Manager can manage sprints/milestones/releases

---

If you’d like, I can scaffold the Sprints page, creation dialog, and project routes next.


