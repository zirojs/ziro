import { neon, neonConfig } from '@neondatabase/serverless'
import dotenv from 'dotenv'
import { drizzle } from 'drizzle-orm/neon-http'
import { migrate } from 'drizzle-orm/neon-http/migrator'

dotenv.config()

neonConfig.fetchConnectionCache = true

export const connection = neon(process.env.VITE_DB_CONNECTION_STRING!)
export const db = drizzle(connection)
;(async () => {
  console.log('migrating...')
  await migrate(db, { migrationsFolder: './drizzle/migrations' })
  console.log('migration done')
})()
