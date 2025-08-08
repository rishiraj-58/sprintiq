## Phase 3 — Comprehensive Features, RBAC, UI Overhaul, and AI Enhancements

This document specifies the next set of features to bring SprintIQ to a production-quality experience. It focuses on:
- UI/UX overhaul and navigation redesign
- Robust, explicit role-based access control (RBAC)
- Workspace and project organization with a compact top navbar (inspired by Supabase/Clerk)
- Role-specific dashboards (Owner, Manager, Member, Viewer)
- Team management and permissions (including who can create workspaces)
- Significant AI enhancements across the product

All backend data work should use Drizzle ORM, not raw SQL [[memory:4622834]].

---

### Goals
- Deliver a clean, consistent, and responsive UI.
- Ship a clear, auditable RBAC model with explicit capability checks at API and UI levels.
- Make navigating between workspaces and projects fast and intuitive via a compact navbar.
- Provide dashboards tailored to user roles to reduce noise and improve decision-making.
- Strengthen invitations, membership, and role assignment flows.
- Level up the AI assistant for planning, summarization, task/bug creation, and insights.

---

## 1) UI/UX Overhaul

### 1.1 Design System and Theming
- Replace ad-hoc styles with a cohesive token-driven system (colors, spacing, radii, shadows).
- Ensure dark mode parity (tokens + Tailwind class strategy or CSS variables).
- Standardize typography scales (e.g., text-xs/sm/base/lg), headings, and line-heights.
- Introduce a utilities layer for empty states, error states, and loading skeletons.

### 1.2 Core Components (shadcn-based)
- Buttons: Primary/Secondary/Ghost/Destructive with loading state.
- Inputs/Textareas/Select/Combobox: Consistent states, helper text, error text.
- Table/List: Virtualized option for large data; sticky headers; sortable columns.
- Tabs/Sidebar/Nav: Matching spacing and states.
- Toasts and Inline Alerts: Success, warning, error patterns.
- Skeletons: For dashboard widgets, kanban lanes, and tables.

### 1.3 Page Layouts
- App shell with top navbar + optional left sidebar; keep content width comfortable (max-w-7xl).
- Responsive rules for md, lg, xl breakpoints; ensure mobile-first experience.
- Accessibility: Landmark roles, focus states, keyboard nav, color contrast.

Acceptance criteria
- Consistent spacing and typography across all routes under `src/app`.
- Lighthouse a11y score ≥ 90 on key pages: `/dashboard`, `/workspaces`, `/projects/[projectId]`, `/tasks/[taskId]`.
- Minimal CLS and fast initial render with skeletons.

---

## 2) Navigation Redesign (Workspace/Project Compact Navbar)

Inspired by Supabase/Clerk: a compact top navbar showing a workspace switcher and a horizontal row of small project pills.

### 2.1 Top Navbar
- Left: Product brand, workspace switcher(dropdown) with current workspace.
- Center: Horizontal scrollable list of active project pills within selected workspace.
  - Pills show short names or initials, with tooltip for full name.
  - Active project is highlighted; clicking navigates to `/projects/[projectId]`.
  - Overflow scroll on small screens.
- Right: Global search, notifications, user menu.

### 2.2 Behavior
- Workspace switcher updates the project pills list dynamically.
- Users without any workspace see an onboarding CTA to create or join one.
- Persist last-selected workspace and project in local storage.

Implementation notes
- Add a hook to fetch current user workspaces `workspaceService.fetchUserWorkspaces(userId)` and their projects (batched).
- New endpoint: `GET /api/workspaces/:workspaceId/projects/compact` returning `{ id, name, shortName }[]`.
- Update `src/components/layout/Navbar.tsx` to show the compact UI and pills.

Acceptance criteria
- Workspace switcher is fast (<200ms perceived) and reliable.
- Project pills render for the selected workspace and route correctly.

---

## 3) RBAC Model — Roles and Capabilities

