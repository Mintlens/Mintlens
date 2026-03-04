import type { Config } from 'drizzle-kit'
import { config } from 'dotenv'

config({ path: '../../.env.local' })

export default {
  schema: './drizzle/schema.ts',
  out: './drizzle/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env['DATABASE_MIGRATION_URL'] ?? process.env['DATABASE_URL'] ?? '',
  },
  verbose: true,
  strict: true,
} satisfies Config
