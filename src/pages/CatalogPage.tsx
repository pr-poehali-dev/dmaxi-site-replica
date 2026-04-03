import Icon from "@/components/ui/icon";

// Переиспользуем эту страницу как страницу цен (Prices)
interface PricesPageProps {
  onNavigate: (p: string) => void;
}

const priceSections = [
  {
    title: "ТО и замена жидкостей",
    rows: [
      { name: "Замена моторного масла + фильтр", price: "800 ₽", time: "30 мин" },
      { name: "Замена охлаждающей жидкости", price: "600 ₽", time: "40 мин" },
      { name: "Замена тормозной жидкости", price: "500 ₽", time: "20 мин" },
      { name: "ТО-1 (по регламенту)", price: "от 3 500 ₽", time: "2–3 ч" },
      { name: "ТО-2 (по регламенту)", price: "от 6 000 ₽", time: "3–4 ч" },
    ],
  },
  {
    title: "Двигатель",
    rows: [
      { name: "Диагностика двигателя", price: "500 ₽", time: "30 мин" },
      { name: "Замена ремня ГРМ", price: "от 2 500 ₽", time: "2–3 ч" },
      { name: "Замена прокладки ГБЦ", price: "от 5 000 ₽", time: "4–6 ч" },
      { name: "Капитальный ремонт двигателя", price: "от 30 000 ₽", time: "2–5 дней" },
    ],
  },
  {
    title: "Ходовая часть",
    rows: [
      { name: "Замена амортизатора (1 шт.)", price: "от 1 200 ₽", time: "1 ч" },
      { name: "Замена шаровой опоры (1 шт.)", price: "от 800 ₽", time: "1 ч" },
      { name: "Замена тормозных колодок (1 ось)", price: "от 700 ₽", time: "45 мин" },
      { name: "Сход-развал 3D", price: "от 1 000 ₽", time: "1 ч" },
      { name: "Замена рулевых наконечников", price: "от 900 ₽", time: "1 ч" },
    ],
  },
  {
    title: "Шиномонтаж",
    rows: [
      { name: "Шиномонтаж R13–R15 (1 шт.)", price: "300 ₽", time: "15 мин" },
      { name: "Шиномонтаж R16–R18 (1 шт.)", price: "400 ₽", time: "15 мин" },
      { name: "Шиномонтаж R19–R20 (1 шт.)", price: "500 ₽", time: "15 мин" },
      { name: "Балансировка (1 колесо)", price: "200 ₽", time: "10 мин" },
      { name: "Ремонт прокола", price: "300 ₽", time: "20 мин" },
      { name: "Хранение шин (сезон)", price: "от 2 000 ₽", time: "—" },
    ],
  },
];

export default function CatalogPage({ onNavigate }: PricesPageProps) {
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
          <h1 className="font-display font-bold text-4xl lg:text-5xl uppercase mb-3">Стоимость услуг</h1>
          <p className="text-muted-foreground text-sm max-w-lg">
            Цены указаны за работу без стоимости запчастей и расходных материалов. Точную стоимость уточняйте у менеджера.
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