Roles: `owner`, `manager`, `member`, `viewer`.
Capabilities: `view`, `create`, `edit`, `delete`, `manage_members`, `manage_settings`, and optionally `create_workspace` (system-wide).

### 3.1 Workspace-level RBAC
- Table `workspace_members` already stores `role` and `capabilities` (JSON string).
- Normalize role values to the four roles above; enforce via Zod and server-side guards.
- Default capability sets:
  - Owner: view, create, edit, delete, manage_members, manage_settings
  - Manager: view, create, edit, manage_members
  - Member: view, create, edit
  - Viewer: view
- Source of truth: central `PermissionManager` for capability resolution.

Required edits
- Expand `PermissionManager.getUserCapabilities(userId, contextId)` to accept `contextType: 'workspace' | 'project'` and resolve project-level permissions (project members fall back to workspace role if not explicitly set).
- Update `usePermissions(contextType, contextId)` and `/api/permissions` to support `contextType` query param.
- Add server-side guards to critical routes (projects, tasks, members, settings) using capabilities.

### 3.2 System-level Permissions
- Add `profiles.systemRole` usage for who can create workspaces.
  - New capability: `create_workspace` mapped to `systemRole in ['admin','manager']` or configurable at org-level.
- Enforce in `POST /api/workspaces`.

### 3.3 Project-level Membership (New)
- New table `project_members` with fields: `id`, `project_id`, `profile_id`, `role`, `capabilities`.
- Default: if not in `project_members`, fall back to workspace membership.
- Allows project-specific viewers/managers without changing workspace roles.

Acceptance criteria
- Unauthorized actions return 403 with a structured error `{ code: 'forbidden', requiredCapability }`.
- Client hides or disables UI affordances when capability is missing.

---

## 4) Role-Specific Dashboards

Dashboards differ by the current role within the selected workspace.

### 4.1 Owner Dashboard
- Workspace-level KPIs: projects count, active members, tasks throughput, bugs trend.
- Billing/usage (future): plan, limits, seats.
- Audit log and recent administrative changes.

### 4.2 Manager Dashboard
- Project health cards: on-time tasks, overdue items, sprint burndown.
- Team workload heatmap and rebalancing suggestions.
- Quick actions: assign tasks, start/close sprints.

### 4.3 Member Dashboard
- My tasks (by priority and due date), mentions, and assigned bugs.
- Focus mode for today/this week.

### 4.4 Viewer Dashboard
- Read-only overview of projects, tasks status, and key metrics.

Implementation notes
- Single `DashboardProvider` reads role capabilities and renders role-specific widgets.
- Widgets fetch server data with pagination and caching.

Acceptance criteria
- Users see only relevant widgets for their role. No actions when lacking capabilities.

---

## 5) Team Management and Invitations

### 5.1 Invitations Enhancements
- Improve emails (HTML template, expiration notices, resending flow).
- Validate invitation ownership and email domain policies (optional allowlist/denylist).
- Viewer role support in invitations.

### 5.2 Members Management UI
- Members list with role badges, quick actions to change roles, remove members.
- Filters/search by name, role, email.

### 5.3 Assignment and Ownership
- Enforce that task assignees must be members of the related workspace or project.
- Manager/Owner can assign; Members can self-assign if allowed.

Acceptance criteria
- Invitation flows cover validate → accept with robust errors and retries.
- Role changes reflected immediately in capability checks.

---

## 6) AI Enhancements

### 6.1 Assistant UX
- Convert chat to streaming responses with partial tokens.
- Save chat history per project; allow pinned prompts and quick actions.
- Inline actions: when AI proposes JSON for task/bug, show diff/confirm modal before creation.

### 6.2 Planning and Insights
- Sprint planning assistant: suggest sprint scope based on priorities and velocity.
- Project summaries: weekly digest of tasks done, blockers, and bug hotspots.
- Risk detection: highlight projects with rising bugs or overdue tasks.

### 6.3 RAG and Documents (Optional Phase)
- Store project docs embeddings (pgvector or external vector DB) for better answers.
- Context windows: tasks, bugs, comments, and docs snippets.

