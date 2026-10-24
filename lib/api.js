import { waitUntil } from '@vercel/functions'
import { ethers } from 'ethers'
import { isCollection } from './indexer/collections'
import { syncIncremental } from './indexer/sync'

// How old the last sync can be before a read triggers a background catch-up.
// The Alchemy webhook normally keeps data fresh within seconds; this is the safety net.
const SYNC_STALE_SECONDS = Number(process.env.SYNC_STALE_SECONDS || 60)

/** Kick off a catch-up sync after the response is sent, if one is due. Never blocks reads. */
export function syncInBackground() {
  waitUntil(
    syncIncremental({ staleSeconds: SYNC_STALE_SECONDS }).catch((err) =>
      console.error('background sync failed', err)
    )
  )
}

/** Short CDN cache so bursts of visitors share one function call. */
export function setCache(res, seconds = 5) {
  res.setHeader('Cache-Control', `public, s-maxage=${seconds}, stale-while-revalidate=60`)
}

export function getCollectionParam(req, res) {
  const { collection } = req.query
  if (!isCollection(collection)) {
    res.status(404).json({ error: `Unknown collection "${collection}"` })
    return null
  }
  return collection
}

export function getAddressParam(req, res) {
  const { address } = req.query
  if (!ethers.isAddress(address || '')) {
    res.status(400).json({ error: 'Invalid address' })
    return null
  }
  return address.toLowerCase()
}

export function formatEth(wei) {
  return wei === null || wei === undefined ? null : ethers.formatEther(wei.toString())
}

/** Wrap a GET handler with method check, background sync, and error handling. */
export function readHandler(fn) {
  return async (req, res) => {
    if (req.method !== 'GET') return res.status(405).end()
    try {
      syncInBackground()
      await fn(req, res)
    } catch (err) {
      console.error(err)
      res.status(500).json({ error: 'Internal error' })
    }
  }
}
