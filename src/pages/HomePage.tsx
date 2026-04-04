import Icon from "@/components/ui/icon";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { useSiteSettings } from "@/context/SiteSettingsContext";

const HERO_IMG = "https://cdn.poehali.dev/projects/6ac06d75-10c8-4905-8743-acae4c622e9a/files/2b548611-c899-4a89-b26f-7fb55a5fe719.jpg";
const ENGINE_IMG = "https://cdn.poehali.dev/projects/6ac06d75-10c8-4905-8743-acae4c622e9a/files/40f7e6dd-85e7-4567-b817-ddc29b084b62.jpg";
const CLUB_IMG = "https://cdn.poehali.dev/projects/6ac06d75-10c8-4905-8743-acae4c622e9a/files/ef0c3cfa-d990-49c5-a7c2-e939db2733c7.jpg";

const services = [
  { icon: "Wrench", title: "Диагностика", desc: "Компьютерная диагностика всех систем автомобиля" },
  { icon: "Settings", title: "Ремонт двигателя", desc: "Капитальный и текущий ремонт любых двигателей" },
  { icon: "Droplets", title: "Замена масла", desc: "ТО и плановая замена технических жидкостей" },
  { icon: "Circle", title: "Шиномонтаж", desc: "Балансировка, шиномонтаж, хранение шин" },
  { icon: "Car", title: "Кузовной ремонт", desc: "Рихтовка, покраска, антикоррозийная обработка" },
  { icon: "Zap", title: "Электрика авто", desc: "Ремонт и диагностика электрооборудования" },
];

const stats = [
  { val: "15+", label: "лет опыта" },
  { val: "2 СТО", label: "в Иркутске" },
  { val: "30 000+", label: "довольных клиентов" },
  { val: "500+", label: "марок авто" },
];

const reviews = [
  { name: "Алексей К.", car: "BMW 5 Series", text: "Отличный сервис, сделали всё быстро и качественно. Клубная карта реально даёт скидки.", stars: 5 },
  { name: "Марина С.", car: "Toyota Camry", text: "Записалась онлайн, приехала — всё чётко по времени. Мастера вежливые, объяснили что делали.", stars: 5 },
  { name: "Дмитрий П.", car: "Kia Rio", text: "Делаю ТО только здесь уже 4 года. Цены адекватные, работа сделана на совесть.", stars: 5 },
];

interface HomePageProps {
  onNavigate: (p: string) => void;
}

