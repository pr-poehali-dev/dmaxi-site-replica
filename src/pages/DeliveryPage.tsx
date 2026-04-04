import Icon from "@/components/ui/icon";
import { useSiteSettings } from "@/context/SiteSettingsContext";

const CLUB_IMG_DEFAULT = "https://cdn.poehali.dev/projects/6ac06d75-10c8-4905-8743-acae4c622e9a/files/ef0c3cfa-d990-49c5-a7c2-e939db2733c7.jpg";

const benefits = [
  { icon: "Percent", title: "Скидка до 10%", desc: "На все виды работ и услуг в наших СТО" },
  { icon: "Coins", title: "Бонусные баллы", desc: "Накапливайте баллы за каждое обслуживание" },
  { icon: "CalendarCheck", title: "Приоритетная запись", desc: "Без очереди — в удобное вам время" },
  { icon: "Bell", title: "Напоминания о ТО", desc: "Уведомим, когда пора на техобслуживание" },
  { icon: "Gift", title: "Специальные предложения", desc: "Акции и скидки только для членов клуба" },
  { icon: "User", title: "Личный кабинет", desc: "История обслуживания и бонусный счёт онлайн" },
];

const TIER_STYLES = [
  { color: "border-border",       badge: "bg-secondary text-muted-foreground", perks: ["Скидка 3% на услуги", "Базовое накопление баллов"] },
  { color: "border-gray-400",     badge: "bg-gray-600 text-white",             perks: ["Скидка 5% на услуги", "Ускоренное накопление", "Приоритетная запись"] },
  { color: "border-yellow-500",   badge: "bg-yellow-600 text-white",           perks: ["Скидка 10% на все", "Максимальное накопление", "VIP-запись", "Персональный менеджер"] },
];

interface ClubPageProps {
  onNavigate: (p: string) => void;
}

