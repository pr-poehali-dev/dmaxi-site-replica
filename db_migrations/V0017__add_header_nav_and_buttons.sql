INSERT INTO t_p90995829_dmaxi_site_replica.site_settings (section, key, value, label, type) VALUES

-- Навигация
('header', 'nav_home',      'Главная',    'Меню — Главная',      'text'),
('header', 'nav_services',  'Услуги',     'Меню — Услуги',       'text'),
('header', 'nav_prices',    'Стоимость',  'Меню — Стоимость',    'text'),
('header', 'nav_booking',   'Запись',     'Меню — Запись',       'text'),
('header', 'nav_shop',      'Магазин',    'Меню — Магазин',      'text'),
('header', 'nav_club',      'Клуб DD',    'Меню — Клуб DD',      'text'),
('header', 'nav_portfolio', 'Портфолио',  'Меню — Портфолио',    'text'),
('header', 'nav_contacts',  'Контакты',   'Меню — Контакты',     'text'),

-- Кнопки
('header', 'btn_book',          'Записаться',             'Кнопка "Записаться" (шапка)',          'text'),
('header', 'btn_book_mobile',   'Записаться на ремонт',   'Кнопка "Записаться" (мобильное меню)', 'text'),
('header', 'btn_login',         'Войти / Регистрация',    'Кнопка входа',                         'text'),
('header', 'btn_login_short',   'Войти',                  'Кнопка входа (сокращённая)',            'text'),
('header', 'btn_cabinet',       'Кабинет',                'Кнопка личного кабинета',              'text'),
('header', 'btn_admin',         'Админ',                  'Кнопка панели администратора',         'text')

ON CONFLICT (section, key) DO NOTHING;
