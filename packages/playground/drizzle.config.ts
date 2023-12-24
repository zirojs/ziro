import 'dotenv/config'
import type { Config } from 'drizzle-kit'

export default {
  schema: './drizzle/index.ts',
  out: './drizzle/migrations',
  driver: 'pg',
  dbCredentials: {
    connectionString: import.meta.env.VITE_DB_CONNECTION_STRING,
  },
} satisfies Config