export default function DeliveryPage({ onNavigate }: ClubPageProps) {
  const { s } = useSiteSettings();

  const clubImg = s("club","hero_image", CLUB_IMG_DEFAULT);

  const tiers = [
    { name: s("club","tier1_name","Стандарт"), discount: s("club","tier1_discount","3%"), bonus: s("club","tier1_bonus","1 балл / 100 ₽"), ...TIER_STYLES[0] },
    { name: s("club","tier2_name","Серебро"),  discount: s("club","tier2_discount","5%"), bonus: s("club","tier2_bonus","1.5 балла / 100 ₽"), ...TIER_STYLES[1] },
    { name: s("club","tier3_name","Золото"),   discount: s("club","tier3_discount","10%"), bonus: s("club","tier3_bonus","2 балла / 100 ₽"), ...TIER_STYLES[2] },
  ];

  const steps = [
    { n: "01", title: s("club","step1_title","Заявка онлайн"), desc: s("club","step1_desc","Заполните форму на сайте или обратитесь на СТО") },
    { n: "02", title: s("club","step2_title","Первый визит"),  desc: s("club","step2_desc","Приедьте на обслуживание — карту оформят на месте") },
    { n: "03", title: s("club","step3_title","Активация"),     desc: s("club","step3_desc","Карта активируется автоматически после первого ТО") },
    { n: "04", title: s("club","step4_title","Пользуйтесь!"), desc: s("club","step4_desc","Скидки и баллы начисляются с первого визита") },
  ];

  return (
    <div className="animate-fade-in">
      <div className="border-b border-border">
        <div className="container mx-auto py-3 flex items-center gap-2 text-xs text-muted-foreground">
          <button onClick={() => onNavigate("home")} className="hover:text-foreground transition-colors font-display uppercase tracking-wide">Главная</button>
          <Icon name="ChevronRight" size={12} />
          <span className="text-foreground font-display uppercase tracking-wide">Клуб DD MAXI</span>
        </div>
      </div>

      {/* Hero */}
      <section className="bg-card border-b border-border">
        <div className="container mx-auto py-14">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="red-line" />
                <span className="label-tag">Программа лояльности</span>
              </div>
              <h1 className="font-display font-bold text-4xl lg:text-6xl uppercase mb-5 leading-tight">
                {s("club","page_title","Клуб DD MAXI")}
              </h1>
              <p className="text-muted-foreground text-sm leading-relaxed mb-8 max-w-md">
                {s("club","page_subtitle","Станьте членом нашего клуба и получайте эксклюзивные скидки, накапливайте бонусы и пользуйтесь привилегиями постоянного клиента.")}
              </p>
              <div className="flex flex-wrap gap-3">
                <button onClick={() => onNavigate("login")} className="btn-red">
                  <Icon name="CreditCard" size={16} />
                  Получить карту
                </button>
                <button onClick={() => onNavigate("login")} className="btn-ghost">
                  <Icon name="User" size={16} />
                  Личный кабинет
                </button>
              </div>
            </div>
            <div className="relative">
              <div className="aspect-[4/3] overflow-hidden">
                <img src={clubImg} alt="Клубная карта DD MAXI" className="w-full h-full object-cover" />
              </div>
              <div className="absolute -top-4 -right-4 hidden lg:flex flex-col items-center justify-center w-20 h-20 bg-primary">
                <span className="font-display font-black text-xl text-white">{s("club","tier3_discount","10%")}</span>
                <span className="text-white/70 text-[9px] tracking-widest uppercase text-center">скидка</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="container mx-auto section-py">
        <div className="flex items-center gap-3 mb-10">
          <div className="red-line" />
          <h2 className="font-display font-bold text-3xl uppercase">{s("club","benefits_title","Преимущества клуба")}</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {benefits.map((b) => (
            <div key={b.title} className="card-dark p-6 flex items-start gap-4">
              <div className="w-10 h-10 bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                <Icon name={b.icon as "Percent"} size={18} className="text-primary" />
              </div>
              <div>
                <h3 className="font-display font-bold text-sm uppercase tracking-wide mb-1">{b.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{b.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Tiers */}
      <section className="bg-card border-y border-border">
        <div className="container mx-auto section-py">
          <div className="flex items-center gap-3 mb-10">
            <div className="red-line" />
            <h2 className="font-display font-bold text-3xl uppercase">{s("club","tiers_title","Уровни карты")}</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-5">
            {tiers.map((tier, i) => (
              <div key={tier.name} className={`card-dark border-t-2 ${tier.color} p-6 ${i === 2 ? "ring-1 ring-primary/30" : ""}`}>
                <div className={`inline-block px-3 py-1 text-[10px] font-display font-bold tracking-widest uppercase mb-4 ${tier.badge}`}>
                  {tier.name}
                </div>
                <div className="font-display font-bold text-4xl text-foreground mb-1">{tier.discount}</div>
                <div className="label-tag mb-4">скидка на все услуги</div>
                <div className="text-xs text-muted-foreground mb-5">{tier.bonus}</div>
                <div className="border-t border-border pt-5 space-y-2">
                  {tier.perks.map((p) => (
                    <div key={p} className="flex items-center gap-2 text-xs">
                      <Icon name="Check" size={11} className="text-primary shrink-0" />
                      <span className="text-muted-foreground">{p}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How to get */}
      <section className="container mx-auto section-py">
        <div className="flex items-center gap-3 mb-10">
          <div className="red-line" />
          <h2 className="font-display font-bold text-3xl uppercase">{s("club","steps_title","Как получить карту")}</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step) => (
            <div key={step.n} className="text-center">
              <div className="font-display font-bold text-5xl text-border mb-3">{step.n}</div>
              <div className="font-display font-bold text-sm uppercase tracking-wide mb-2">{step.title}</div>
              <div className="text-xs text-muted-foreground leading-relaxed">{step.desc}</div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <button onClick={() => onNavigate("login")} className="btn-red">
            <Icon name="CreditCard" size={16} />
            Оформить карту клуба
          </button>
        </div>
      </section>
    </div>
  );
}
