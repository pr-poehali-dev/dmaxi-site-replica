import Icon from "@/components/ui/icon";
import { useSiteSettings } from "@/context/SiteSettingsContext";

const CAT_ICONS = ["Cpu", "Settings", "Circle", "Car", "RefreshCw", "Zap"];

interface ServicesPageProps {
  onNavigate: (p: string) => void;
}

export default function ServicesPage({ onNavigate }: ServicesPageProps) {
  const { s } = useSiteSettings();

  const categories = [
    {
      title: s("services","cat1_name","Диагностика"),
      icon: CAT_ICONS[0],
      services: [
        { name: s("services","cat1_s1_name","Компьютерная диагностика двигателя"), price: s("services","cat1_s1_price","от 500 ₽") },
        { name: s("services","cat1_s2_name","Диагностика ходовой части"),           price: s("services","cat1_s2_price","от 700 ₽") },
        { name: s("services","cat1_s3_name","Диагностика электрооборудования"),     price: s("services","cat1_s3_price","от 600 ₽") },
        { name: s("services","cat1_s4_name","Диагностика тормозной системы"),       price: s("services","cat1_s4_price","от 400 ₽") },
      ],
    },
    {
      title: s("services","cat2_name","Двигатель"),
      icon: CAT_ICONS[1],
      services: [
        { name: s("services","cat2_s1_name","Замена ремня ГРМ"),              price: s("services","cat2_s1_price","от 2 500 ₽") },
        { name: s("services","cat2_s2_name","Замена масла и фильтра"),         price: s("services","cat2_s2_price","от 800 ₽") },
        { name: s("services","cat2_s3_name","Ремонт системы охлаждения"),      price: s("services","cat2_s3_price","от 1 500 ₽") },
        { name: s("services","cat2_s4_name","Капитальный ремонт двигателя"),   price: s("services","cat2_s4_price","от 30 000 ₽") },
      ],
    },
    {
      title: s("services","cat3_name","Ходовая часть"),
      icon: CAT_ICONS[2],
      services: [
        { name: s("services","cat3_s1_name","Замена амортизаторов"),          price: s("services","cat3_s1_price","от 1 200 ₽") },
        { name: s("services","cat3_s2_name","Замена шаровых опор"),            price: s("services","cat3_s2_price","от 800 ₽") },
        { name: s("services","cat3_s3_name","Замена тормозных колодок"),       price: s("services","cat3_s3_price","от 700 ₽") },
        { name: s("services","cat3_s4_name","Сход-развал"),                    price: s("services","cat3_s4_price","от 1 000 ₽") },
      ],
    },
    {
      title: s("services","cat4_name","Кузов"),
      icon: CAT_ICONS[3],
      services: [
        { name: s("services","cat4_s1_name","Рихтовка и покраска элементов"), price: s("services","cat4_s1_price","от 3 000 ₽") },
        { name: s("services","cat4_s2_name","Антикоррозийная обработка"),      price: s("services","cat4_s2_price","от 5 000 ₽") },
        { name: s("services","cat4_s3_name","Полировка кузова"),               price: s("services","cat4_s3_price","от 2 500 ₽") },
        { name: s("services","cat4_s4_name","Замена стёкол"),                  price: s("services","cat4_s4_price","от 1 500 ₽") },
      ],
    },
    {
      title: s("services","cat5_name","Шины"),
      icon: CAT_ICONS[4],
      services: [
        { name: s("services","cat5_s1_name","Шиномонтаж R13–R20"),            price: s("services","cat5_s1_price","от 300 ₽/шт") },
        { name: s("services","cat5_s2_name","Балансировка колёс"),             price: s("services","cat5_s2_price","от 200 ₽/шт") },
        { name: s("services","cat5_s3_name","Сезонное хранение шин"),          price: s("services","cat5_s3_price","от 2 000 ₽") },
        { name: s("services","cat5_s4_name","Ремонт прокола"),                 price: s("services","cat5_s4_price","от 300 ₽") },
      ],
    },
    {
      title: s("services","cat6_name","Электрика"),
      icon: CAT_ICONS[5],
      services: [
        { name: s("services","cat6_s1_name","Замена аккумулятора"),            price: s("services","cat6_s1_price","от 500 ₽") },
        { name: s("services","cat6_s2_name","Ремонт генератора"),              price: s("services","cat6_s2_price","от 2 000 ₽") },
        { name: s("services","cat6_s3_name","Замена стартера"),                price: s("services","cat6_s3_price","от 1 500 ₽") },
        { name: s("services","cat6_s4_name","Установка сигнализации"),         price: s("services","cat6_s4_price","от 3 000 ₽") },
      ],
    },
  ];

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
          <h1 className="font-display font-bold text-4xl lg:text-5xl uppercase mb-3">
            {s("services","page_title","Полный список услуг")}
          </h1>
          <p className="text-muted-foreground text-sm max-w-lg">
            {s("services","page_subtitle","Ремонт и обслуживание автомобилей всех марок. Гарантия качества на все виды работ.")}
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
                  {cat.services.map((sv) => (
                    <li key={sv.name} className="flex items-center justify-between gap-4 text-sm">
                      <span className="text-muted-foreground flex-1">{sv.name}</span>
                      <span className="text-primary font-display font-semibold text-xs tracking-wide shrink-0">{sv.price}</span>
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
              <h3 className="font-display font-bold text-xl text-white uppercase mb-1">
                {s("services","cta_title","Не нашли нужную услугу?")}
              </h3>
              <p className="text-white/70 text-sm">
                {s("services","cta_subtitle","Позвоните нам — мы поможем и ответим на все вопросы")}
              </p>
            </div>
            <div className="flex gap-3 shrink-0">
              <button onClick={() => onNavigate("booking")} className="bg-white text-primary font-display font-bold text-sm tracking-widest uppercase px-6 py-3 hover:bg-white/90 transition-colors">
                Записаться
              </button>
              <a href={`tel:${s("general","phone","+73952000000").replace(/[^+\d]/g,"")}`} className="btn-ghost border-white/40 text-white hover:bg-white/10 hover:border-white hover:text-white">
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
