CREATE TABLE t_p90995829_dmaxi_site_replica.service_packages (
  id          SERIAL PRIMARY KEY,
  title       TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  items       TEXT NOT NULL DEFAULT '',   -- перечень услуг через \n
  price       INTEGER NOT NULL DEFAULT 0, -- в рублях
  duration    TEXT NOT NULL DEFAULT '',   -- например "2–3 ч"
  category    TEXT NOT NULL DEFAULT '',   -- Двигатель, Ходовая и т.д.
  is_active   BOOLEAN NOT NULL DEFAULT true,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO t_p90995829_dmaxi_site_replica.service_packages
  (title, description, items, price, duration, category, sort_order)
VALUES
  ('ТО Стандарт',     'Базовое техническое обслуживание по регламенту',
   'Замена моторного масла\nЗамена масляного фильтра\nПроверка тормозной системы\nДиагностика ходовой',
   3500, '2–3 ч', 'ТО', 1),

  ('ТО Расширенное',  'Полное ТО с заменой всех фильтров и жидкостей',
   'Замена моторного масла\nЗамена масляного фильтра\nЗамена воздушного фильтра\nЗамена салонного фильтра\nЗамена тормозной жидкости\nПроверка и регулировка тормозов\nДиагностика подвески',
   6000, '3–4 ч', 'ТО', 2),

  ('Шиномонтаж × 4', 'Полный комплект: снятие, монтаж, балансировка 4 колёс',
   'Снятие 4 колёс\nШиномонтаж R13–R18\nБалансировка 4 колёс\nУстановка колёс',
   1800, '1 ч', 'Шины', 3),

  ('Диагностика FULL','Полная компьютерная диагностика всех систем автомобиля',
   'Диагностика двигателя\nДиагностика трансмиссии\nДиагностика тормозов\nДиагностика подвески\nДиагностика электрики\nРаспечатка отчёта',
   2500, '1.5 ч', 'Диагностика', 4);
