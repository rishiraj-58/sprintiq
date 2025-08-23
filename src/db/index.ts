import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

// Database connection - use DIRECT_URL to bypass connection pooling
const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL!

if (!connectionString) {
  throw new Error('Database connection string is not configured. Please check DIRECT_URL or DATABASE_URL environment variables.');
}

console.log('Database connection string:', connectionString ? connectionString.replace(/:[^:@]*@/, ':****@') : 'Not set');

// Create postgres connection with robust configuration
const client = postgres(connectionString, {
  max: 2, // Even more conservative connection limit
  idle_timeout: 30, // Shorter idle timeout
  connect_timeout: 30, // Longer connection timeout for Supabase
  connection: {
    application_name: 'sprintiq-app',
  },
  onnotice: () => {}, // Suppress notice messages
  onparameter: () => {}, // Suppress parameter messages
  transform: {
    // Handle undefined values
    undefined: null,
  },
  // Add SSL configuration if needed
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
})

// Test the connection on startup with retry logic
let connectionTested = false;
const testConnection = async (retries = 3) => {
  if (connectionTested) return;

  for (let i = 0; i < retries; i++) {
    try {
      await client`SELECT 1`;
      console.log('✅ Database connection established successfully');
      connectionTested = true;
      return;
    } catch (error) {
      console.error(`❌ Database connection failed (attempt ${i + 1}/${retries}):`, error);

      if (i === retries - 1) {
        // Don't throw here, let the app continue and handle errors at runtime
        console.error('⚠️  Database connection failed after all retries. App will continue with degraded functionality.');
      } else {
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
      }
    }
  }
};

// Test connection immediately
testConnection();

// Create drizzle instance with error handling
export const db = drizzle(client, { schema })

// Export schema for use in other files
export * from './schema' 