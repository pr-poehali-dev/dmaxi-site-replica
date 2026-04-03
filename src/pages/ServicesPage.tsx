import Icon from "@/components/ui/icon";

const services = [
  {
    icon: "Truck",
    title: "Корпоративные поставки",
    desc: "Комплексное оснащение офисов под ключ. Работаем с юридическими лицами по договорам и счетам.",
    features: ["Постоянный менеджер", "Отсрочка платежа 30 дней", "Персональный прайс-лист"],
    price: "от 0 ₽",
    tag: "Популярная",
  },
  {
    icon: "Wrench",
    title: "Сервисное обслуживание",
    desc: "Техническое обслуживание и ремонт оргтехники. Выездные специалисты по Москве и МО.",
    features: ["Выезд за 4 часа", "Оригинальные запчасти", "Гарантия на ремонт 1 год"],
    price: "от 1 200 ₽",
    tag: null,
  },
  {
    icon: "Package",
    title: "Складское хранение",
    desc: "Ответственное хранение товаров и оборудования на нашем складе площадью 2 000 м².",
    features: ["Видеонаблюдение 24/7", "Климат-контроль", "Страхование грузов"],
    price: "от 800 ₽/м²",
    tag: null,
  },
  {
    icon: "Settings",
    title: "Установка и настройка",
    desc: "Монтаж, установка и настройка оборудования на месте. Обучение персонала заказчика.",
    features: ["Сертифицированные специалисты", "Документация и инструкции", "Техподдержка 12 мес."],
    price: "от 3 500 ₽",
    tag: null,
  },
  {
    icon: "RefreshCw",
    title: "Лизинг оборудования",
    desc: "Финансовый лизинг для бизнеса. Получите необходимое оборудование без единовременных затрат.",
    features: ["Срок от 12 до 60 месяцев", "Ставка от 8% годовых", "Без залога до 5 млн ₽"],
    price: "Индивидуально",
    tag: "Новинка",
  },
  {
    icon: "Headphones",
    title: "IT-поддержка",
    desc: "Удалённая и выездная техническая поддержка. Поддержка парка техники по абонементу.",
    features: ["SLA до 1 часа", "Удалённый доступ", "Мониторинг оборудования"],
    price: "от 5 000 ₽/мес",
    tag: null,
  },
];

interface ServicesPageProps {
  onNavigate: (page: string) => void;
}

export default function ServicesPage({ onNavigate }: ServicesPageProps) {
  return (
    <div className="animate-fade-in">
      {/* Breadcrumb */}
      <div className="border-b border-border bg-secondary/30">
        <div className="container mx-auto px-4 py-3 flex items-center gap-2 text-xs text-muted-foreground font-mono">
          <span className="hover:text-foreground cursor-pointer transition-colors">Главная</span>
          <Icon name="ChevronRight" size={12} />
          <span className="text-foreground">Услуги</span>
        </div>
      </div>

      {/* Hero */}
      <section className="bg-[hsl(var(--primary))] py-14 text-center">
        <div className="container mx-auto px-4">
          <div className="section-label text-white/40 mb-3">Что мы предлагаем</div>
          <h1 className="text-4xl font-black text-white tracking-tight mb-4">Услуги компании</h1>
          <p className="text-white/60 max-w-md mx-auto text-sm leading-relaxed">
            Комплексные решения для бизнеса — от поставки до сервисного обслуживания
          </p>
        </div>
      </section>

      {/* Services Grid */}
      <section className="container mx-auto px-4 py-14">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {services.map((s) => (
            <div key={s.title} className="product-card p-6 flex flex-col">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-secondary flex items-center justify-center">
                  <Icon name={s.icon as "Truck"} size={22} className="text-foreground" />
                </div>
                {s.tag && (
                  <span className={`px-2 py-0.5 text-xs font-semibold ${
                    s.tag === "Популярная" ? "bg-[hsl(var(--primary))] text-white" : "bg-[hsl(var(--corp-gold))] text-white"
                  }`}>{s.tag}</span>
                )}
              </div>
              <h3 className="text-base font-black mb-2">{s.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4 flex-1">{s.desc}</p>
              <ul className="space-y-2 mb-5">
                {s.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Icon name="Check" size={12} className="text-[hsl(var(--corp-gold))] shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <div className="divider-rule pt-4 flex items-center justify-between">
                <span className="font-black text-sm">{s.price}</span>
                <button
                  onClick={() => onNavigate("contacts")}
                  className="text-xs font-semibold tracking-wide uppercase text-[hsl(var(--primary))] hover:underline"
                >
                  Запросить →
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Process */}
      <section className="bg-secondary/30 border-y border-border py-14">
        <div className="container mx-auto px-4">
          <div className="section-label mb-2 text-center">Как это работает</div>
          <h2 className="text-2xl font-black tracking-tight text-center mb-10">Процесс работы</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { n: "01", title: "Заявка", desc: "Оставьте заявку или позвоните нам" },
              { n: "02", title: "Консультация", desc: "Менеджер связывается в течение 1 часа" },
              { n: "03", title: "Договор", desc: "Подписание договора и счёт на оплату" },
              { n: "04", title: "Исполнение", desc: "Поставка и выполнение в срок" },
            ].map((step) => (
              <div key={step.n} className="text-center">
                <div className="font-mono font-black text-4xl text-border mb-3">{step.n}</div>
                <div className="text-base font-black mb-2">{step.title}</div>
                <div className="text-sm text-muted-foreground">{step.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-14 text-center">
        <h2 className="text-2xl font-black tracking-tight mb-4">Нужна индивидуальная консультация?</h2>
        <p className="text-muted-foreground mb-8 max-w-md mx-auto text-sm">Наши специалисты подберут оптимальное решение под ваши задачи</p>
        <button onClick={() => onNavigate("contacts")} className="btn-primary">
          Получить консультацию
        </button>
      </section>
    </div>
  );
}
