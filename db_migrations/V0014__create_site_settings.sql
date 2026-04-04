
CREATE TABLE IF NOT EXISTS t_p90995829_dmaxi_site_replica.site_settings (
    id          SERIAL PRIMARY KEY,
    section     VARCHAR(50)  NOT NULL,
    key         VARCHAR(100) NOT NULL,
    value       TEXT         NOT NULL DEFAULT '',
    label       VARCHAR(200) NOT NULL DEFAULT '',
    type        VARCHAR(20)  NOT NULL DEFAULT 'text',
    updated_at  TIMESTAMP    NOT NULL DEFAULT NOW(),
    UNIQUE (section, key)
);

INSERT INTO t_p90995829_dmaxi_site_replica.site_settings (section, key, value, label, type) VALUES
-- Общие / Шапка
('general', 'company_name',   'DD MAXI',                        'Название компании',           'text'),
('general', 'tagline',        'автосервис',                      'Подзаголовок компании',       'text'),
('general', 'slogan',         'DD MAXI — СЕТЬ АВТОСЕРВИСОВ',    'Слоган в шапке',              'text'),
('general', 'phone',          '+7 (3952) 00-00-00',             'Телефон',                     'text'),
('general', 'email',          'info@d-d-maxi.ru',               'Email',                       'text'),
('general', 'address',        'г. Иркутск, ул. Верхоленская, д. 2', 'Адрес',                  'text'),
('general', 'hours',          'Пн–Сб 9:00–21:00',              'Часы работы',                 'text'),
('general', 'hours_note',     'Воскресенье — выходной',          'Примечание к часам',          'text'),
('general', 'logo_url',       '',                                'Логотип (URL картинки)',       'image'),

-- Главная страница
('home', 'hero_title',        'DD MAXI',                         'Главный заголовок (Hero)',     'text'),
('home', 'hero_subtitle',     'Ремонт и обслуживание автомобилей любых марок', 'Подзаголовок Hero', 'text'),
('home', 'hero_description',  'Более 15 лет на рынке. Гарантия на все виды работ. Клубная карта скидок для постоянных клиентов.', 'Описание Hero', 'textarea'),
('home', 'hero_image',        'https://cdn.poehali.dev/projects/6ac06d75-10c8-4905-8743-acae4c622e9a/files/2b548611-c899-4a89-b26f-7fb55a5fe719.jpg', 'Фото Hero (URL)', 'image'),
('home', 'stat1_val',         '15+',                             'Статистика 1 — значение',     'text'),
('home', 'stat1_label',       'лет опыта',                       'Статистика 1 — подпись',      'text'),
('home', 'stat2_val',         '2 СТО',                           'Статистика 2 — значение',     'text'),
('home', 'stat2_label',       'в Иркутске',                      'Статистика 2 — подпись',      'text'),
('home', 'stat3_val',         '30 000+',                         'Статистика 3 — значение',     'text'),
('home', 'stat3_label',       'довольных клиентов',              'Статистика 3 — подпись',      'text'),
('home', 'stat4_val',         '500+',                            'Статистика 4 — значение',     'text'),
('home', 'stat4_label',       'марок авто',                      'Статистика 4 — подпись',      'text'),
('home', 'cta_title',         'Запишитесь прямо сейчас',         'CTA заголовок',               'text'),
('home', 'cta_subtitle',      'Оставьте заявку — мы перезвоним в течение 15 минут и согласуем удобное время', 'CTA описание', 'textarea'),
('home', 'club_title',        'Клуб DD MAXI',                    'Блок клуба — заголовок',      'text'),
('home', 'club_description',  'Оформите клубную карту и получайте скидки до 10% на все виды услуг. Накапливайте бонусы и обменивайте их на обслуживание автомобиля.', 'Блок клуба — описание', 'textarea'),
('home', 'club_image',        'https://cdn.poehali.dev/projects/6ac06d75-10c8-4905-8743-acae4c622e9a/files/ef0c3cfa-d990-49c5-a7c2-e939db2733c7.jpg', 'Фото клуба (URL)', 'image'),

-- О компании
('about', 'title',            'DD MAXI',                         'Заголовок страницы',          'text'),
('about', 'subtitle',         'Надёжный автосервис с 2009 года', 'Подзаголовок',                'text'),
('about', 'description',      'Мы работаем с 2009 года и за это время обслужили более 30 000 автомобилей. Наша команда — опытные мастера, прошедшие обучение у официальных дилеров.', 'Описание компании', 'textarea'),
('about', 'stat1_val',        '15+',                             'Стат 1 — значение',           'text'),
('about', 'stat1_label',      'лет на рынке',                    'Стат 1 — подпись',            'text'),
('about', 'stat2_val',        '2',                               'Стат 2 — значение',           'text'),
('about', 'stat2_label',      'станции в Иркутске',              'Стат 2 — подпись',            'text'),
('about', 'stat3_val',        '30 000+',                         'Стат 3 — значение',           'text'),
('about', 'stat3_label',      'обслуженных клиентов',            'Стат 3 — подпись',            'text'),
('about', 'stat4_val',        '98%',                             'Стат 4 — значение',           'text'),
('about', 'stat4_label',      'возвращаются снова',              'Стат 4 — подпись',            'text'),

-- Контакты
('contacts', 'title',         'Контакты',                        'Заголовок страницы',          'text'),
('contacts', 'subtitle',      'Звоните или приезжайте — будем рады помочь', 'Подзаголовок',   'textarea'),
('contacts', 'location1_name','СТО на ул. Верхоленская',        'Адрес 1 — название',          'text'),
('contacts', 'location1_addr','г. Иркутск, ул. Верхоленская, д. 2', 'Адрес 1 — улица',       'text'),
('contacts', 'location1_phone','+7 (3952) 00-00-00',            'Адрес 1 — телефон',           'text'),
('contacts', 'location1_hours','Пн–Сб 9:00–21:00',             'Адрес 1 — часы',              'text'),
('contacts', 'map_embed',     '',                                'Ссылка на карту (embed URL)', 'textarea'),

-- Подвал
('footer', 'description',     'Профессиональный ремонт и обслуживание автомобилей. Клубная система скидок для постоянных клиентов.', 'Описание в подвале', 'textarea'),
('footer', 'copyright',       '© 2024 DD MAXI. Все права защищены.',  'Копирайт',            'text'),
('footer', 'vk_url',          '#',                               'Ссылка ВКонтакте',            'text'),
('footer', 'tg_url',          '#',                               'Ссылка Telegram',             'text'),
('footer', 'yt_url',          '#',                               'Ссылка YouTube',              'text')
ON CONFLICT (section, key) DO NOTHING;
