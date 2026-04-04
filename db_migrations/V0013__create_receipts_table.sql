
CREATE TABLE IF NOT EXISTS t_p90995829_dmaxi_site_replica.receipts (
    id          SERIAL PRIMARY KEY,
    user_id     INTEGER NOT NULL,
    type        VARCHAR(30) NOT NULL,  -- topup | spend | shop_wallet | shop_card | service_card | service_wallet | goods_card | goods_wallet | admin_adjust
    amount      NUMERIC(12,2) NOT NULL,
    description TEXT NOT NULL,
    ref_id      VARCHAR(255) NULL,     -- yookassa_id или txn_id
    receipt_number VARCHAR(50) NOT NULL UNIQUE,
    status      VARCHAR(20) NOT NULL DEFAULT 'paid',
    metadata    JSONB NULL,            -- доп. данные: товар, email, и т.д.
    created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_receipts_user_id ON t_p90995829_dmaxi_site_replica.receipts (user_id);
CREATE INDEX IF NOT EXISTS idx_receipts_created_at ON t_p90995829_dmaxi_site_replica.receipts (created_at DESC);
