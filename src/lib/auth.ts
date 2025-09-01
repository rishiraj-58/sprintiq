import { auth } from '@clerk/nextjs/server';
import { currentUser } from '@clerk/nextjs/server';
import { db } from '@/db';
import { profiles } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function getCurrentUserProfile() {
  const maxRetries = 2;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
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
      console.error(`Error in getCurrentUserProfile (attempt ${attempt + 1}/${maxRetries + 1}):`, error);

      // If it's a connection timeout and we haven't exhausted retries, wait and try again
      if (error instanceof Error && error.message && error.message.includes('CONNECT_TIMEOUT') && attempt < maxRetries) {
        console.log(`Retrying database operation in ${1000 * (attempt + 1)}ms...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
        continue;
      }

      // If we've exhausted retries or it's not a connection error, return null
      return null;
    }
  }

  return null;
}

export async function requireAuth() {
  try {
    const profile = await getCurrentUserProfile();

    if (!profile) {
      throw new Error('Not authenticated or profile not found');
    }

    return profile;
  } catch (error) {
    console.error('Authentication error:', error);

    // If it's a database connection error, provide a more helpful message
    if (error instanceof Error && error.message && error.message.includes('CONNECT_TIMEOUT')) {
      throw new Error('Database connection temporarily unavailable. Please try again in a moment.');
    }

    throw error;
  }
} 