export default function HomePage({ onNavigate }: HomePageProps) {
  const { guard } = useAuthGuard();
  const { s } = useSiteSettings();

  const heroImg  = s("home","hero_image",  HERO_IMG);
  const clubImg  = s("home","club_image",  CLUB_IMG);
  const dynStats = [
    { val: s("home","stat1_val","15+"),     label: s("home","stat1_label","лет опыта") },
    { val: s("home","stat2_val","2 СТО"),   label: s("home","stat2_label","в Иркутске") },
    { val: s("home","stat3_val","30 000+"), label: s("home","stat3_label","довольных клиентов") },
    { val: s("home","stat4_val","500+"),    label: s("home","stat4_label","марок авто") },
  ];

  return (
    <div className="animate-fade-in">
      {/* HERO */}
      <section className="relative min-h-[580px] lg:min-h-[680px] flex items-center overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${heroImg})` }} />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/85 to-background/30" />
        <div className="absolute inset-0 stripe-bg opacity-30" />

        <div className="relative container mx-auto py-20">
          <div className="max-w-xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="red-line" />
              <span className="label-tag text-primary">Профессиональный автосервис Иркутск</span>
            </div>
            <h1 className="font-display font-bold text-5xl lg:text-7xl text-foreground leading-none mb-5 uppercase tracking-wider">
              {s("home","hero_title","DD MAXI").split(" ").map((w,i) => i===0 ? <span key={i}>{w}<span className="text-primary"> </span></span> : <span key={i} className="text-primary">{w}</span>)}
            </h1>
            <p className="text-muted-foreground text-base mb-2 font-light leading-relaxed">
              {s("home","hero_subtitle","Ремонт и обслуживание автомобилей любых марок")}
            </p>
            <p className="text-sm text-muted-foreground/60 mb-10 leading-relaxed max-w-sm">
              {s("home","hero_description","Более 15 лет на рынке. Гарантия на все виды работ. Клубная карта скидок для постоянных клиентов.")}
            </p>
            <div className="flex flex-wrap gap-4">
              <button onClick={() => guard(() => onNavigate("booking"))} className="btn-red">
                <Icon name="CalendarCheck" size={16} />
                Записаться на ремонт
              </button>
              <button onClick={() => onNavigate("services")} className="btn-ghost">
                <Icon name="List" size={16} />
                Все услуги
              </button>
            </div>
          </div>
        </div>

        <div className="absolute right-8 bottom-8 hidden xl:flex">
          <div className="card-dark p-5 flex items-center gap-4 border-l-2 border-l-primary">
            <div className="w-10 h-10 bg-primary/10 flex items-center justify-center">
              <Icon name="Phone" size={20} className="text-primary" />
            </div>
            <div>
              <div className="font-display font-bold text-lg tracking-wide">+7 (3952) 00-00-00</div>
              <div className="label-tag">Пн–Сб 9:00–21:00</div>
            </div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <div className="bg-primary">
        <div className="container mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-white/20">
            {dynStats.map((st) => (
              <div key={st.label} className="text-center px-6 py-5">
                <div className="font-display font-bold text-3xl text-white">{st.val}</div>
                <div className="text-white/60 text-[10px] tracking-widest uppercase mt-1">{st.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SERVICES */}
      <section className="section-py">
        <div className="container mx-auto">
          <div className="flex items-end justify-between flex-wrap gap-4 mb-12">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="red-line" />
                <span className="label-tag">Что мы делаем</span>
              </div>
              <h2 className="font-display font-bold text-3xl lg:text-4xl uppercase">Наши услуги</h2>
            </div>
            <button onClick={() => onNavigate("services")} className="btn-ghost text-xs py-2 px-5">
              Полный список →
            </button>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {services.map((s) => (
              <div
                key={s.title}
                className="card-dark p-6 cursor-pointer group"
                onClick={() => onNavigate("services")}
              >
                <div className="w-12 h-12 bg-primary/10 border border-primary/20 flex items-center justify-center mb-5 group-hover:bg-primary group-hover:border-primary transition-all duration-300">
                  <Icon name={s.icon as "Wrench"} size={22} className="text-primary group-hover:text-white transition-colors duration-300" />
                </div>
                <h3 className="font-display font-bold text-base uppercase mb-2">{s.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
                <div className="flex items-center gap-2 mt-5 text-primary text-xs font-display font-semibold tracking-widest uppercase opacity-0 group-hover:opacity-100 transition-opacity">
                  Подробнее <Icon name="ArrowRight" size={12} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BOOKING CTA */}
      <section className="bg-primary relative overflow-hidden">
        <div className="absolute inset-0 stripe-bg opacity-25" />
        <div className="relative container mx-auto py-16">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-0.5 bg-white/40" />
                <span className="label-tag text-white/60">Онлайн-запись</span>
              </div>
              <h2 className="font-display font-bold text-3xl lg:text-5xl text-white uppercase leading-tight mb-4">
                {s("home","cta_title","Запишитесь прямо сейчас")}
              </h2>
              <p className="text-white/70 text-sm leading-relaxed mb-8 max-w-sm">
                {s("home","cta_subtitle","Оставьте заявку — мы перезвоним в течение 15 минут и согласуем удобное время")}
              </p>
              <div className="flex flex-wrap gap-3">
                <button onClick={() => guard(() => onNavigate("booking"))} className="bg-white text-primary font-display font-bold text-sm tracking-widest uppercase px-8 py-3 hover:bg-white/90 transition-colors">
                  Записаться
                </button>
                <a href="tel:+73952000000" className="btn-ghost border-white/40 text-white hover:bg-white/10 hover:border-white hover:text-white">
                  <Icon name="Phone" size={14} />
                  Позвонить
                </a>
              </div>
            </div>
            <div className="hidden lg:grid grid-cols-2 gap-3">
              {[
                { icon: "Clock", text: "Ответ за 15 минут" },
                { icon: "CalendarCheck", text: "Удобное время" },
                { icon: "Shield", text: "Гарантия на работы" },
                { icon: "Star", text: "Скидка по клубной карте" },
              ].map((f) => (
                <div key={f.text} className="bg-white/10 border border-white/20 p-4 flex items-center gap-3">
                  <Icon name={f.icon as "Clock"} size={18} className="text-white/70 shrink-0" />
                  <span className="text-white/80 text-sm">{f.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CLUB PROMO */}
      <section className="section-py">
        <div className="container mx-auto">
          <div className="grid lg:grid-cols-2 gap-14 items-center">
            <div className="relative">
              <div className="aspect-[4/3] overflow-hidden">
                <img src={clubImg} alt="Клубная карта DD MAXI" className="w-full h-full object-cover" />
              </div>
              <div className="absolute -top-4 -right-4 hidden lg:flex flex-col items-center justify-center w-24 h-24 bg-primary">
                <span className="font-display font-black text-2xl text-white leading-none">10%</span>
                <span className="text-white/70 text-[9px] tracking-widest uppercase text-center mt-1">скидка</span>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="red-line" />
                <span className="label-tag">Программа лояльности</span>
              </div>
              <h2 className="font-display font-bold text-3xl lg:text-4xl uppercase mb-5 leading-tight">
                {s("home","club_title","Клуб DD MAXI")}
              </h2>
              <p className="text-muted-foreground text-sm leading-relaxed mb-6">
                {s("home","club_description","Оформите клубную карту и получайте скидки до 10% на все виды услуг. Накапливайте бонусы и обменивайте их на обслуживание автомобиля.")}
              </p>
              <div className="space-y-3 mb-8">
                {[
                  "Скидка до 10% на все услуги",
                  "Накопление бонусных баллов",
                  "Приоритетная запись без очереди",
                  "Специальные предложения для членов клуба",
                  "Личный кабинет с историей обслуживания",
                ].map((b) => (
                  <div key={b} className="flex items-center gap-3 text-sm">
                    <div className="w-5 h-5 bg-primary/10 border border-primary/30 flex items-center justify-center shrink-0">
                      <Icon name="Check" size={11} className="text-primary" />
                    </div>
                    {b}
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-3">
                <button onClick={() => guard(() => onNavigate("club"))} className="btn-red">
                  Получить карту клуба
                </button>
                <button onClick={() => onNavigate("club")} className="btn-ghost">
                  Подробнее →
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ABOUT BRIEF */}
      <section className="bg-card border-y border-border">
        <div className="container mx-auto section-py">
          <div className="grid lg:grid-cols-2 gap-14 items-center">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="red-line" />
                <span className="label-tag">О компании</span>
              </div>
              <h2 className="font-display font-bold text-3xl lg:text-4xl uppercase mb-5 leading-tight">
                Почему выбирают<br/>DD MAXI
              </h2>
              <p className="text-muted-foreground text-sm leading-relaxed mb-8">
                Работаем с 2009 года. Наши мастера прошли обучение у официальных дилеров и используют только сертифицированные запчасти и расходники.
              </p>
              <div className="grid grid-cols-2 gap-4 mb-8">
                {[
                  { icon: "Award", text: "Гарантия на все работы" },
                  { icon: "Users", text: "Опытные мастера" },
                  { icon: "Package", text: "Оригинальные запчасти" },
                  { icon: "Zap", text: "Быстрая диагностика" },
                ].map((f) => (
                  <div key={f.text} className="flex items-center gap-3 text-sm font-medium">
                    <Icon name={f.icon as "Award"} size={16} className="text-primary shrink-0" />
                    {f.text}
                  </div>
                ))}
              </div>
              <button onClick={() => onNavigate("about")} className="btn-ghost">
                О компании →
              </button>
            </div>
            <div className="relative overflow-hidden">
              <img src={ENGINE_IMG} alt="Двигатель" className="w-full aspect-[4/3] object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-background/50 to-transparent" />
            </div>
          </div>
        </div>
      </section>

      {/* REVIEWS */}
      <section className="section-py">
        <div className="container mx-auto">
          <div className="flex items-center gap-4 mb-12">
            <div className="red-line" />
            <div>
              <span className="label-tag">Что говорят клиенты</span>
              <h2 className="font-display font-bold text-3xl uppercase mt-1">Отзывы</h2>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {reviews.map((r) => (
              <div key={r.name} className="card-dark p-6 flex flex-col">
                <div className="flex items-center gap-1 mb-5">
                  {[1,2,3,4,5].map((s) => (
                    <Icon key={s} name="Star" size={13} className="text-primary fill-primary" />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed flex-1 mb-5 italic">«{r.text}»</p>
                <div className="border-t border-border pt-4 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold">{r.name}</div>
                    <div className="label-tag mt-0.5">{r.car}</div>
                  </div>
                  <div className="w-8 h-8 bg-primary/10 flex items-center justify-center">
                    <Icon name="User" size={14} className="text-primary" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}