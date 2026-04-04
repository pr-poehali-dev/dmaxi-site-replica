ALTER TABLE t_p90995829_dmaxi_site_replica.shop_orders
  ADD COLUMN IF NOT EXISTS confirmation_url TEXT,
  ADD COLUMN IF NOT EXISTS yookassa_payment_id VARCHAR(255);

CREATE INDEX IF NOT EXISTS idx_shop_orders_yk ON t_p90995829_dmaxi_site_replica.shop_orders(yookassa_payment_id)
  WHERE yookassa_payment_id IS NOT NULL;