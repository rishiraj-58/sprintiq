## Team & Invitations Specification (Workspace vs Project Access)

This document defines how members, roles, and invitations work at the workspace and project levels. It answers: “If I invite someone to a workspace, do they automatically get access to all projects?”

Short answer: Not necessarily. Workspace membership and project membership are separate. By default, access to a project requires explicit project membership. Admins can enable optional policies to broaden access.

---

## Entities
- Workspace: Organization-level scope; contains projects.
- Project: Execution-level scope; belongs to exactly one workspace.
- Workspace membership (`workspace_members`): `profileId`, `workspaceId`, `role`, `capabilities`.
- Project membership (`project_members`): `profileId`, `projectId`, `role`, `capabilities`.

---

## Roles & Capabilities

Roles (both levels): `owner`, `manager`, `member`, `viewer`.

Default capability sets (merged with any custom caps stored per membership):
- Owner: view, create, edit, delete, manage_members, manage_settings
- Manager: view, create, edit, delete, manage_members
- Member: view, create, edit
- Viewer: view

Notes
- Capability checks run at the target context. For a project action, project membership is evaluated first; if none, fall back to workspace membership only when policy allows.
- For sensitive actions (delete, manage_members), project-level membership takes precedence over workspace fallbacks.

---

## Access Model

Baseline (recommended)
- Workspace membership grants access to workspace-level pages (e.g., workspace settings if capability present) and visibility to the list of projects (names/metadata), but NOT to project contents.
- Project contents (tasks, bugs, docs) require project membership with at least `view` capability.

Optional workspace policy (broad visibility)
- When enabled by Owner: “Workspace members can view all projects.”
- Effect: Workspace members with `view` capability can read project contents unless the project is marked “restricted”. Restricted projects always require explicit project membership.

Restricted projects
- Flag on project that forces explicit project membership for any access beyond metadata (default: restricted = true).

---

## Invitations

Who can invite
- Requires `manage_members` capability at the target scope (workspace or project).

Workspace invitation (email or user ID)
- Recipient joins the workspace with the specified role.
- Project access is NOT automatically granted unless policy “auto-assign default projects” is enabled.
- Optional owner setting: auto-assign new workspace members as `viewer` on selected default projects.

Project invitation (email or user ID)
- If the recipient is already a member of the workspace: they are added to `project_members` with the specified role.
- If the recipient is not in the workspace: acceptance will (a) add them to the workspace as `member` (minimum) and (b) add them to the project with the specified role.
- Owners may tighten this to add as `viewer` at workspace level.

Invitation lifecycle
- Status: pending → accepted (or expired after 7 days by default).
- Email must match the authenticated user’s email at acceptance.
- One-time use tokens; resending generates new token and invalidates the old.

---

## Role Expectations (by scope)

Workspace
- Owner: full control, billing, policies, integrations.
- Manager: manage members, create/edit/delete at workspace scope, manage default-project assignments.
- Member: create/edit in allowed workspace areas; no membership management.
- Viewer: read-only workspace overview and project list.

Project
- Owner: full control for that project.
- Manager: manage members for that project, create/edit/delete items.
- Member: create/edit tasks/bugs/docs assigned to the project.
- Viewer: read-only for that project.

---

## Access Matrix (summary)

- Workspace invited (no project invites):
  - Sees workspace, project list; no project contents unless policy allows or project is not restricted.
- Project invited (not yet in workspace):
  - On acceptance: added to workspace (minimum role) AND to project with requested role.
- Manager at workspace (no project membership):
  - Can invite members to projects; cannot edit project contents unless given project membership OR policy allows.

---

## UI Flows

Workspace → Members
- Invite by email, set role; optional auto-assign default projects.
- Edit member role; remove member from workspace.
- View member’s project memberships; quick links to manage per-project access.

Project → Team
- Invite by email or user ID; set role (owner/manager/member/viewer).
- Change role via re-add or dedicated role editor.
- Remove member from project.

Project visibility
- Badge shows `Restricted` vs `Workspace-visible`.
- Owners/managers can toggle visibility (respecting policy constraints).

---

## API Overview (implemented or to implement)

Workspace
- POST `/api/invitations/send` { workspaceId, invites[{ email, role }] }
- GET `/api/workspaces/:id/members`
- POST `/api/workspaces` (creation; gated by system role)

Project
- GET `/api/projects/:id/members`
- POST `/api/projects/:id/members` { profileId? | email?, role }
- DELETE `/api/projects/:id/members?profileId=...`
- GET `/api/projects/:id/timeline`

Permissions
- GET `/api/permissions?contextType={workspace|project}&contextId=...`

---

## Policies & Settings (Owner)

- Project visibility default: `restricted` (recommended)
- Workspace policy: `workspaceMembersCanViewAllProjects` (default: false)
- Auto-assign new workspace members to default projects (role: viewer)
- Invitation expiration days (default: 7)
- Domain allowlist/denylist for invitations

---

## Edge Cases & Rules
- Email mismatch on acceptance → error with guidance to sign in with invited email.
- Accepting a project invite when already a workspace member → add project membership only.
- Removing a user from workspace removes all project memberships in that workspace.
- Project owner cannot be removed unless ownership is transferred.

---

## Migration & Enforcement Notes
- Enforce `restricted` per project and workspace policy checks in API routes that read project contents (tasks, bugs, docs).
- Prefer evaluating project membership first; only allow workspace fallback when policy enables broad visibility and project is not restricted.
- Keep `PermissionManager` as the single source of truth for capability resolution.


