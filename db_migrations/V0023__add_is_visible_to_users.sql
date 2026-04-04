ALTER TABLE t_p90995829_dmaxi_site_replica.users
  ADD COLUMN IF NOT EXISTS is_visible BOOLEAN NOT NULL DEFAULT true;
