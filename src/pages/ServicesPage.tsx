import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { useSiteSettings } from "@/context/SiteSettingsContext";
import { useAuth } from "@/context/AuthContext";

const PACKAGES_URL = "https://functions.poehali.dev/4751dd0c-bf65-4377-a597-d9d580f4308d";
const WALLET_URL   = "https://functions.poehali.dev/686b24a0-6c64-41f9-8ff3-a7a49d17304b";

const CAT_ICONS = ["Cpu", "Settings", "Circle", "Car", "RefreshCw", "Zap"];

interface Package {
  id: number;
  title: string;
  description: string;
  items: string[];
  price: number;
  duration: string;
  category: string;
}

interface ServicesPageProps {
  onNavigate: (p: string) => void;
}

export default function ServicesPage({ onNavigate }: ServicesPageProps) {
  const { s } = useSiteSettings();
  const { user, token } = useAuth();

  const [packages, setPackages]     = useState<Package[]>([]);
  const [pkgLoading, setPkgLoading] = useState(true);
  const [selected, setSelected]     = useState<Package | null>(null);
  const [balance, setBalance]       = useState<number | null>(null);
  const [processing, setProcessing] = useState(false);
  const [payMethod, setPayMethod]   = useState<"wallet" | "card">("wallet");
  const [msg, setMsg]               = useState("");

  useEffect(() => {
    fetch(`${PACKAGES_URL}?action=list`)
      .then(r => r.json())
      .then(d => setPackages(d.packages || []))
      .finally(() => setPkgLoading(false));
  }, []);

  useEffect(() => {
    if (!token) return;
    fetch(`${WALLET_URL}?action=balance`, { headers: { "X-Auth-Token": token } })
      .then(r => r.json())
      .then(d => { if (d.balance !== undefined) setBalance(d.balance); });
  }, [token]);

  const openModal = (pkg: Package) => {
    setSelected(pkg);
    setMsg("");
    setPayMethod("wallet");
  };

  const handleBuyWallet = async () => {
    if (!user || !token) { onNavigate("login"); return; }
    if (!selected) return;
    setProcessing(true); setMsg("");
    try {
      const r = await fetch(`${WALLET_URL}?action=pay_service`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Auth-Token": token },
        body: JSON.stringify({ amount: selected.price, description: selected.title }),
      });
      const d = await r.json();
      if (r.ok) {
        setBalance(d.balance_after ?? null);
        setMsg(`✓ Оплачено! Запишитесь на удобное время.`);
      } else {
        setMsg(d.error || "Ошибка оплаты");
      }
    } finally { setProcessing(false); }
  };

  const categories = [
    { title: s("services","cat1_name","Диагностика"), icon: CAT_ICONS[0], services: [
      { name: s("services","cat1_s1_name","Компьютерная диагностика двигателя"), price: s("services","cat1_s1_price","от 500 ₽") },
      { name: s("services","cat1_s2_name","Диагностика ходовой части"),           price: s("services","cat1_s2_price","от 700 ₽") },
      { name: s("services","cat1_s3_name","Диагностика электрооборудования"),     price: s("services","cat1_s3_price","от 600 ₽") },
      { name: s("services","cat1_s4_name","Диагностика тормозной системы"),       price: s("services","cat1_s4_price","от 400 ₽") },
    ]},
    { title: s("services","cat2_name","Двигатель"), icon: CAT_ICONS[1], services: [
      { name: s("services","cat2_s1_name","Замена ремня ГРМ"),            price: s("services","cat2_s1_price","от 2 500 ₽") },
      { name: s("services","cat2_s2_name","Замена масла и фильтра"),       price: s("services","cat2_s2_price","от 800 ₽") },
      { name: s("services","cat2_s3_name","Ремонт системы охлаждения"),    price: s("services","cat2_s3_price","от 1 500 ₽") },
      { name: s("services","cat2_s4_name","Капитальный ремонт двигателя"), price: s("services","cat2_s4_price","от 30 000 ₽") },
    ]},
    { title: s("services","cat3_name","Ходовая часть"), icon: CAT_ICONS[2], services: [
      { name: s("services","cat3_s1_name","Замена амортизаторов"),         price: s("services","cat3_s1_price","от 1 200 ₽") },
      { name: s("services","cat3_s2_name","Замена шаровых опор"),          price: s("services","cat3_s2_price","от 800 ₽") },
      { name: s("services","cat3_s3_name","Замена тормозных колодок"),     price: s("services","cat3_s3_price","от 700 ₽") },
      { name: s("services","cat3_s4_name","Сход-развал"),                  price: s("services","cat3_s4_price","от 1 000 ₽") },
    ]},
    { title: s("services","cat4_name","Кузов"), icon: CAT_ICONS[3], services: [
      { name: s("services","cat4_s1_name","Рихтовка и покраска элементов"), price: s("services","cat4_s1_price","от 3 000 ₽") },
      { name: s("services","cat4_s2_name","Антикоррозийная обработка"),     price: s("services","cat4_s2_price","от 5 000 ₽") },
      { name: s("services","cat4_s3_name","Полировка кузова"),              price: s("services","cat4_s3_price","от 2 500 ₽") },
      { name: s("services","cat4_s4_name","Замена стёкол"),                 price: s("services","cat4_s4_price","от 1 500 ₽") },
    ]},
    { title: s("services","cat5_name","Шины"), icon: CAT_ICONS[4], services: [
      { name: s("services","cat5_s1_name","Шиномонтаж R13–R20"),           price: s("services","cat5_s1_price","от 300 ₽/шт") },
      { name: s("services","cat5_s2_name","Балансировка колёс"),            price: s("services","cat5_s2_price","от 200 ₽/шт") },
      { name: s("services","cat5_s3_name","Сезонное хранение шин"),        price: s("services","cat5_s3_price","от 2 000 ₽") },
      { name: s("services","cat5_s4_name","Ремонт прокола"),               price: s("services","cat5_s4_price","от 300 ₽") },
    ]},
    { title: s("services","cat6_name","Электрика"), icon: CAT_ICONS[5], services: [
      { name: s("services","cat6_s1_name","Замена аккумулятора"),          price: s("services","cat6_s1_price","от 500 ₽") },
      { name: s("services","cat6_s2_name","Ремонт генератора"),            price: s("services","cat6_s2_price","от 2 000 ₽") },
      { name: s("services","cat6_s3_name","Замена стартера"),              price: s("services","cat6_s3_price","от 1 500 ₽") },
      { name: s("services","cat6_s4_name","Установка сигнализации"),       price: s("services","cat6_s4_price","от 3 000 ₽") },
    ]},
  ];

  const hasEnough = balance !== null && selected !== null && balance >= selected.price;
  const shortage  = selected && balance !== null ? Math.max(0, selected.price - balance) : 0;

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

      <div className="container mx-auto section-py space-y-16">

        {/* --- Комплексы услуг --- */}
        <div>
          <div className="flex items-center gap-3 mb-8">
            <div className="red-line" />
            <h2 className="font-display font-bold text-2xl uppercase tracking-wide">Комплексы услуг</h2>
          </div>

          {pkgLoading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {[1,2,3,4].map(i => (
                <div key={i} className="card-dark animate-pulse h-64" />
              ))}
            </div>
          ) : packages.length === 0 ? (
            <p className="text-muted-foreground text-sm">Комплексы пока не добавлены</p>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {packages.map(pkg => (
                <div key={pkg.id} className="card-dark flex flex-col group hover:border-primary/40 transition-colors">
                  <div className="border-b border-border px-5 py-4 flex items-start justify-between gap-2">
                    <div>
                      <div className="label-tag mb-1">{pkg.category}</div>
                      <h3 className="font-display font-bold text-sm uppercase tracking-wide leading-tight">{pkg.title}</h3>
                    </div>
                    {pkg.duration && (
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground shrink-0">
                        <Icon name="Clock" size={10} />
                        {pkg.duration}
                      </div>
                    )}
                  </div>
                  <div className="p-5 flex-1 flex flex-col">
                    {pkg.description && (
                      <p className="text-xs text-muted-foreground mb-4 leading-relaxed">{pkg.description}</p>
                    )}
                    <ul className="space-y-1.5 flex-1 mb-5">
                      {pkg.items.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                          <Icon name="Check" size={11} className="text-primary shrink-0 mt-0.5" />
                          {item}
                        </li>
                      ))}
                    </ul>
                    <div className="flex items-center justify-between gap-3 pt-4 border-t border-border">
                      <span className="font-display font-bold text-lg text-primary">
                        {pkg.price.toLocaleString("ru-RU")} ₽
                      </span>
                      <button
                        onClick={() => openModal(pkg)}
                        className="btn-red text-xs py-2 px-4"
                      >
                        Выбрать
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* --- Отдельные услуги по категориям --- */}
        <div>
          <div className="flex items-center gap-3 mb-8">
            <div className="red-line" />
            <h2 className="font-display font-bold text-2xl uppercase tracking-wide">Отдельные услуги</h2>
          </div>
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
            {categories.map((cat) => (
              <div key={cat.title} className="card-dark">
                <div className="border-b border-border px-6 py-4 flex items-center gap-3">
                  <Icon name={cat.icon as "Cpu"} size={18} className="text-primary" />
                  <h3 className="font-display font-bold text-base uppercase tracking-wide">{cat.title}</h3>
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
        </div>

        {/* CTA */}
        <div className="bg-primary relative overflow-hidden">
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

      {/* Modal — выбор и оплата комплекса */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setSelected(null)}>
          <div className="card-dark w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-start justify-between gap-4 p-6 border-b border-border">
              <div>
                <div className="label-tag mb-1">{selected.category}</div>
                <h3 className="font-display font-bold text-lg uppercase">{selected.title}</h3>
                {selected.duration && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                    <Icon name="Clock" size={12} />
                    {selected.duration}
                  </div>
                )}
              </div>
              <button onClick={() => setSelected(null)} className="text-muted-foreground hover:text-foreground transition-colors shrink-0 p-1">
                <Icon name="X" size={18} />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Description */}
              {selected.description && (
                <p className="text-sm text-muted-foreground leading-relaxed">{selected.description}</p>
              )}

              {/* Items */}
              <div>
                <div className="label-tag mb-3">Входит в комплекс:</div>
                <ul className="space-y-2">
                  {selected.items.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <Icon name="Check" size={13} className="text-primary shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Price */}
              <div className="flex items-center justify-between py-3 border-y border-border">
                <span className="label-tag">Стоимость</span>
                <span className="font-display font-bold text-2xl text-primary">{selected.price.toLocaleString("ru-RU")} ₽</span>
              </div>

              {/* Not logged in */}
              {!user ? (
                <button onClick={() => { setSelected(null); onNavigate("login"); }} className="btn-red w-full justify-center">
                  <Icon name="User" size={15} />
                  Войти для оплаты
                </button>
              ) : msg ? (
                <div className="space-y-3">
                  <div className={`p-4 text-sm font-medium ${msg.startsWith("✓") ? "bg-green-500/10 border border-green-500/30 text-green-400" : "bg-red-500/10 border border-red-500/30 text-red-400"}`}>
                    {msg}
                  </div>
                  {msg.startsWith("✓") && (
                    <button onClick={() => { setSelected(null); onNavigate("booking"); }} className="btn-red w-full justify-center">
                      <Icon name="CalendarCheck" size={15} />
                      Записаться на ремонт
                    </button>
                  )}
                  <button onClick={() => setMsg("")} className="btn-ghost w-full justify-center text-sm">
                    Назад
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Pay method */}
                  <div className="label-tag mb-2">Способ оплаты</div>
                  <div className="grid grid-cols-2 gap-3">
                    {/* Wallet */}
                    <button
                      onClick={() => setPayMethod("wallet")}
                      className={`p-3 border text-left transition-colors ${payMethod === "wallet" ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Icon name="Wallet" size={14} className="text-primary" />
                        <span className="font-display font-bold text-xs uppercase">Кошелёк</span>
                      </div>
                      {balance !== null ? (
                        <span className={`text-[11px] ${hasEnough ? "text-green-400" : "text-red-400"}`}>
                          {balance.toLocaleString("ru-RU")} ₽
                        </span>
                      ) : (
                        <span className="text-[11px] text-muted-foreground">Мгновенно</span>
                      )}
                    </button>
                    {/* Card */}
                    <button
                      onClick={() => setPayMethod("card")}
                      className={`p-3 border text-left transition-colors ${payMethod === "card" ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Icon name="CreditCard" size={14} className="text-primary" />
                        <span className="font-display font-bold text-xs uppercase">Карта</span>
                      </div>
                      <span className="text-[11px] text-muted-foreground">Visa, МИР</span>
                    </button>
                  </div>

                  {/* Wallet shortage warning */}
                  {payMethod === "wallet" && !hasEnough && balance !== null && (
                    <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 p-3">
                      Не хватает {shortage.toLocaleString("ru-RU")} ₽ —
                      <button onClick={() => { setSelected(null); onNavigate("account"); }} className="underline ml-1">пополнить кошелёк</button>
                    </div>
                  )}

                  {/* Action button */}
                  {payMethod === "wallet" ? (
                    <button
                      onClick={handleBuyWallet}
                      disabled={processing || !hasEnough}
                      className="btn-red w-full justify-center disabled:opacity-60"
                    >
                      {processing ? <><Icon name="Loader2" size={14} className="animate-spin" /> Оплачиваем...</> : `Оплатить ${selected.price.toLocaleString("ru-RU")} ₽ с кошелька`}
                    </button>
                  ) : (
                    <button
                      onClick={() => { setSelected(null); onNavigate("booking"); }}
                      className="btn-red w-full justify-center"
                    >
                      <Icon name="CalendarCheck" size={15} />
                      Записаться и оплатить картой
                    </button>
                  )}

                  <p className="text-[10px] text-muted-foreground/60 text-center">
                    Оплата при записи на ремонт — картой на месте или онлайн
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