### 6.4 Tooling API
- Add server-side “AI tools” endpoints the assistant can call: create task, create bug, assign task, comment on task.
- Rate limiting and auth checks; clear audit logs for AI actions.

Acceptance criteria
- AI can draft and create tasks/bugs gated by capability checks.
- Streaming works with graceful cancellation and error handling.

---

## 7) API and Server Changes

Endpoints to add/update
- `GET /api/permissions?contextType&contextId` → add `contextType` support.
- `POST /api/workspaces` → enforce `create_workspace` permission.
- `GET /api/workspaces/:id/projects/compact` → for navbar pills.
- `GET /api/projects/:id/members` and `POST /api/projects/:id/members` → project-level roles.
- AI tools: `POST /api/ai/tools/create-task`, `POST /api/ai/tools/create-bug`, `POST /api/ai/tools/assign-task`, `POST /api/ai/tools/comment`.

Server utilities
- Expand `PermissionManager` to resolve per-context capabilities.
- Add a `requireCapability(capability, contextType, contextId)` helper for API routes.

---

## 8) Database (Drizzle) Migrations

### 8.1 New Tables
- `project_members` (id, project_id, profile_id, role, capabilities, created_at, updated_at).
- `audit_logs` (id, actor_id, action, entity_type, entity_id, metadata JSON, created_at).

### 8.2 Schema Adjustments
- Ensure `workspace_members.role` supports `viewer` and is validated.
- Optional enum tables for roles/capabilities for referential clarity.

### 8.3 Indices
- Indices on foreign keys and frequent filters: `project_id`, `profile_id`, `workspace_id`.

---

## 9) Client Updates

### 9.1 Hooks
- `usePermissions(contextType, contextId)` → support project contexts; cache results per context; optimistic UI toggles.
- `useWorkspace` and `useProject` stores: store selected workspace/project for navbar.

### 9.2 Guards
- HOCs or hooks to guard pages and components by capability.
- Disable/hide action buttons when insufficient permission.

### 9.3 Components to Build/Refactor
- `Navbar` compact pills + workspace switcher.
- `Dashboard` widgets per role.
- `Members` management table with role editor.
- `ProjectSwitcher` and `WorkspaceSwitcher` components.

---

## 10) Testing and QA

### 10.1 Unit and Integration Tests
- RBAC: capability resolution matrix for each role in workspace and project contexts.
- API: permissions enforced; expected 403s; positive paths.
- AI tools: creation endpoints permissioned and audited.

### 10.2 E2E Scenarios
- Invitation validate/accept; onboarding; joining workspace.
- Switching workspaces/projects; role-based dashboard widgets change.
- Member attempting restricted actions receives proper UI affordances and server 403.

---

## 11) Performance and Reliability
- Pagination and server-side filtering for lists (projects/tasks/members).
- Caching layer for permissions (short-lived) and compact project lists.
- Retry patterns where applicable (already present in invitations routes).

---

## 12) Rollout Plan
- Phase A: Navbar + workspace/project switch + RBAC backend utilities.
- Phase B: Role dashboards + members management UI.
- Phase C: AI streaming + tools; optional RAG.
- Phase D: Audit logs + performance tuning.

---

## 13) Acceptance Criteria Summary (Checklist)
- UI tokens and skeletons in place; a11y ≥ 90 on key pages.
- Compact navbar with workspace switcher and project pills.
- RBAC guards at API and UI; viewer role fully supported.
- Project-level membership and fallbacks from workspace.
- Role-specific dashboards visible and correct.
- Invitations support all roles including viewer; membership editor works.
- AI streaming chat, tool calls for task/bug creation with confirmations.
- Drizzle migrations added for new tables and indices; no linter errors.

---

## 14) Open Questions
- Do we need org-level admins beyond workspace owners?
- Should viewers be allowed to comment? Current default: no; consider a setting.
- Should `create_workspace` be granted to `manager` by default, or only to `admin` systemRole?


