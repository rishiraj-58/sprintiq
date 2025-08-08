import { getCurrentUserProfile } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';

export default async function SprintPlannerPage() {
  const profile = await getCurrentUserProfile();
  if (!profile) redirect('/auth/sign-in');

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Sprint Planner</h2>
      <Suspense fallback={<div>Loading…</div>}>
        <div className="rounded border p-4 text-sm text-muted-foreground">
          Capacity planning and suggested scope will appear here.
        </div>
      </Suspense>
    </div>
  );
}


