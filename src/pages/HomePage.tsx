import Icon from "@/components/ui/icon";

const HERO_IMAGE = "https://cdn.poehali.dev/projects/6ac06d75-10c8-4905-8743-acae4c622e9a/files/f4ba5a73-e09c-4e13-8508-5492ff262ea8.jpg";
const OFFICE_IMAGE = "https://cdn.poehali.dev/projects/6ac06d75-10c8-4905-8743-acae4c622e9a/files/bc1b03f6-c2e4-4b4c-8f3d-7b6a7e74c8ce.jpg";

const categories = [
  { icon: "Briefcase", label: "Оргтехника", count: 245 },
  { icon: "Monitor", label: "Компьютеры", count: 189 },
  { icon: "Printer", label: "Принтеры", count: 67 },
  { icon: "Headphones", label: "Гарнитуры", count: 94 },
  { icon: "Package", label: "Расходники", count: 312 },
  { icon: "Shield", label: "Безопасность", count: 56 },
];

const featuredProducts = [
  { id: 1, name: "Кресло руководителя Exec Pro", category: "Мебель", price: 28900, oldPrice: 34500, badge: "Хит", rating: 4.8, reviews: 124 },
  { id: 2, name: "МФУ Laser Business 3500", category: "Оргтехника", price: 45600, oldPrice: null, badge: "Новинка", rating: 4.9, reviews: 87 },
  { id: 3, name: "Стол переговоров Conference L", category: "Мебель", price: 67000, oldPrice: 78000, badge: null, rating: 4.7, reviews: 43 },
  { id: 4, name: "Гарнитура Jabra BIZ 2300", category: "Связь", price: 12400, oldPrice: 14800, badge: "Скидка", rating: 4.6, reviews: 201 },
];

const stats = [
  { value: "14+", label: "лет на рынке" },
  { value: "8 200+", label: "позиций в каталоге" },
  { value: "15 000+", label: "клиентов B2B" },
  { value: "99%", label: "довольны покупкой" },
];

interface HomePageProps {
  onNavigate: (page: string) => void;
  onAddToCart: () => void;
}

