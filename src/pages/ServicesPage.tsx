import Icon from "@/components/ui/icon";

const categories = [
  {
    title: "Диагностика",
    icon: "Cpu",
    services: [
      { name: "Компьютерная диагностика двигателя", price: "от 500 ₽" },
      { name: "Диагностика ходовой части", price: "от 700 ₽" },
      { name: "Диагностика электрооборудования", price: "от 600 ₽" },
      { name: "Диагностика тормозной системы", price: "от 400 ₽" },
    ],
  },
  {
    title: "Двигатель",
    icon: "Settings",
    services: [
      { name: "Замена ремня ГРМ", price: "от 2 500 ₽" },
      { name: "Замена масла и фильтра", price: "от 800 ₽" },
      { name: "Ремонт системы охлаждения", price: "от 1 500 ₽" },
      { name: "Капитальный ремонт двигателя", price: "от 30 000 ₽" },
    ],
  },
  {
    title: "Ходовая часть",
    icon: "Circle",
    services: [
      { name: "Замена амортизаторов", price: "от 1 200 ₽" },
      { name: "Замена шаровых опор", price: "от 800 ₽" },
      { name: "Замена тормозных колодок", price: "от 700 ₽" },
      { name: "Сход-развал", price: "от 1 000 ₽" },
    ],
  },
  {
    title: "Кузов",
    icon: "Car",
    services: [
      { name: "Рихтовка и покраска элементов", price: "от 3 000 ₽" },
      { name: "Антикоррозийная обработка", price: "от 5 000 ₽" },
      { name: "Полировка кузова", price: "от 2 500 ₽" },
      { name: "Замена стёкол", price: "от 1 500 ₽" },
    ],
  },
  {
    title: "Шины",
    icon: "RefreshCw",
    services: [
      { name: "Шиномонтаж R13–R20", price: "от 300 ₽/шт" },
      { name: "Балансировка колёс", price: "от 200 ₽/шт" },
      { name: "Сезонное хранение шин", price: "от 2 000 ₽" },
      { name: "Ремонт прокола", price: "от 300 ₽" },
    ],
  },
  {
    title: "Электрика",
    icon: "Zap",
    services: [
      { name: "Замена аккумулятора", price: "от 500 ₽" },
      { name: "Ремонт генератора", price: "от 2 000 ₽" },
      { name: "Замена стартера", price: "от 1 500 ₽" },
      { name: "Установка сигнализации", price: "от 3 000 ₽" },
    ],
  },
];

interface ServicesPageProps {
  onNavigate: (p: string) => void;
}

export default function ServicesPage({ onNavigate }: ServicesPageProps) {
  return (
    <div className="animate-fade-in">
      <div className="border-b border-border">
        <div className="container mx-auto py-3 flex items-center gap-2 text-xs text-muted-foreground">
          <button onClick={() => onNavigate("home")} className="hover:text-foreground transition-colors font-display uppercase tracking-wide">Главная</button>
          <Icon name="ChevronRight" size={12} />
          <span className="text-foreground font-display uppercase tracking-wide">Услуги</span>
        </div>
      </div>

      <div className="bg-card border-b border-border py-12">
        <div className="container mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <div className="red-line" />
            <span className="label-tag">Что мы делаем</span>
          </div>
          <h1 className="font-display font-bold text-4xl lg:text-5xl uppercase mb-3">Полный список услуг</h1>
          <p className="text-muted-foreground text-sm max-w-lg">
            Ремонт и обслуживание автомобилей всех марок. Гарантия качества на все виды работ.
          </p>
        </div>
      </div>

      <div className="container mx-auto section-py">
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
          {categories.map((cat) => (
            <div key={cat.title} className="card-dark">
              <div className="border-b border-border px-6 py-4 flex items-center gap-3">
                <Icon name={cat.icon as "Cpu"} size={18} className="text-primary" />
                <h2 className="font-display font-bold text-base uppercase tracking-wide">{cat.title}</h2>
              </div>
              <div className="p-6">
                <ul className="space-y-3">
                  {cat.services.map((s) => (
                    <li key={s.name} className="flex items-center justify-between gap-4 text-sm">
                      <span className="text-muted-foreground flex-1">{s.name}</span>
                      <span className="text-primary font-display font-semibold text-xs tracking-wide shrink-0">{s.price}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 bg-primary relative overflow-hidden">
          <div className="absolute inset-0 stripe-bg opacity-20" />
          <div className="relative flex flex-col sm:flex-row items-center justify-between gap-6 px-8 py-8">
            <div>
              <h3 className="font-display font-bold text-xl text-white uppercase mb-1">Не нашли нужную услугу?</h3>
              <p className="text-white/70 text-sm">Позвоните нам — мы поможем и ответим на все вопросы</p>
            </div>
            <div className="flex gap-3 shrink-0">
              <button onClick={() => onNavigate("booking")} className="bg-white text-primary font-display font-bold text-sm tracking-widest uppercase px-6 py-3 hover:bg-white/90 transition-colors">
                Записаться
              </button>
              <a href="tel:+73952000000" className="btn-ghost border-white/40 text-white hover:bg-white/10 hover:border-white hover:text-white">
                <Icon name="Phone" size={14} />
                Позвонить
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
