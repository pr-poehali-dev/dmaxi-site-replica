-- Добавляем номер клубной карты и QR-код для каждого пользователя
ALTER TABLE t_p90995829_dmaxi_site_replica.users
  ADD COLUMN IF NOT EXISTS club_card_number VARCHAR(20) NULL,
  ADD COLUMN IF NOT EXISTS qr_token VARCHAR(64) NULL UNIQUE;

-- Создаём уникальный индекс на qr_token
CREATE UNIQUE INDEX IF NOT EXISTS users_qr_token_idx
  ON t_p90995829_dmaxi_site_replica.users (qr_token)
  WHERE qr_token IS NOT NULL;

-- Присваиваем номера карт и QR-токены всем существующим пользователям
UPDATE t_p90995829_dmaxi_site_replica.users
SET
  club_card_number = 'DD-' || LPAD(id::text, 6, '0'),
  qr_token = encode(sha256((id::text || phone || created_at::text)::bytea), 'hex')
WHERE club_card_number IS NULL OR qr_token IS NULL;
