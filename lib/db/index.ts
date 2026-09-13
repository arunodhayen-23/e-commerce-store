import { Pool } from 'pg'
import { drizzle } from 'drizzle-orm/node-postgres'
import * as schema from './schema'
const globalDb = globalThis as unknown as { storePool?: Pool }
export const pool = globalDb.storePool ?? new Pool({ connectionString: process.env.DATABASE_URL, max: 5 })
if (process.env.NODE_ENV !== 'production') globalDb.storePool = pool
export const db = drizzle(pool, { schema })
