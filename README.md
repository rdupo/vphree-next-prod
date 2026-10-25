# vphree-next

Next.js 16 (Pages Router, Turbopack) · React 19 · ethers v6. Requires Node 20.9+ (22 LTS recommended).

- `npm run dev` / `npm run build` / `npm start`
- `npm run lint` runs ESLint directly (`next build` no longer lints)

## How marketplace data works

The site no longer scans the blockchain from the browser. A small indexer stores just the
events we care about (NFT transfers + marketplace listings/bids/sales for the four collections)
in Postgres, and pages read them through `/api/*` routes.

```
Alchemy webhook (new blocks, ~seconds) ─┐
Catch-up sync (on page views / daily cron) ─┼─> lib/indexer -> Postgres `events` table -> /api/* -> pages
One-time backfill (Etherscan) ─┘
```

- `lib/indexer/collections.js` – which contracts and events are indexed
- `lib/indexer/sync.js` – incremental sync and backfill
- `lib/queries.js` – SQL behind each API route
- `pages/api/collections/[collection]/{listings,sales}` and `.../tokens/[id]/history`
- `pages/api/wallets/[address]/{history,nfts}`
- `hooks/use*.js` – React hooks the pages use to call the API

Collection slugs: `philip-intern-project`, `cryptophunks`, `wrapped-v1-phunks`, `v3-phunks`.

## Indexer setup

1. **Database** – In Vercel: Project → Storage → Create → Neon (free). Copy `DATABASE_URL`.
2. **Etherscan key** – free at https://etherscan.io/apis (used for the backfill).
3. **Env vars** – copy `.env.example` to `.env.local` and fill in `DATABASE_URL`,
   `ALCHEMY_API_KEY`, `ETHERSCAN_API_KEY`, `CRON_SECRET`. Add the same vars in Vercel.
4. **Create tables** – `npm run db:setup`
5. **Backfill history** – `npm run backfill` (re-runnable; `npm run backfill -- --from <block>` to resume)
6. **Run locally** – `npm run dev`. Page views trigger a catch-up sync at most once a minute.
   `npm run sync` runs one manually.
7. **Webhook (after deploying)** – Alchemy dashboard → Webhooks → Custom Webhook, Ethereum
   Mainnet, URL `https://<your-domain>/api/indexer/webhook`. Paste the query printed by
   `npm run webhook:query`. Put the webhook's signing key in `ALCHEMY_WEBHOOK_SIGNING_KEY` on Vercel.

Adding a contract or event: update `lib/indexer/collections.js`, then re-run the backfill
with `--from` set to the contract's deploy block, and re-create the webhook query.
