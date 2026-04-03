import Icon from "@/components/ui/icon";

const HERO_IMG = "https://cdn.poehali.dev/projects/6ac06d75-10c8-4905-8743-acae4c622e9a/files/2b548611-c899-4a89-b26f-7fb55a5fe719.jpg";

const milestones = [
  { year: "2009", text: "Открытие первой станции технического обслуживания в Иркутске" },
  { year: "2013", text: "Запуск программы лояльности — клубная карта DD MAXI" },
  { year: "2017", text: "Открытие второй СТО на ул. Верхоленская" },
  { year: "2020", text: "Более 20 000 клиентов в базе. Расширение перечня услуг" },
  { year: "2024", text: "30 000+ довольных клиентов. Работаем в нескольких регионах" },
];

const values = [
  { icon: "Shield", title: "Гарантия качества", desc: "Даём гарантию на все виды выполненных работ" },
  { icon: "Clock", title: "Соблюдение сроков", desc: "Делаем работу в срок — уважаем ваше время" },
  { icon: "Package", title: "Оригинальные запчасти", desc: "Только сертифицированные детали от проверенных поставщиков" },
  { icon: "Headphones", title: "Поддержка клиентов", desc: "Отвечаем на вопросы до и после обслуживания" },
];

interface AboutPageProps {
  onNavigate: (p: string) => void;
}

export default function AboutPage({ onNavigate }: AboutPageProps) {
  return (
    <div className="animate-fade-in">
      <div className="border-b border-border">
        <div className="container mx-auto py-3 flex items-center gap-2 text-xs text-muted-foreground">
          <button onClick={() => onNavigate("home")} className="hover:text-foreground transition-colors font-display uppercase tracking-wide">Главная</button>
          <Icon name="ChevronRight" size={12} />
          <span className="text-foreground font-display uppercase tracking-wide">О компании</span>
        </div>
      </div>

      {/* Hero */}
      <section className="relative h-72 lg:h-96 flex items-end overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${HERO_IMG})` }} />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        <div className="relative container mx-auto pb-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="red-line" />
            <span className="label-tag">О компании</span>
          </div>
          <h1 className="font-display font-bold text-4xl lg:text-5xl uppercase leading-tight">DD MAXI</h1>
        </div>
      </section>

      {/* Mission */}
      <section className="container mx-auto section-py">
        <div className="grid lg:grid-cols-2 gap-14 items-start">
          <div>
            <h2 className="font-display font-bold text-3xl uppercase mb-6 leading-tight">
              Надёжный автосервис<br/>с 2009 года
            </h2>
            <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
              <p>
                DD MAXI — это профессиональная сеть станций технического обслуживания автомобилей в Иркутске. Мы специализируемся на комплексном обслуживании и ремонте автомобилей всех марок и моделей.
              </p>
              <p>
                За годы работы мы накопили огромный опыт и создали слаженную команду профессиональных мастеров, каждый из которых — специалист в своей области. Мы постоянно проходим обучение и следим за новинками в автомобильной индустрии.
              </p>
              <p>
                Наша главная ценность — доверие клиентов. Именно поэтому мы всегда честны в оценке стоимости работ, соблюдаем сроки и даём гарантию на выполненные работы.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {[
              { val: "15+", label: "лет на рынке" },
              { val: "2", label: "станции в Иркутске" },
              { val: "30 000+", label: "обслуженных клиентов" },
              { val: "98%", label: "возвращаются снова" },
            ].map((s) => (
              <div key={s.label} className="card-dark p-5 flex items-center gap-5 border-l-2 border-l-primary">
                <div className="font-display font-bold text-3xl text-primary w-24 shrink-0">{s.val}</div>
                <div className="text-sm text-muted-foreground">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="bg-card border-y border-border">
        <div className="container mx-auto section-py">
          <div className="flex items-center gap-3 mb-10">
            <div className="red-line" />
            <h2 className="font-display font-bold text-3xl uppercase">Наши принципы</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {values.map((v) => (
              <div key={v.title} className="card-dark p-6">
                <div className="w-12 h-12 bg-primary/10 border border-primary/20 flex items-center justify-center mb-5">
                  <Icon name={v.icon as "Shield"} size={22} className="text-primary" />
                </div>
                <h3 className="font-display font-bold text-sm uppercase mb-2 tracking-wide">{v.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="container mx-auto section-py">
        <div className="flex items-center gap-3 mb-10">
          <div className="red-line" />
          <h2 className="font-display font-bold text-3xl uppercase">История компании</h2>
        </div>
        <div className="max-w-2xl relative">
          <div className="absolute left-16 top-0 bottom-0 w-px bg-border" />
          <div className="space-y-0">
            {milestones.map((m, i) => (
              <div key={m.year} className="flex gap-6 items-start" style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="w-16 shrink-0 text-right pt-1">
                  <span className="font-display font-bold text-sm text-primary">{m.year}</span>
                </div>
                <div className="relative pl-6 pb-8">
                  <div className="absolute left-0 top-1.5 w-3 h-3 border-2 border-primary bg-background rounded-full" />
                  <p className="text-sm text-muted-foreground leading-relaxed">{m.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary relative overflow-hidden">
        <div className="absolute inset-0 stripe-bg opacity-20" />
        <div className="relative container mx-auto py-14 text-center">
          <h2 className="font-display font-bold text-3xl lg:text-4xl text-white uppercase mb-4">
            Доверьте свой автомобиль профессионалам
          </h2>
          <p className="text-white/70 text-sm mb-8 max-w-md mx-auto">
            Записывайтесь онлайн или звоните — ответим и поможем
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <button onClick={() => onNavigate("booking")} className="bg-white text-primary font-display font-bold text-sm tracking-widest uppercase px-8 py-3 hover:bg-white/90 transition-colors">
              Записаться на ремонт
            </button>
            <button onClick={() => onNavigate("contacts")} className="btn-ghost border-white/40 text-white hover:bg-white/10 hover:border-white hover:text-white">
              Контакты
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
