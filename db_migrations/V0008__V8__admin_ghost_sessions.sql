CREATE TABLE IF NOT EXISTS t_p90995829_dmaxi_site_replica.admin_ghost_sessions (
  id SERIAL PRIMARY KEY,
  admin_id INTEGER NOT NULL,
  target_user_id INTEGER NOT NULL,
  ghost_token VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL
);