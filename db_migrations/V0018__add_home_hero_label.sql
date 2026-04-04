INSERT INTO t_p90995829_dmaxi_site_replica.site_settings (section, key, value, label, type)
VALUES ('home', 'hero_label', 'Профессиональный автосервис Иркутск', 'Слоган над заголовком Hero', 'text')
ON CONFLICT (section, key) DO NOTHING;
