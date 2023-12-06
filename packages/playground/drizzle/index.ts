import { neon, neonConfig } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import { pgTable, serial, varchar } from 'drizzle-orm/pg-core'

neonConfig.fetchConnectionCache = true

export const connection = neon(import.meta.env.VITE_DB_CONNECTION_STRING)

export const db = drizzle(connection)

export const posts = pgTable('posts', {
  id: serial('id').primaryKey(),
  title: varchar('title'),
  content: varchar('content'),
})
