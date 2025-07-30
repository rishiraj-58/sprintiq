import { getCurrentUserProfile } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';

export default async function DashboardPage() {
  // The middleware already protects this page, but we can still fetch the 
  // profile to display data. If it were ever null, the middleware would have
  // already redirected.
  const profile = await getCurrentUserProfile();

  // It's safe to assume profile is not null here because of the middleware.
  // If it is, something else is wrong, but a redirect is not the right fix here.
  if (!profile) {
    // You could redirect to an error page or just let it fail if this happens.
    // For now, let's prevent a hard crash.
    return <div>Could not load user profile.</div>;
  }

  return (
    <div>
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Your Profile</h2>
          <div className="space-y-4">
            <div>
              <span className="font-medium">Name: </span>
              {profile.firstName} {profile.lastName}
            </div>
            <div>
              <span className="font-medium">Email: </span>
              {profile.email}
            </div>
            <div>
              <span className="font-medium">Role: </span>
              {profile.systemRole}
            </div>
            <div>
              <span className="font-medium">Last Active: </span>
              {profile.lastActiveAt ? new Date(profile.lastActiveAt).toLocaleString() : 'Never'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}