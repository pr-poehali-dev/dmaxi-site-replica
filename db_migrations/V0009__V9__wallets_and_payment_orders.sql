-- Кошельки пользователей
CREATE TABLE IF NOT EXISTS t_p90995829_dmaxi_site_replica.wallets (
  id           SERIAL PRIMARY KEY,
  user_id      INTEGER NOT NULL UNIQUE,
  balance      NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  created_at   TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Все движения по кошельку
CREATE TABLE IF NOT EXISTS t_p90995829_dmaxi_site_replica.wallet_transactions (
  id            SERIAL PRIMARY KEY,
  wallet_id     INTEGER NOT NULL,
  user_id       INTEGER NOT NULL,
  type          VARCHAR(30) NOT NULL,
  amount        NUMERIC(12,2) NOT NULL,
  balance_after NUMERIC(12,2) NOT NULL,
  description   TEXT,
  ref_id        VARCHAR(255),
  created_at    TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Платёжные сессии ЮКасса
CREATE TABLE IF NOT EXISTS t_p90995829_dmaxi_site_replica.payment_orders (
  id                SERIAL PRIMARY KEY,
  user_id           INTEGER NOT NULL,
  yookassa_id       VARCHAR(255),
  amount            NUMERIC(12,2) NOT NULL,
  status            VARCHAR(30) NOT NULL DEFAULT 'pending',
  confirmation_url  TEXT,
  created_at        TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_payment_orders_yk ON t_p90995829_dmaxi_site_replica.payment_orders(yookassa_id) WHERE yookassa_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_wallets_user ON t_p90995829_dmaxi_site_replica.wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_txn_user ON t_p90995829_dmaxi_site_replica.wallet_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_orders_user ON t_p90995829_dmaxi_site_replica.payment_orders(user_id);

-- Кошельки для уже существующих пользователей
INSERT INTO t_p90995829_dmaxi_site_replica.wallets (user_id)
SELECT id FROM t_p90995829_dmaxi_site_replica.users
ON CONFLICT (user_id) DO NOTHING;