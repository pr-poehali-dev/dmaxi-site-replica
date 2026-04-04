
INSERT INTO t_p90995829_dmaxi_site_replica.site_settings (section, key, value, label, type)
VALUES
  ('footer', 'logo_url',      '', 'Логотип в подвале (URL картинки)', 'image'),
  ('footer', 'logo_tagline',  '', 'Подпись под логотипом в подвале',  'text')
ON CONFLICT (section, key) DO NOTHING;
