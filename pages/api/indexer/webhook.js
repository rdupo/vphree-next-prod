import crypto from 'crypto'
import { decodeLogs } from '../../../lib/indexer/decode'
import { upsertEvents } from '../../../lib/indexer/store'

// Alchemy signs the raw body, so Next must not parse it first.
export const config = { api: { bodyParser: false } }

async function readRawBody(req) {
  const chunks = []
  for await (const chunk of req) chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk)
  return Buffer.concat(chunks)
}

function isValidSignature(rawBody, signature) {
  const key = process.env.ALCHEMY_WEBHOOK_SIGNING_KEY
  if (!key || !signature) return false
  const expected = crypto.createHmac('sha256', key).update(rawBody).digest('hex')
  const a = Buffer.from(expected)
  const b = Buffer.from(signature)
  return a.length === b.length && crypto.timingSafeEqual(a, b)
}

/**
 * Receives Alchemy "Custom Webhook" (GraphQL) deliveries for new blocks and stores any
 * matching logs right away. The incremental sync later re-verifies these blocks.
 * Generate the GraphQL query to paste into Alchemy with `npm run webhook:query`.
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const rawBody = await readRawBody(req)
  if (!isValidSignature(rawBody, req.headers['x-alchemy-signature'])) {
    return res.status(401).json({ error: 'invalid signature' })
  }

  const block = JSON.parse(rawBody.toString('utf8'))?.event?.data?.block
  if (!block) return res.status(200).json({ events: 0 })

  const blockTime = block.timestamp ? new Date(Number(block.timestamp) * 1000) : null
  const logs = (block.logs || []).map((log) => ({
    address: log.account.address,
    topics: log.topics,
    data: log.data,
    blockNumber: Number(block.number),
    logIndex: Number(log.index),
    transactionHash: log.transaction.hash,
    blockTime,
  }))

  const rows = decodeLogs(logs)
  await upsertEvents(rows)
  return res.status(200).json({ block: Number(block.number), events: rows.length })
}
