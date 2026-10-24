import { syncIncremental } from '../../../lib/indexer/sync'

/**
 * Catch the database up to the chain head. Called by the Vercel cron (see vercel.json),
 * which sends `Authorization: Bearer $CRON_SECRET`. You can also hit it manually.
 */
export default async function handler(req, res) {
  const secret = process.env.CRON_SECRET
  if (!secret || req.headers.authorization !== `Bearer ${secret}`) {
    return res.status(401).json({ error: 'unauthorized' })
  }

  try {
    const result = await syncIncremental()
    return res.status(200).json(result)
  } catch (err) {
    console.error('sync failed', err)
    return res.status(500).json({ error: err.message })
  }
}