export default function HomePage({ onNavigate, onAddToCart }: HomePageProps) {
  return (
    <div className="animate-fade-in">
      {/* Hero */}
      <section className="relative overflow-hidden bg-[hsl(var(--primary))] min-h-[480px] flex items-center">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{ backgroundImage: `url(${HERO_IMAGE})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[hsl(var(--primary))] via-[hsl(var(--primary))]/90 to-transparent" />
        <div className="relative container mx-auto px-4 py-16 lg:py-24">
          <div className="max-w-xl">
            <div className="section-label text-white/50 mb-4">Деловые решения для профессионалов</div>
            <h1 className="text-4xl lg:text-6xl font-black text-white leading-tight tracking-tight mb-6">
              Всё для<br/>
              <span className="text-[hsl(var(--corp-gold))]">вашего</span><br/>
              бизнеса
            </h1>
            <p className="text-white/70 text-base mb-8 leading-relaxed max-w-sm">
              Профессиональная оргтехника, мебель и решения для офиса. Корпоративные поставки. Гарантия на всё.
            </p>
            <div className="flex flex-wrap gap-3">
              <button onClick={() => onNavigate("catalog")} className="btn-primary" style={{ background: "hsl(42, 70%, 45%)", color: "#fff" }}>
                Перейти в каталог
              </button>
              <button onClick={() => onNavigate("services")} className="border border-white/40 text-white px-6 py-2.5 text-sm font-semibold tracking-wide uppercase hover:bg-white/10 transition-all duration-200">
                Наши услуги
              </button>
            </div>
          </div>
        </div>
        {/* Декоративные линии */}
        <div className="absolute right-0 top-0 bottom-0 w-px bg-white/5" />
        <div className="absolute right-16 top-0 bottom-0 w-px bg-white/5" />
        <div className="absolute right-32 top-0 bottom-0 w-px bg-white/5" />
      </section>

      {/* Stats */}
      <section className="bg-secondary border-b border-border">
        <div className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-0 lg:divide-x divide-border">
            {stats.map((s) => (
              <div key={s.label} className="text-center px-4">
                <div className="text-3xl font-black text-foreground">{s.value}</div>
                <div className="text-xs text-muted-foreground mt-1 font-mono uppercase tracking-wide">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="container mx-auto px-4 py-14">
        <div className="flex items-end justify-between mb-8">
          <div>
            <div className="section-label mb-1">Ассортимент</div>
            <h2 className="text-2xl font-black tracking-tight">Категории товаров</h2>
          </div>
          <button onClick={() => onNavigate("catalog")} className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Все категории <Icon name="ArrowRight" size={14} />
          </button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {categories.map((cat) => (
            <button
              key={cat.label}
              onClick={() => onNavigate("catalog")}
              className="group product-card p-5 flex flex-col items-center gap-3 text-center"
            >
              <div className="w-12 h-12 bg-secondary group-hover:bg-[hsl(var(--primary))] flex items-center justify-center transition-colors duration-300">
                <Icon name={cat.icon as any} size={22} className="text-foreground group-hover:text-white transition-colors duration-300" />
              </div>
              <div>
                <div className="text-sm font-semibold">{cat.label}</div>
                <div className="text-xs text-muted-foreground font-mono mt-0.5">{cat.count} тов.</div>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="bg-secondary/50 border-y border-border py-14">
        <div className="container mx-auto px-4">
          <div className="flex items-end justify-between mb-8">
            <div>
              <div className="section-label mb-1">Подборка</div>
              <h2 className="text-2xl font-black tracking-tight">Популярные товары</h2>
            </div>
            <button onClick={() => onNavigate("catalog")} className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Смотреть все <Icon name="ArrowRight" size={14} />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {featuredProducts.map((p) => (
              <div key={p.id} className="product-card group cursor-pointer" onClick={() => onNavigate("catalog")}>
                <div className="relative aspect-square bg-gradient-to-br from-secondary to-background flex items-center justify-center overflow-hidden">
                  <Icon name="Package" size={48} className="text-muted-foreground/30 group-hover:scale-110 transition-transform duration-300" />
                  {p.badge && (
                    <div className={`absolute top-3 left-3 px-2 py-0.5 text-xs font-semibold tracking-wide ${
                      p.badge === "Хит" ? "bg-[hsl(var(--primary))] text-white" :
                      p.badge === "Новинка" ? "bg-[hsl(var(--corp-navy))] text-white" :
                      "bg-[hsl(var(--corp-gold))] text-white"
                    }`}>
                      {p.badge}
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <div className="section-label mb-1">{p.category}</div>
                  <div className="text-sm font-semibold leading-tight mb-3 line-clamp-2">{p.name}</div>
                  <div className="flex items-center gap-1 mb-3">
                    {[1,2,3,4,5].map((s) => (
                      <Icon key={s} name="Star" size={10} className={s <= Math.round(p.rating) ? "text-[hsl(var(--corp-gold))] fill-[hsl(var(--corp-gold))]" : "text-muted-foreground"} />
                    ))}
                    <span className="text-xs text-muted-foreground ml-1">({p.reviews})</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-lg font-black">{p.price.toLocaleString("ru-RU")} ₽</div>
                      {p.oldPrice && <div className="text-xs text-muted-foreground line-through">{p.oldPrice.toLocaleString("ru-RU")} ₽</div>}
                    </div>
                    <button
                      className="p-2 bg-[hsl(var(--primary))] text-white hover:opacity-80 transition-opacity"
                      onClick={(e) => { e.stopPropagation(); onAddToCart(); }}
                    >
                      <Icon name="ShoppingCart" size={15} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Preview */}
      <section className="container mx-auto px-4 py-14">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="relative">
            <div className="aspect-[4/3] overflow-hidden">
              <img src={OFFICE_IMAGE} alt="Наш офис" className="w-full h-full object-cover" />
            </div>
            <div className="absolute -bottom-4 -right-4 hidden lg:block bg-[hsl(var(--primary))] text-white p-6 w-40">
              <div className="text-3xl font-black">14+</div>
              <div className="text-xs font-mono opacity-60 uppercase tracking-wide mt-1">лет опыта</div>
            </div>
          </div>
          <div>
            <div className="section-label mb-3">О нас</div>
            <h2 className="text-3xl font-black tracking-tight mb-5 leading-tight">
              Надёжный партнёр<br/>для вашего бизнеса
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-6">
              Компания «Корпус» специализируется на комплексном оснащении офисов и предприятий. Мы предлагаем широкий ассортимент профессионального оборудования, мебели и расходных материалов от ведущих производителей.
            </p>
            <div className="grid grid-cols-2 gap-4 mb-8">
              {[
                { icon: "CheckCircle", text: "Официальные дистрибьюторы" },
                { icon: "Truck", text: "Доставка по всей России" },
                { icon: "Shield", text: "Гарантия и сервис" },
                { icon: "FileText", text: "Работа с юр. лицами" },
              ].map((f) => (
                <div key={f.text} className="flex items-center gap-2.5 text-sm font-medium">
                  <Icon name={f.icon as any} size={16} className="text-[hsl(var(--corp-gold))] shrink-0" />
                  {f.text}
                </div>
              ))}
            </div>
            <button onClick={() => onNavigate("about")} className="btn-outline">
              Подробнее о компании
            </button>
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="bg-[hsl(var(--primary))] py-14">
        <div className="container mx-auto px-4 text-center">
          <div className="section-label text-white/40 mb-3">Корпоративным клиентам</div>
          <h2 className="text-3xl font-black text-white mb-4">Специальные условия для бизнеса</h2>
          <p className="text-white/60 max-w-md mx-auto mb-8 text-sm leading-relaxed">
            Корпоративные скидки, персональный менеджер и отсрочка платежа для юридических лиц
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <button onClick={() => onNavigate("contacts")} className="btn-primary" style={{ background: "hsl(42, 70%, 45%)", color: "#fff" }}>
              Связаться с менеджером
            </button>
            <button className="border border-white/30 text-white px-6 py-2.5 text-sm font-semibold tracking-wide uppercase hover:bg-white/10 transition-all duration-200">
              Скачать прайс-лист
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
