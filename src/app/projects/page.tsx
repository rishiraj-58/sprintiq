import { getCurrentUserProfile } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { ProjectsClientPage } from './ProjectsClientPage';

export default async function ProjectsPage() {
  const profile = await getCurrentUserProfile();

  if (!profile) {
    redirect('/auth/sign-in');
  }

  return <ProjectsClientPage />;
}