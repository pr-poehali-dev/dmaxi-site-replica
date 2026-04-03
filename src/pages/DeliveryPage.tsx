import Icon from "@/components/ui/icon";

const deliveryOptions = [
  {
    icon: "Truck",
    title: "Доставка курьером",
    desc: "По Москве и МО",
    price: "Бесплатно от 15 000 ₽",
    time: "1–2 рабочих дня",
    details: ["Доставка до двери", "Подъём на этаж по запросу", "Сборка мебели — отдельно", "SMS-уведомление"],
  },
  {
    icon: "Building",
    title: "Самовывоз",
    desc: "Москва, ул. Деловая, 15",
    price: "Бесплатно",
    time: "Готовность за 2 часа",
    details: ["Ежедневно 9:00–20:00", "Парковка для клиентов", "Проверка товара на месте", "Помощь в погрузке"],
  },
  {
    icon: "Package",
    title: "Доставка по России",
    desc: "СДЭК, ПЭК, Деловые Линии",
    price: "По тарифам ТК",
    time: "3–10 рабочих дней",
    details: ["Страхование груза", "Трекинг посылки", "Доставка до пункта или двери", "Работаем с крупногабаритом"],
  },
  {
    icon: "Globe",
    title: "Экспресс-доставка",
    desc: "Срочные заказы",
    price: "от 1 500 ₽",
    time: "В день заказа до 14:00",
    details: ["Заказ до 12:00", "Только по Москве", "Уведомление за 30 мин", "Для приоритетных клиентов"],
  },
];

const paymentMethods = [
  { icon: "CreditCard", title: "Банковская карта", desc: "Visa, MasterCard, МИР" },
  { icon: "Building2", title: "Банковский перевод", desc: "По реквизитам для юр. лиц" },
  { icon: "FileText", title: "Счёт на оплату", desc: "Выставим счёт за 15 минут" },
  { icon: "Repeat", title: "Лизинг", desc: "Рассрочка 12–60 месяцев" },
];

export default function DeliveryPage() {
  return (
    <div className="animate-fade-in">
      {/* Breadcrumb */}
      <div className="border-b border-border bg-secondary/30">
        <div className="container mx-auto px-4 py-3 flex items-center gap-2 text-xs text-muted-foreground font-mono">
          <span className="hover:text-foreground cursor-pointer">Главная</span>
          <Icon name="ChevronRight" size={12} />
          <span className="text-foreground">Доставка и оплата</span>
        </div>
      </div>

      {/* Header */}
      <section className="bg-[hsl(var(--primary))] py-14 text-center">
        <div className="container mx-auto px-4">
          <div className="section-label text-white/40 mb-3">Условия</div>
          <h1 className="text-4xl font-black text-white tracking-tight mb-4">Доставка и оплата</h1>
          <p className="text-white/60 max-w-md mx-auto text-sm leading-relaxed">
            Доставляем по всей России — быстро, надёжно и в сохранности
          </p>
        </div>
      </section>

      {/* Delivery Options */}
      <section className="container mx-auto px-4 py-14">
        <div className="section-label mb-2">Варианты доставки</div>
        <h2 className="text-2xl font-black tracking-tight mb-8">Выберите удобный способ</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {deliveryOptions.map((opt) => (
            <div key={opt.title} className="product-card p-5 flex flex-col">
              <div className="w-10 h-10 bg-secondary flex items-center justify-center mb-4">
                <Icon name={opt.icon as "Truck"} size={20} className="text-foreground" />
              </div>
              <h3 className="font-black text-sm mb-1">{opt.title}</h3>
              <div className="text-xs text-muted-foreground mb-3">{opt.desc}</div>
              <div className="bg-secondary/50 px-3 py-2 mb-3">
                <div className="text-xs font-semibold text-foreground">{opt.price}</div>
                <div className="section-label mt-0.5">{opt.time}</div>
              </div>
              <ul className="space-y-1.5 flex-1">
                {opt.details.map((d) => (
                  <li key={d} className="flex items-start gap-2 text-xs text-muted-foreground">
                    <Icon name="Check" size={11} className="shrink-0 mt-0.5 text-[hsl(var(--corp-gold))]" />
                    {d}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Payment */}
      <section className="bg-secondary/30 border-y border-border py-14">
        <div className="container mx-auto px-4">
          <div className="section-label mb-2">Оплата</div>
          <h2 className="text-2xl font-black tracking-tight mb-8">Способы оплаты</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {paymentMethods.map((m) => (
              <div key={m.title} className="border border-border bg-card p-5 flex items-start gap-4">
                <div className="w-10 h-10 bg-secondary flex items-center justify-center shrink-0">
                  <Icon name={m.icon as "CreditCard"} size={18} />
                </div>
                <div>
                  <div className="text-sm font-semibold">{m.title}</div>
                  <div className="text-xs text-muted-foreground mt-1">{m.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="container mx-auto px-4 py-14">
        <div className="section-label mb-2">Частые вопросы</div>
        <h2 className="text-2xl font-black tracking-tight mb-8">Вопросы по доставке</h2>
        <div className="max-w-2xl space-y-0 divide-y divide-border border border-border">
          {[
            { q: "Можно ли отследить статус доставки?", a: "Да, после оформления заказа вы получите ссылку для отслеживания на email и по SMS." },
            { q: "Что делать при повреждении товара при доставке?", a: "Зафиксируйте повреждения при курьере, сфотографируйте и обратитесь в наш сервисный центр. Мы решим вопрос в течение 3 дней." },
            { q: "Есть ли доставка в выходные?", a: "Курьерская доставка по Москве работает в субботу. Самовывоз доступен ежедневно с 9:00 до 20:00." },
            { q: "Как оформить возврат?", a: "Возврат товара надлежащего качества — в течение 14 дней. Свяжитесь с менеджером, мы организуем бесплатный обратный вывоз." },
          ].map((faq) => (
            <details key={faq.q} className="group">
              <summary className="flex items-center justify-between gap-4 px-5 py-4 cursor-pointer list-none">
                <span className="text-sm font-semibold">{faq.q}</span>
                <Icon name="ChevronDown" size={16} className="text-muted-foreground shrink-0 group-open:rotate-180 transition-transform duration-200" />
              </summary>
              <div className="px-5 pb-4 text-sm text-muted-foreground leading-relaxed">{faq.a}</div>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
