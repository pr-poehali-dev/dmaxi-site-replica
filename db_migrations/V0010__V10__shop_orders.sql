CREATE TABLE IF NOT EXISTS t_p90995829_dmaxi_site_replica.shop_orders (
  id            SERIAL PRIMARY KEY,
  user_id       INTEGER NOT NULL,
  product_id    INTEGER NOT NULL,
  product_title VARCHAR(500) NOT NULL,
  product_price NUMERIC(12,2) NOT NULL,
  status        VARCHAR(30) NOT NULL DEFAULT 'pending',
  payment_type  VARCHAR(20) NOT NULL DEFAULT 'wallet',
  wallet_txn_id INTEGER,
  yookassa_id   VARCHAR(255),
  notes         TEXT,
  created_at    TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shop_orders_user ON t_p90995829_dmaxi_site_replica.shop_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_shop_orders_status ON t_p90995829_dmaxi_site_replica.shop_orders(status);