import { useState } from "react";
import Icon from "@/components/ui/icon";
import { useSiteSettings } from "@/context/SiteSettingsContext";

const filterCats = ["Все", "Двигатель", "Кузов", "Ходовая", "Электрика", "ТО"];

interface PortfolioPageProps {
  onNavigate: (p: string) => void;
}

export default function BlogPage({ onNavigate }: PortfolioPageProps) {
  const { s } = useSiteSettings();
  const [activeFilter, setActiveFilter] = useState("Все");

  const works = [
    { id: 1, title: s("portfolio","w1_title","Капитальный ремонт BMW E60"),    category: s("portfolio","w1_cat","Двигатель"), desc: s("portfolio","w1_desc","Замена поршневой группы, шлифовка ГБЦ, замена прокладок"),                        before: s("portfolio","w1_problem","Стук двигателя, дымление"),          result: s("portfolio","w1_result","Двигатель как новый, гарантия 1 год") },
    { id: 2, title: s("portfolio","w2_title","Кузовной ремонт Toyota Camry"),  category: s("portfolio","w2_cat","Кузов"),     desc: s("portfolio","w2_desc","Рихтовка переднего бампера и правого крыла, покраска в цвет"),               before: s("portfolio","w2_problem","Удар в правую переднюю часть"),      result: s("portfolio","w2_result","Идеальное совпадение цвета, следов не видно") },
    { id: 3, title: s("portfolio","w3_title","Ремонт подвески Kia Sportage"),  category: s("portfolio","w3_cat","Ходовая"),   desc: s("portfolio","w3_desc","Замена передних стоек, шаровых опор, тяг стабилизатора"),                     before: s("portfolio","w3_problem","Стуки при езде, плохая управляемость"), result: s("portfolio","w3_result","Плавный ход, устранены все посторонние звуки") },
    { id: 4, title: s("portfolio","w4_title","Электрика Ford Focus 3"),        category: s("portfolio","w4_cat","Электрика"), desc: s("portfolio","w4_desc","Диагностика и ремонт системы зажигания, замена свечей и катушки"),            before: s("portfolio","w4_problem","Троит двигатель, горит Check Engine"), result: s("portfolio","w4_result","Стабильная работа двигателя, ошибки устранены") },
    { id: 5, title: s("portfolio","w5_title","ТО Hyundai Tucson"),             category: s("portfolio","w5_cat","ТО"),        desc: s("portfolio","w5_desc","Полное ТО по регламенту: масло, фильтры, тормозные колодки"),                  before: s("portfolio","w5_problem","Плановое обслуживание"),              result: s("portfolio","w5_result","Все жидкости заменены, система тормозов проверена") },
    { id: 6, title: s("portfolio","w6_title","Замена ДВС Nissan X-Trail"),     category: s("portfolio","w6_cat","Двигатель"), desc: s("portfolio","w6_desc","Снятие и установка контрактного двигателя с полной обвязкой"),               before: s("portfolio","w6_problem","Гидроудар, полный выход из строя"),   result: s("portfolio","w6_result","Автомобиль на ходу, контрактный двигатель с гарантией") },
  ];

  const filtered = activeFilter === "Все" ? works : works.filter((w) => w.category === activeFilter);

  return (
    <div className="animate-fade-in">
      <div className="border-b border-border">
        <div className="container mx-auto py-3 flex items-center gap-2 text-xs text-muted-foreground">
          <button onClick={() => onNavigate("home")} className="hover:text-foreground transition-colors font-display uppercase tracking-wide">Главная</button>
          <Icon name="ChevronRight" size={12} />
          <span className="text-foreground font-display uppercase tracking-wide">Портфолио</span>
        </div>
      </div>

      <div className="bg-card border-b border-border py-12">
        <div className="container mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <div className="red-line" />
            <span className="label-tag">Наши работы</span>
          </div>
          <h1 className="font-display font-bold text-4xl lg:text-5xl uppercase mb-3">
            {s("portfolio","page_title","Портфолио")}
          </h1>
          <p className="text-muted-foreground text-sm max-w-lg">
            {s("portfolio","page_subtitle","Примеры выполненных работ — реальные случаи от наших мастеров")}
          </p>
        </div>
      </div>

      <div className="container mx-auto section-py">
        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-10">
          {filterCats.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveFilter(cat)}
              className={`font-display text-xs tracking-widest uppercase px-5 py-2 border transition-colors ${
                activeFilter === cat
                  ? "bg-primary border-primary text-white"
                  : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((work) => (
            <div key={work.id} className="card-dark overflow-hidden group">
              <div className="aspect-video bg-gradient-to-br from-secondary to-background flex items-center justify-center relative">
                <Icon name="Car" size={48} className="text-muted-foreground/15 group-hover:scale-105 transition-transform duration-300" />
                <div className="absolute top-3 left-3 bg-primary px-2.5 py-0.5">
                  <span className="text-white text-[10px] font-display font-bold tracking-widest uppercase">{work.category}</span>
                </div>
              </div>
              <div className="p-5">
                <h3 className="font-display font-bold text-sm uppercase tracking-wide mb-3">{work.title}</h3>
                <p className="text-xs text-muted-foreground mb-4 leading-relaxed">{work.desc}</p>
                <div className="space-y-2 pt-3 border-t border-border">
                  <div className="flex items-start gap-2 text-xs">
                    <span className="text-muted-foreground/60 shrink-0 w-16">Проблема:</span>
                    <span className="text-muted-foreground">{work.before}</span>
                  </div>
                  <div className="flex items-start gap-2 text-xs">
                    <span className="text-primary shrink-0 w-16 font-semibold">Результат:</span>
                    <span className="text-muted-foreground">{work.result}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-12 text-center">
          <p className="text-muted-foreground text-sm mb-5">
            {s("portfolio","cta_text","Нужен ремонт? Запишитесь онлайн прямо сейчас")}
          </p>
          <button onClick={() => onNavigate("booking")} className="btn-red">
            <Icon name="CalendarCheck" size={16} />
            Записаться на ремонт
          </button>
        </div>
      </div>
    </div>
  );
}
