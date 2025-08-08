import type { Config } from 'drizzle-kit';

export default {
  schema: './src/db/schema.ts',
  out: './drizzle',
  driver: 'pg',
  dbCredentials: {
    // Align with app connection order (DIRECT_URL preferred)
    connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL || '',
  },
} satisfies Config; 