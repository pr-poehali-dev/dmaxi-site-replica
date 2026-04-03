import { useState } from "react";
import Icon from "@/components/ui/icon";

const posts = [
  {
    id: 1,
    title: "Как выбрать МФУ для малого офиса: полное руководство 2024",
    excerpt: "Разбираем ключевые параметры при выборе многофункционального устройства: скорость печати, расход тонера, форматы бумаги и совместимость с корпоративными системами.",
    category: "Оргтехника",
    date: "28 марта 2024",
    readTime: "7 мин",
    views: 4821,
  },
  {
    id: 2,
    title: "Эргономика рабочего места: инвестиция в продуктивность",
    excerpt: "Исследования показывают: правильно организованное рабочее место повышает продуктивность сотрудников на 20–30%. Рассказываем, с чего начать.",
    category: "Мебель",
    date: "22 марта 2024",
    readTime: "5 мин",
    views: 3140,
  },
  {
    id: 3,
    title: "Корпоративные закупки: 5 способов оптимизировать расходы",
    excerpt: "Рассказываем об инструментах контроля закупок, договорах обслуживания и стратегиях работы с поставщиками для снижения операционных затрат.",
    category: "Бизнес",
    date: "15 марта 2024",
    readTime: "9 мин",
    views: 6305,
  },
  {
    id: 4,
    title: "Организация переговорной комнаты: технологии и оснащение",
    excerpt: "От видеоконференций до интерактивных досок — обзор современного оборудования для эффективных переговоров и презентаций.",
    category: "Интерьер",
    date: "8 марта 2024",
    readTime: "6 мин",
    views: 2890,
  },
  {
    id: 5,
    title: "IP-телефония для бизнеса: переход с обычных телефонов",
    excerpt: "Практическое руководство по переходу на IP-телефонию: оборудование, настройка, плюсы и минусы для компаний разного масштаба.",
    category: "Связь",
    date: "1 марта 2024",
    readTime: "8 мин",
    views: 3720,
  },
  {
    id: 6,
    title: "Техника безопасности: огнеупорные сейфы и шредеры",
    excerpt: "Защита конфиденциальных документов и корпоративных данных. Обзор классов защиты и рекомендации по выбору.",
    category: "Безопасность",
    date: "22 февраля 2024",
    readTime: "4 мин",
    views: 1940,
  },
];

const blogCategories = ["Все", "Оргтехника", "Мебель", "Бизнес", "Интерьер", "Связь", "Безопасность"];

export default function BlogPage() {
  const [activeCategory, setActiveCategory] = useState("Все");

  const filtered = activeCategory === "Все" ? posts : posts.filter((p) => p.category === activeCategory);

  return (
    <div className="animate-fade-in">
      {/* Breadcrumb */}
      <div className="border-b border-border bg-secondary/30">
        <div className="container mx-auto px-4 py-3 flex items-center gap-2 text-xs text-muted-foreground font-mono">
          <span className="hover:text-foreground cursor-pointer">Главная</span>
          <Icon name="ChevronRight" size={12} />
          <span className="text-foreground">Блог</span>
        </div>
      </div>

      {/* Header */}
      <section className="bg-[hsl(var(--primary))] py-14 text-center">
        <div className="container mx-auto px-4">
          <div className="section-label text-white/40 mb-3">Экспертный контент</div>
          <h1 className="text-4xl font-black text-white tracking-tight mb-4">Блог компании</h1>
          <p className="text-white/60 max-w-md mx-auto text-sm leading-relaxed">
            Советы по оснащению офиса, обзоры оборудования и лайфхаки для бизнеса
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4 py-10">
        {/* Category Tabs */}
        <div className="flex gap-2 flex-wrap mb-8 pb-6 border-b border-border">
          {blogCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-1.5 text-sm font-medium transition-all ${
                activeCategory === cat
                  ? "bg-[hsl(var(--primary))] text-white"
                  : "border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Featured Post */}
        {activeCategory === "Все" && filtered[0] && (
          <div className="product-card mb-8 grid md:grid-cols-2 overflow-hidden cursor-pointer group">
            <div className="aspect-video md:aspect-auto bg-gradient-to-br from-secondary to-background flex items-center justify-center">
              <Icon name="BookOpen" size={56} className="text-muted-foreground/20 group-hover:scale-105 transition-transform duration-300" />
            </div>
            <div className="p-7 flex flex-col justify-center">
              <div className="flex items-center gap-3 mb-4">
                <span className="px-2 py-0.5 bg-[hsl(var(--primary))] text-white text-xs font-semibold">{filtered[0].category}</span>
                <span className="section-label">Главное</span>
              </div>
              <h2 className="text-xl font-black leading-tight mb-3">{filtered[0].title}</h2>
              <p className="text-sm text-muted-foreground leading-relaxed mb-5 line-clamp-3">{filtered[0].excerpt}</p>
              <div className="flex items-center gap-4 text-xs text-muted-foreground font-mono">
                <span>{filtered[0].date}</span>
                <span className="flex items-center gap-1"><Icon name="Clock" size={11} />{filtered[0].readTime}</span>
                <span className="flex items-center gap-1"><Icon name="Eye" size={11} />{filtered[0].views.toLocaleString()}</span>
              </div>
            </div>
          </div>
        )}

        {/* Posts Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {(activeCategory === "Все" ? filtered.slice(1) : filtered).map((post) => (
            <article key={post.id} className="product-card cursor-pointer group overflow-hidden">
              <div className="aspect-video bg-gradient-to-br from-secondary to-background flex items-center justify-center">
                <Icon name="FileText" size={36} className="text-muted-foreground/20 group-hover:scale-105 transition-transform duration-300" />
              </div>
              <div className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="section-label text-[hsl(var(--corp-gold))]">{post.category}</span>
                  <span className="section-label">{post.readTime}</span>
                </div>
                <h3 className="text-sm font-black leading-tight mb-2 line-clamp-2 group-hover:text-[hsl(var(--accent))] transition-colors">{post.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3 mb-4">{post.excerpt}</p>
                <div className="flex items-center justify-between text-xs text-muted-foreground font-mono">
                  <span>{post.date}</span>
                  <span className="flex items-center gap-1"><Icon name="Eye" size={11} />{post.views.toLocaleString()}</span>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Subscribe */}
        <div className="mt-12 bg-secondary/50 border border-border p-8 text-center">
          <div className="section-label mb-2">Рассылка</div>
          <h3 className="text-xl font-black mb-2">Полезные материалы на почту</h3>
          <p className="text-sm text-muted-foreground mb-5">Только экспертные статьи, без спама</p>
          <div className="flex gap-2 max-w-sm mx-auto">
            <input
              type="email"
              placeholder="your@company.ru"
              className="flex-1 border border-border px-4 py-2.5 text-sm bg-background focus:outline-none focus:border-foreground/40"
            />
            <button className="btn-primary shrink-0">Подписаться</button>
          </div>
        </div>
      </div>
    </div>
  );
}
