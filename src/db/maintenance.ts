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
}


