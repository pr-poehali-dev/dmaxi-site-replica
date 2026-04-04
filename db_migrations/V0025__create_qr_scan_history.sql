CREATE TABLE IF NOT EXISTS t_p90995829_dmaxi_site_replica.qr_scan_history (
  id          SERIAL PRIMARY KEY,
  admin_id    INTEGER NOT NULL REFERENCES t_p90995829_dmaxi_site_replica.users(id),
  user_id     INTEGER NOT NULL REFERENCES t_p90995829_dmaxi_site_replica.users(id),
  action      VARCHAR(50) NOT NULL DEFAULT 'scan',
  amount      NUMERIC(12,2) NULL,
  description TEXT NULL,
  result      TEXT NULL,
  created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);
