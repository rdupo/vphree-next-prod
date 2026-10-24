import { getSql } from './db'

/**
 * Active listings: tokens whose most recent listing-relevant event is a PhunkOffered.
 * A sale, delisting, or NFT transfer after the offer cancels it (same rules the pages used
 * when they read events straight from the chain).
 */
export async function getListings(collection) {
  const sql = getSql()
  return sql`
    SELECT latest.*
    FROM (
      SELECT DISTINCT token_id FROM events
      WHERE collection = ${collection} AND event = 'PhunkOffered'
    ) offered
    CROSS JOIN LATERAL (
      SELECT token_id, event, value_wei, from_address, to_address, block_number, tx_hash
      FROM events e
      WHERE e.collection = ${collection}
        AND e.token_id = offered.token_id
        AND e.event IN ('PhunkOffered', 'PhunkBought', 'PhunkNoLongerForSale', 'Transfer')
      ORDER BY e.block_number DESC, e.log_index DESC
      LIMIT 1
    ) latest
    WHERE latest.event = 'PhunkOffered'
    ORDER BY latest.value_wei ASC
  `
}

/** Most recent non-zero marketplace sales. */
export async function getSales(collection, limit) {
  const sql = getSql()
  return sql`
    SELECT token_id, value_wei, from_address, to_address, tx_hash, block_number, block_time
    FROM events
    WHERE collection = ${collection} AND event = 'PhunkBought' AND value_wei > 0
    ORDER BY block_number DESC, log_index DESC
    LIMIT ${limit}
  `
}

/** Full history for one token: transfers, listings, bids, and sales. */
export async function getTokenHistory(collection, tokenId) {
  const sql = getSql()
  return sql`
    SELECT event, from_address, to_address, value_wei, tx_hash, block_number, block_time
    FROM events
    WHERE collection = ${collection} AND token_id = ${tokenId}
      AND event IN ('Transfer', 'PhunkOffered', 'PhunkBidEntered', 'PhunkBought')
    ORDER BY block_number DESC, log_index DESC
  `
}

/** Marketplace activity by a wallet: its listings, bids, sales, and purchases. */
export async function getWalletHistory(address, collection, limit = 500) {
  const sql = getSql()
  return sql`
    SELECT collection, event, token_id, from_address, to_address, value_wei, tx_hash, block_number, block_time
    FROM events
    WHERE (${collection}::text IS NULL OR collection = ${collection})
      AND (
        (event IN ('PhunkOffered', 'PhunkBidEntered', 'PhunkBidWithdrawn', 'PhunkBought') AND from_address = ${address})
        OR (event = 'PhunkBought' AND to_address = ${address})
      )
    ORDER BY block_number DESC, log_index DESC
    LIMIT ${limit}
  `
}

/** Token IDs a wallet currently holds, based on the latest Transfer of each token. */
export async function getOwnedTokenIds(address, collection) {
  const sql = getSql()
  const rows = await sql`
    SELECT token_id FROM (
      SELECT DISTINCT ON (token_id) token_id, to_address
      FROM events
      WHERE collection = ${collection} AND event = 'Transfer'
        AND token_id IN (
          SELECT token_id FROM events
          WHERE collection = ${collection} AND event = 'Transfer' AND to_address = ${address}
        )
      ORDER BY token_id, block_number DESC, log_index DESC
    ) latest
    WHERE to_address = ${address}
    ORDER BY token_id
  `
  return rows.map((r) => r.token_id)
}
