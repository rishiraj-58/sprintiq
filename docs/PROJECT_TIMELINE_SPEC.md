## Project Timeline – Concept, Scope, and Implementation Guide

This document defines what a Project Timeline is in SprintIQ, why it matters, the data it represents, recommended visualizations, interactions, and how to implement it end‑to‑end (DB → API → UI) with RBAC and performance considerations.

---

### 1) What is a Project Timeline?

The Project Timeline is the time‑ordered view of a project’s plan and execution. It answers: what is happening, when, and how items relate. It aggregates key time‑based entities and renders them in visual formats to support planning, tracking, forecasting, and communication.

---

### 2) Core Timeline Entities (what to include)

- Milestones: Named checkpoints with due dates (e.g., Alpha, Beta, GA).
- Sprints: Timeboxed periods (start/end) grouping work items.
- Tasks: Units of work with status, type (feature/bug/chore/improvement), assignee, due date.
- Epics/Initiatives: Optional higher‑level groupings spanning multiple sprints.
- Releases: Deployable increments with cut dates and notes.
- Dependencies: Directed links between items (A must finish before B).
- Blockers/Flags: Highlighted impediments with start/clear dates.
- Calendared Events: Key meetings, external deadlines, compliance dates.

Optional project‑wide overlays:
- Project phases (Discovery → Build → Stabilization → Launch)
- Capacity windows (holidays, team leave, blackout periods)
- Policies (code freeze windows)

---

### 3) Recommended Visualizations

- Gantt view: Bars for sprints, epics, and tasks with start/end/due. Show dependencies as arrows.
- Calendar view (month/week): All dated items on a calendar grid.
- Burndown chart (per sprint): Remaining work vs. time; forecast ideal vs. actual.
- Burnup chart (project level): Scope vs. completed over time.
- Cumulative Flow Diagram (project level): Work in states (todo/in_progress/done) over time.
- Milestone lane: Horizontal swimlane with milestone markers and status.
- Release lane: Markers with tags and notes for release dates.

---

### 4) Key Interactions

- Date editing: Drag ends of bars to change start/end; drag markers to change due dates.
- Item move: Reassign a task to another sprint via drag‑and‑drop.
- Dependency management: Create/remove by clicking source → target; visualize conflicts.
- Zoom & pan: Adjust time scale (days/weeks/months); horizontal scrolling.
- Filtering: By assignee, status, type, sprint, epic, date range.
- Grouping: By sprint, assignee, epic, type.
- Context menus: Quick actions (change status, assign, re‑estimate, add blocker).

All mutations must follow RBAC checks (project‑level first; no workspace fallback for project edits).

---

### 5) Data Model (minimum viable)

Existing tables (abbrev):
- `projects { id, name, workspace_id, status, start_date, due_date }`
- `sprints { id, project_id, name, status, start_date, end_date }`
- `tasks { id, project_id, title, type, status, priority, assignee_id, sprint_id, due_date }`

Recommended additions:
- `milestones { id, project_id, name, due_date, description, status }`
- `dependencies { id, project_id, from_task_id, to_task_id, type }` (e.g., blocks, relates‑to)
- `releases { id, project_id, name, date, notes }`
- `blockers { id, project_id, task_id?, started_at, cleared_at, note }`

Note: Only create tables as needed. Start with sprints + tasks + optional milestones.

---

### 6) API Shape

- GET `/api/projects/:projectId/timeline`
  - Returns a normalized payload for the timeline view:
  - `{ sprints[], tasks[], milestones[], releases[], dependencies[], now }`
  - Supports filters: `?from=ISO&to=ISO&type=feature|bug|...&assigneeId=...&status=...`
  - Enforces: user must be a member of the project (or workspace if reading metadata only). For contents, require project membership.

- PATCH routes for targeted edits (optional incremental rollout):
  - `/api/sprints/:id` { startDate, endDate, status }
  - `/api/tasks/:id` { sprintId, dueDate, status, assigneeId, type }
  - `/api/milestones/:id` { dueDate, status }
  - `/api/dependencies` (POST/DELETE)

RBAC: Use `PermissionManager` with `contextType='project'` to gate create/edit/delete.

---

### 7) Frontend Architecture

- Data fetch: project Timeline component calls `/api/projects/:projectId/timeline` with filters from UI.
- State shape in client: `{ range, filters, groups, itemsById, lanes }` for efficient rendering.
- Virtualization: Only render visible time range to keep interaction smooth.
- Drag‑and‑drop: Update dates/sprint assignment optimistically; reconcile on API success.
- Accessibility: Keyboard resize/move; descriptive labels for markers; high contrast for blockers.

---

### 8) Analytics & Insights (derived from timeline)

- Forecast slippage: Compare planned vs. actual by sprint/milestone.
- Throughput trend: Completed tasks per time unit; trendline.
- WIP and bottlenecks: CFD concentration; highlight queues.
- Risk detection: Overlapping critical tasks, overdue items, dense dependencies.
- Capacity fit: Sprint scope vs. capacity; recommend scope reduction.

---

### 9) Performance & Caching

- Server: Memoize timeline aggregates per project + filter key (short TTL).
- Client: Cache last payload; revalidate on focus; incremental updates for small mutations.
- DB: Add indexes on `tasks(project_id, sprint_id, due_date, status, type)` and `sprints(project_id, start_date)`.

---

### 10) Notifications & Activity

- Notify on milestone changes, overdue tasks, blocked tasks.
- Activity stream: Append events for date changes, dependency updates, sprint moves.

---

### 11) RBAC Summary

- View: project membership with `view` capability.
- Edit dates/assignments/dependencies: `edit` capability.
- Manage sprints/milestones/releases: `manage_settings` or `edit` per policy.
- Delete: `delete` capability.

---

### 12) Milestone Rollout Plan

1. MVP: timeline API returns sprints + tasks; Timeline UI shows Gantt + burndown.
2. Add milestones and release markers.
3. Add dependencies + drag interactions.
4. Add calendar view and advanced filters.
5. Add analytics overlays (risk, forecast).

---

### 13) Testing Checklist

- Filters: type/status/assignee/date range behave and combine correctly.
- RBAC: viewers can’t mutate; managers can; owners can delete.
- Drag changes persist and reflect on refresh.
- Large projects (5k+ tasks) keep 60fps when panning/zooming (virtualization on).
- Timezone consistency across server and client.


