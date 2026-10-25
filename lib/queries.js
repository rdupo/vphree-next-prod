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

/** All-time marketplace sales volume (wei, as a string) and sale count. */
export async function getVolume(collection) {
  const sql = getSql()
  const [row] = await sql`
    SELECT COALESCE(SUM(value_wei), 0)::text AS volume_wei, COUNT(*)::int AS sales
    FROM events
    WHERE collection = ${collection} AND event = 'PhunkBought' AND value_wei > 0
  `
  return row
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

/**
 * Marketplace activity by a wallet across all four markets: listings, delistings, bids, bid
 * withdrawals, sales, and purchases. Delists (and NLL listings) carry no seller address, so they're
 * attributed to whoever owned the token at the time (only the owner can list or delist).
 */
export async function getWalletHistory(address, collection, limit = 500) {
  const sql = getSql()
  return sql`
    SELECT * FROM (
      SELECT collection, event, token_id, from_address, to_address, value_wei, tx_hash, block_number, log_index, block_time
      FROM events
      WHERE (
          (event IN ('PhunkOffered', 'PhunkBidEntered', 'PhunkBidWithdrawn', 'PhunkBought') AND from_address = ${address})
          OR (event = 'PhunkBought' AND to_address = ${address})
        )

      UNION ALL

      SELECT d.collection, d.event, d.token_id, ${address} AS from_address, d.to_address, d.value_wei, d.tx_hash, d.block_number, d.log_index, d.block_time
      FROM events d
      CROSS JOIN LATERAL (
        SELECT t.to_address FROM events t
        WHERE t.collection = d.collection AND t.token_id = d.token_id AND t.event = 'Transfer'
          AND (t.block_number, t.log_index) < (d.block_number, d.log_index)
        ORDER BY t.block_number DESC, t.log_index DESC
        LIMIT 1
      ) owner
      WHERE (d.event = 'PhunkNoLongerForSale' OR (d.event = 'PhunkOffered' AND d.from_address IS NULL))
        AND owner.to_address = ${address}
        AND (d.collection, d.token_id) IN (
          SELECT collection, token_id FROM events WHERE event = 'Transfer' AND to_address = ${address}
        )
    ) activity
    WHERE ${collection}::text IS NULL OR collection = ${collection}
    ORDER BY block_number DESC, log_index DESC
    LIMIT ${limit}
  `
}

/**
 * Bids a wallet may still have open: tokens where its most recent bid is the latest bid, and it
 * hasn't withdrawn it or bought the token since. Callers confirm these on-chain (see lib/offers.js).
 */
export async function getCandidateOffers(address) {
  const sql = getSql()
  return sql`
    SELECT latest.*
    FROM (
      SELECT DISTINCT collection, token_id FROM events
      WHERE event = 'PhunkBidEntered' AND from_address = ${address}
    ) bid
    CROSS JOIN LATERAL (
      SELECT collection, token_id, event, from_address, value_wei, tx_hash, block_number, block_time
      FROM events e
      WHERE e.collection = bid.collection AND e.token_id = bid.token_id
        AND (
          e.event = 'PhunkBidEntered'
          OR (e.event = 'PhunkBidWithdrawn' AND e.from_address = ${address})
          OR (e.event = 'PhunkBought' AND e.to_address = ${address})
        )
      ORDER BY e.block_number DESC, e.log_index DESC
      LIMIT 1
    ) latest
    WHERE latest.event = 'PhunkBidEntered' AND latest.from_address = ${address}
    ORDER BY latest.block_number DESC
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
