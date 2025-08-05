import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

// Database connection - use DIRECT_URL to bypass connection pooling
const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL!

console.log('Database connection string:', connectionString.replace(/:[^:@]*@/, ':****@'));

// Create postgres connection with robust configuration
const client = postgres(connectionString, {
  max: 3, // Very conservative connection limit
  idle_timeout: 60, // Keep connections alive longer
  connect_timeout: 20, // Longer connection timeout
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

// Test the connection on startup
let connectionTested = false;
const testConnection = async () => {
  if (connectionTested) return;
  
  try {
    await client`SELECT 1`;
    console.log('✅ Database connection established successfully');
    connectionTested = true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    // Don't throw here, let the app continue and handle errors at runtime
  }
};

// Test connection immediately
testConnection();

// Create drizzle instance
export const db = drizzle(client, { schema })

// Export schema for use in other files
export * from './schema' 