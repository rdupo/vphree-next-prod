import { getSql } from '../db'

const SYNC_ID = 'main'
const INSERT_CHUNK = 1000

// Build one multi-row upsert using unnest() so a whole batch is a single round trip.
function upsertQuery(sql, rows) {
  const col = (key) => rows.map((r) => r[key])
  return sql`
    INSERT INTO events (tx_hash, log_index, block_number, block_time, collection, contract,
                        event, token_id, from_address, to_address, value_wei)
    SELECT * FROM unnest(
      ${col('tx_hash')}::text[], ${col('log_index')}::int[], ${col('block_number')}::bigint[],
      ${col('block_time')}::timestamptz[], ${col('collection')}::text[], ${col('contract')}::text[],
      ${col('event')}::text[], ${col('token_id')}::int[], ${col('from_address')}::text[],
      ${col('to_address')}::text[], ${col('value_wei')}::numeric[]
    )
    ON CONFLICT (tx_hash, log_index) DO UPDATE SET
      block_number = EXCLUDED.block_number,
      block_time = COALESCE(EXCLUDED.block_time, events.block_time)
  `
}

function chunk(rows) {
  const out = []
  for (let i = 0; i < rows.length; i += INSERT_CHUNK) out.push(rows.slice(i, i + INSERT_CHUNK))
  return out
}

export async function upsertEvents(rows) {
  if (rows.length === 0) return
  const sql = getSql()
  for (const part of chunk(rows)) await upsertQuery(sql, part)
}

/**
 * Atomically replace everything we have in [fromBlock, toBlock] with `rows`. Used by the
 * incremental sync so that tip events from a chain reorg (or a webhook) get cleaned up.
 */
export async function replaceRange(fromBlock, toBlock, rows) {
  const sql = getSql()
  await sql.transaction([
    sql`DELETE FROM events WHERE block_number BETWEEN ${fromBlock} AND ${toBlock}`,
    ...chunk(rows).map((part) => upsertQuery(sql, part)),
  ])
}

export async function getSyncState() {
  const sql = getSql()
  const [row] = await sql`SELECT last_block, synced_at, locked_until FROM sync_state WHERE id = ${SYNC_ID}`
  return row ? { ...row, last_block: Number(row.last_block) } : null
}

export async function setLastBlock(lastBlock) {
  const sql = getSql()
  await sql`
    INSERT INTO sync_state (id, last_block, synced_at) VALUES (${SYNC_ID}, ${lastBlock}, now())
    ON CONFLICT (id) DO UPDATE SET last_block = EXCLUDED.last_block, synced_at = now()
  `
}

/**
 * Take the sync lease if nobody holds it and the last sync is older than `staleSeconds`.
 * Returns the current last_block, or null if we shouldn't sync right now.
 */
export async function acquireLease({ staleSeconds = 0, leaseSeconds = 120 } = {}) {
  const sql = getSql()
  const [row] = await sql`
    UPDATE sync_state
    SET locked_until = now() + make_interval(secs => ${leaseSeconds})
    WHERE id = ${SYNC_ID}
      AND (locked_until IS NULL OR locked_until < now())
      AND synced_at <= now() - make_interval(secs => ${staleSeconds})
    RETURNING last_block
  `
  return row ? Number(row.last_block) : null
}

export async function releaseLease(lastBlock) {
  const sql = getSql()
  if (lastBlock === undefined) {
    await sql`UPDATE sync_state SET locked_until = NULL WHERE id = ${SYNC_ID}`
  } else {
    await sql`
      UPDATE sync_state SET locked_until = NULL, last_block = ${lastBlock}, synced_at = now()
      WHERE id = ${SYNC_ID}
    `
  }
}
