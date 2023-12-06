import 'dotenv/config'
import type { Config } from 'drizzle-kit'

export default {
  schema: './drizzle/index.ts',
  out: './drizzle/migrations',
  driver: 'pg',
  dbCredentials: {
    connectionString: 'postgresql://Narixius:LCu7NGKE3TPB@ep-throbbing-scene-16447208.eu-central-1.aws.neon.tech/drizzle?sslmode=require',
  },
} satisfies Config
