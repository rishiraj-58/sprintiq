import { db } from '@/db';

import { sql } from 'drizzle-orm';

async function columnExists(tableName: string, columnName: string): Promise<boolean> {
  const result = await db.execute(
    sql`select count(*)::int as count from information_schema.columns where table_name = ${tableName} and column_name = ${columnName}`
  );
  const row = Array.isArray(result) ? (result as any)[0] : (result as any).rows?.[0];
  const count = row?.count ?? row?.COUNT ?? 0;
  return Number(count) > 0;
}

async function tableExists(tableName: string): Promise<boolean> {
  const result = await db.execute(
    sql`select to_regclass(${sql.raw(`'public.${tableName}'`)}) as reg`
  );
  const row = Array.isArray(result) ? (result as any)[0] : (result as any).rows?.[0];
  return !!row?.reg;
}

export async function ensureInvitationsProjectIdColumn(): Promise<void> {
  const has = await columnExists('invitations', 'project_id');
  if (!has) {
    await db.execute(sql`alter table invitations add column if not exists project_id uuid references projects(id)`);
  }
}

export async function ensureProjectMembersTable(): Promise<void> {
  const hasTable = await tableExists('project_members');
  if (!hasTable) {
    await db.execute(sql`
      create table if not exists project_members (
        id uuid primary key default gen_random_uuid() not null,
        project_id uuid not null references projects(id),
        profile_id varchar(255) not null references profiles(id),
        role varchar(50) not null default 'member',
        capabilities text not null default '[]',
        created_at timestamp default now(),
        updated_at timestamp default now()
      )
    `);
  }
}

export async function ensureCoreSchema(): Promise<void> {
  await ensureInvitationsProjectIdColumn();
  await ensureProjectMembersTable();
  // Ensure new project settings columns exist
  const ensureProjectColumn = async (col: string, ddl: string) => {
    const hasCol = await columnExists('projects', col);
    if (!hasCol) {
      await db.execute(sql.raw(ddl));
    }
  };
  await ensureProjectColumn('visibility', "alter table projects add column if not exists visibility varchar(20) default 'private' not null");
  await ensureProjectColumn('category', 'alter table projects add column if not exists category varchar(100)');
  await ensureProjectColumn('currency', "alter table projects add column if not exists currency varchar(10) default 'USD' not null");
  await ensureProjectColumn('target_end_date', 'alter table projects add column if not exists target_end_date timestamp');
  await ensureProjectColumn('budget', 'alter table projects add column if not exists budget integer');
  // Ensure tasks.type column exists
  const hasTaskType = await (async () => {
    const result = await db.execute(sql`select count(*)::int as count from information_schema.columns where table_name = 'tasks' and column_name = 'type'`);
    const row = Array.isArray(result) ? (result as any)[0] : (result as any).rows?.[0];
    const count = row?.count ?? row?.COUNT ?? 0;
    return Number(count) > 0;
  })();
  if (!hasTaskType) {
    await db.execute(sql`alter table tasks add column if not exists type varchar(30) default 'feature' not null`);
  }

  // Ensure optional timeline tables
  await db.execute(sql`create table if not exists milestones (
    id uuid primary key default gen_random_uuid(),
    project_id uuid not null references projects(id),
    name varchar(120) not null,
    description text,
    due_date timestamp,
    status varchar(20) not null default 'planned',
    created_at timestamp default now(),
    updated_at timestamp default now()
  )`);

  await db.execute(sql`create table if not exists releases (
    id uuid primary key default gen_random_uuid(),
    project_id uuid not null references projects(id),
    name varchar(120) not null,
    date timestamp,
    notes text,
    created_at timestamp default now(),
    updated_at timestamp default now()
  )`);

  await db.execute(sql`create table if not exists blockers (
    id uuid primary key default gen_random_uuid(),
    project_id uuid not null references projects(id),
    task_id uuid references tasks(id),
    note text,
    started_at timestamp default now(),
    cleared_at timestamp
  )`);

  // Ensure tasks.story_points column exists
  const hasStoryPoints = await columnExists('tasks', 'story_points');
  if (!hasStoryPoints) {
    await db.execute(sql`alter table tasks add column if not exists story_points integer`);
  }

  await db.execute(sql`create table if not exists calendar_events (
    id uuid primary key default gen_random_uuid(),
    project_id uuid not null references projects(id),
    name varchar(200) not null,
    date timestamp not null,
    kind varchar(30) not null default 'meeting',
    notes text,
    created_at timestamp default now(),
    updated_at timestamp default now()
  )`);

  await db.execute(sql`create table if not exists project_phases (
    id uuid primary key default gen_random_uuid(),
    project_id uuid not null references projects(id),
    name varchar(120) not null,
    start_date timestamp,
    end_date timestamp,
    sort_order integer default 0
  )`);

  await db.execute(sql`create table if not exists capacity_windows (
    id uuid primary key default gen_random_uuid(),
    project_id uuid not null references projects(id),
    name varchar(120) not null,
    start_date timestamp,
    end_date timestamp,
    kind varchar(30) not null default 'holiday'
  )`);

  await db.execute(sql`create table if not exists policies (
    id uuid primary key default gen_random_uuid(),
    project_id uuid not null references projects(id),
    name varchar(120) not null,
    start_date timestamp,
    end_date timestamp,
    kind varchar(30) not null default 'code_freeze'
  )`);

  // Ensure task_statuses table exists for customizable workflows
  await db.execute(sql`create table if not exists task_statuses (
    id uuid primary key default gen_random_uuid(),
    name varchar(100) not null,
    color varchar(7) not null default '#3B82F6',
    "order" integer not null default 0,
    project_id uuid not null references projects(id) on delete cascade,
    created_at timestamp default now(),
    updated_at timestamp default now()
  )`);

  // Ensure audit_logs table exists
  await db.execute(sql`create table if not exists audit_logs (
    id uuid primary key default gen_random_uuid(),
    workspace_id uuid not null references workspaces(id),
    actor_id varchar(255) not null references profiles(id),
    action varchar(128) not null,
    severity varchar(16) not null default 'low',
    ip_address text,
    details jsonb,
    created_at timestamp default now()
  )`);
}


