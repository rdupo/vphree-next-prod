-- vPhree indexer schema. Safe to re-run: `npm run db:setup`

-- One row per decoded contract log we care about (NFT transfers + marketplace events).
CREATE TABLE IF NOT EXISTS events (
  tx_hash       TEXT        NOT NULL,
  log_index     INTEGER     NOT NULL,
  block_number  BIGINT      NOT NULL,
  block_time    TIMESTAMPTZ,
  collection    TEXT        NOT NULL, -- 'philip-intern-project' | 'cryptophunks' | 'wrapped-v1-phunks' | 'v3-phunks'
  contract      TEXT        NOT NULL, -- lowercase address
  event         TEXT        NOT NULL, -- 'Transfer' | 'PhunkOffered' | 'PhunkBought' | ...
  token_id      INTEGER     NOT NULL,
  from_address  TEXT,                 -- lowercase; Transfer.from / market fromAddress
  to_address    TEXT,                 -- lowercase; Transfer.to / market toAddress
  value_wei     NUMERIC(78, 0),       -- minValue for listings, value for bids/sales
  PRIMARY KEY (tx_hash, log_index)
);

CREATE INDEX IF NOT EXISTS events_token_idx ON events (collection, token_id, block_number DESC, log_index DESC);
CREATE INDEX IF NOT EXISTS events_event_idx ON events (collection, event, block_number DESC, log_index DESC);
CREATE INDEX IF NOT EXISTS events_block_idx ON events (block_number);
CREATE INDEX IF NOT EXISTS events_from_idx  ON events (from_address);
CREATE INDEX IF NOT EXISTS events_to_idx    ON events (to_address);

-- Single-row sync cursor + lease so only one sync runs at a time.
CREATE TABLE IF NOT EXISTS sync_state (
  id           TEXT        PRIMARY KEY,
  last_block   BIGINT      NOT NULL,  -- highest block that is fully synced and confirmed
  synced_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  locked_until TIMESTAMPTZ
);

-- Reverse ENS lookups, cached so we don't hit the RPC for every page view.
CREATE TABLE IF NOT EXISTS ens_cache (
  address    TEXT        PRIMARY KEY,
  name       TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
