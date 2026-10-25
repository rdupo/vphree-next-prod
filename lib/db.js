import { neon } from '@neondatabase/serverless'

let sql

// Lazily create the client so importing this file never throws at build time.
export function getSql() {
  if (!sql) {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL is not set. Add it to .env.local (see .env.example).')
    }
    sql = neon(process.env.DATABASE_URL)
  }
  return sql
}
