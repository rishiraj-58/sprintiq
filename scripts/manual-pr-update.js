// Simple script to manually update PR state
// This will help us test if the database connection is working

import dotenv from 'dotenv';
import path from 'path';

// Load environment variables FIRST
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

console.log('Environment variables loaded:');
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');
console.log('DIRECT_URL:', process.env.DIRECT_URL ? 'Set' : 'Not set');

// Now import after environment is loaded
import { db } from '../src/db/index.js';
import { githubPullRequests } from '../src/db/schema.js';
import { eq, and } from 'drizzle-orm';

async function updatePRState() {
  try {
    console.log('Attempting to update PR #2 state to closed...');

    // First, find the PR
    const existingPR = await db
      .select()
      .from(githubPullRequests)
      .where(eq(githubPullRequests.githubPrNumber, 2))
      .limit(1);

    if (existingPR.length === 0) {
      console.log('PR #2 not found in database');
      return;
    }

    console.log('Found PR #2:', {
      id: existingPR[0].id,
      currentState: existingPR[0].state,
      title: existingPR[0].title
    });

    // Update the PR state
    const result = await db
      .update(githubPullRequests)
      .set({
        state: 'closed',
        githubUpdatedAt: new Date()
      })
      .where(eq(githubPullRequests.id, existingPR[0].id))
      .returning();

    console.log('PR updated successfully:', {
      id: result[0].id,
      newState: result[0].state,
      updatedAt: result[0].githubUpdatedAt
    });

  } catch (error) {
    console.error('Error updating PR state:', error);
  }
}

updatePRState();
