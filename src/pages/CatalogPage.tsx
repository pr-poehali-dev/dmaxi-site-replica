import Icon from "@/components/ui/icon";
import { useSiteSettings } from "@/context/SiteSettingsContext";

interface PricesPageProps {
  onNavigate: (p: string) => void;
}

export default function CatalogPage({ onNavigate }: PricesPageProps) {
  const { s } = useSiteSettings();

  const priceSections = [
    {
      title: s("prices","sec1_title","ТО и замена жидкостей"),
      rows: [
        { name: s("prices","sec1_r1_name","Замена моторного масла + фильтр"), price: s("prices","sec1_r1_price","800 ₽"),        time: s("prices","sec1_r1_time","30 мин") },
        { name: s("prices","sec1_r2_name","Замена охлаждающей жидкости"),      price: s("prices","sec1_r2_price","600 ₽"),        time: s("prices","sec1_r2_time","40 мин") },
        { name: s("prices","sec1_r3_name","Замена тормозной жидкости"),        price: s("prices","sec1_r3_price","500 ₽"),        time: s("prices","sec1_r3_time","20 мин") },
        { name: s("prices","sec1_r4_name","ТО-1 (по регламенту)"),             price: s("prices","sec1_r4_price","от 3 500 ₽"),   time: s("prices","sec1_r4_time","2–3 ч") },
        { name: s("prices","sec1_r5_name","ТО-2 (по регламенту)"),             price: s("prices","sec1_r5_price","от 6 000 ₽"),   time: s("prices","sec1_r5_time","3–4 ч") },
      ],
    },
    {
      title: s("prices","sec2_title","Двигатель"),
      rows: [
        { name: s("prices","sec2_r1_name","Диагностика двигателя"),           price: s("prices","sec2_r1_price","500 ₽"),         time: s("prices","sec2_r1_time","30 мин") },
        { name: s("prices","sec2_r2_name","Замена ремня ГРМ"),                price: s("prices","sec2_r2_price","от 2 500 ₽"),    time: s("prices","sec2_r2_time","2–3 ч") },
        { name: s("prices","sec2_r3_name","Замена прокладки ГБЦ"),            price: s("prices","sec2_r3_price","от 5 000 ₽"),    time: s("prices","sec2_r3_time","4–6 ч") },
        { name: s("prices","sec2_r4_name","Капитальный ремонт двигателя"),    price: s("prices","sec2_r4_price","от 30 000 ₽"),   time: s("prices","sec2_r4_time","2–5 дней") },
      ],
    },
    {
      title: s("prices","sec3_title","Ходовая часть"),
      rows: [
        { name: s("prices","sec3_r1_name","Замена амортизатора (1 шт.)"),     price: s("prices","sec3_r1_price","от 1 200 ₽"),    time: s("prices","sec3_r1_time","1 ч") },
        { name: s("prices","sec3_r2_name","Замена шаровой опоры (1 шт.)"),    price: s("prices","sec3_r2_price","от 800 ₽"),      time: s("prices","sec3_r2_time","1 ч") },
        { name: s("prices","sec3_r3_name","Замена тормозных колодок (1 ось)"),price: s("prices","sec3_r3_price","от 700 ₽"),      time: s("prices","sec3_r3_time","45 мин") },
        { name: s("prices","sec3_r4_name","Сход-развал 3D"),                  price: s("prices","sec3_r4_price","от 1 000 ₽"),    time: s("prices","sec3_r4_time","1 ч") },
        { name: s("prices","sec3_r5_name","Замена рулевых наконечников"),     price: s("prices","sec3_r5_price","от 900 ₽"),      time: s("prices","sec3_r5_time","1 ч") },
      ],
    },
    {
      title: s("prices","sec4_title","Шиномонтаж"),
      rows: [
        { name: s("prices","sec4_r1_name","Шиномонтаж R13–R15 (1 шт.)"),     price: s("prices","sec4_r1_price","300 ₽"),         time: s("prices","sec4_r1_time","15 мин") },
        { name: s("prices","sec4_r2_name","Шиномонтаж R16–R18 (1 шт.)"),     price: s("prices","sec4_r2_price","400 ₽"),         time: s("prices","sec4_r2_time","15 мин") },
        { name: s("prices","sec4_r3_name","Шиномонтаж R19–R20 (1 шт.)"),     price: s("prices","sec4_r3_price","500 ₽"),         time: s("prices","sec4_r3_time","15 мин") },
        { name: s("prices","sec4_r4_name","Балансировка (1 колесо)"),         price: s("prices","sec4_r4_price","200 ₽"),         time: s("prices","sec4_r4_time","10 мин") },
        { name: s("prices","sec4_r5_name","Ремонт прокола"),                  price: s("prices","sec4_r5_price","300 ₽"),         time: s("prices","sec4_r5_time","20 мин") },
        { name: s("prices","sec4_r6_name","Хранение шин (сезон)"),            price: s("prices","sec4_r6_price","от 2 000 ₽"),    time: s("prices","sec4_r6_time","—") },
      ],
    },
  ];

  return (
    <div className="animate-fade-in">
      <div className="border-b border-border">
        <div className="container mx-auto py-3 flex items-center gap-2 text-xs text-muted-foreground">
          <button onClick={() => onNavigate("home")} className="hover:text-foreground transition-colors font-display uppercase tracking-wide">Главная</button>
          <Icon name="ChevronRight" size={12} />
          <span className="text-foreground font-display uppercase tracking-wide">Стоимость</span>
        </div>
      </div>

      <div className="bg-card border-b border-border py-12">
        <div className="container mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <div className="red-line" />
            <span className="label-tag">Прозрачное ценообразование</span>
          </div>
          <h1 className="font-display font-bold text-4xl lg:text-5xl uppercase mb-3">
            {s("prices","page_title","Прайс-лист")}
          </h1>
          <p className="text-muted-foreground text-sm max-w-lg">
            {s("prices","page_subtitle","Актуальные цены на ремонт и обслуживание. Точная стоимость определяется после диагностики.")}
          </p>
        </div>
      </div>

      <div className="container mx-auto section-py">
        <div className="space-y-8">
          {priceSections.map((section) => (
            <div key={section.title} className="card-dark overflow-hidden">
              <div className="bg-primary/10 border-b border-border px-6 py-4">
                <h2 className="font-display font-bold text-base uppercase tracking-wider text-foreground">{section.title}</h2>
              </div>
              <div className="divide-y divide-border">
                {section.rows.map((row) => (
                  <div key={row.name} className="px-6 py-4 flex items-center justify-between gap-4 hover:bg-secondary/20 transition-colors">
                    <span className="text-sm text-muted-foreground flex-1">{row.name}</span>
                    <div className="flex items-center gap-6 shrink-0">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground/60 hidden sm:flex">
                        <Icon name="Clock" size={11} />
                        {row.time}
                      </div>
                      <span className="text-primary font-display font-bold text-sm tracking-wide w-32 text-right">{row.price}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 border border-border p-6 flex flex-col sm:flex-row items-start sm:items-center gap-5 justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Icon name="Info" size={16} className="text-primary" />
              <span className="font-display font-bold text-sm uppercase tracking-wide">Клубная скидка</span>
            </div>
            <p className="text-sm text-muted-foreground">Владельцы клубной карты DD MAXI получают скидку до 10% на все услуги</p>
          </div>
          <button onClick={() => onNavigate("club")} className="btn-red shrink-0">
            Получить карту →
          </button>
        </div>
      </div>
    </div>
  );
}
