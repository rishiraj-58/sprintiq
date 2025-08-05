import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

// Database connection - use DIRECT_URL to bypass connection pooling
const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL!

// Create postgres connection
const client = postgres(connectionString)

// Create drizzle instance
export const db = drizzle(client, { schema })

// Export schema for use in other files
export * from './schema' 