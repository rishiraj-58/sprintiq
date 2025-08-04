import { auth } from '@clerk/nextjs/server';
import { currentUser } from '@clerk/nextjs/server';
import { db } from '@/db';
import { profiles } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function getCurrentUserProfile() {
  try {
    const { userId } = auth();
    const user = await currentUser();

    if (!userId || !user) {
      return null;
    }

    // Try to find existing profile
    let [profile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.id, userId));

    // If no profile exists, create one
    if (!profile) {
      const primaryEmail = user.emailAddresses[0]?.emailAddress;
      
      [profile] = await db
        .insert(profiles)
        .values({
          id: userId,
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          email: primaryEmail,
          avatarUrl: user.imageUrl,
          systemRole: 'member',
          lastActiveAt: new Date(),
          onboardingCompleted: false,
        })
        .returning();

      console.log('Created new profile for user:', userId);
    } else {
      // If onboarding is complete, only update the last active time
      if (profile.onboardingCompleted) {
        await db
          .update(profiles)
          .set({ lastActiveAt: new Date() })
          .where(eq(profiles.id, userId));
      } else {
      // Update existing profile if user data has changed
      const primaryEmail = user.emailAddresses[0]?.emailAddress;
      if (
        profile.firstName !== user.firstName ||
        profile.lastName !== user.lastName ||
        profile.email !== primaryEmail ||
        profile.avatarUrl !== user.imageUrl
      ) {
        [profile] = await db
          .update(profiles)
          .set({
            firstName: user.firstName || profile.firstName,
            lastName: user.lastName || profile.lastName,
            email: primaryEmail || profile.email,
            avatarUrl: user.imageUrl || profile.avatarUrl,
            updatedAt: new Date(),
          })
          .where(eq(profiles.id, userId))
          .returning();
        }
      }
    }

    return profile;
  } catch (error) {
    console.error('Error in getCurrentUserProfile:', error);
    return null;
  }
}

export async function requireAuth() {
  const profile = await getCurrentUserProfile();
  
  if (!profile) {
    throw new Error('Not authenticated or profile not found');
  }
  
  return profile;
} 