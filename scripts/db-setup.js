// Create tables and indexes. Usage: npm run db:setup
import { run } from './env'
import { readFileSync } from 'fs'
import path from 'path'
import { getSql } from '../lib/db'

run(async () => {
  const sql = getSql()
  const statements = readFileSync(path.join(process.cwd(), 'db', 'schema.sql'), 'utf8')
    .split('\n')
    .map((line) => line.replace(/--.*$/, '')) // strip comments (they can contain ';')
    .join('\n')
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean)

  for (const statement of statements) {
    await sql.query(statement)
  }
  console.log(`Schema applied (${statements.length} statements).`)
})
