import { useState, useCallback, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { useAuth } from "@/context/AuthContext";
import PayMethodSelector from "@/components/PayMethodSelector";

const WALLET_URL = "https://functions.poehali.dev/686b24a0-6c64-41f9-8ff3-a7a49d17304b";

interface AutoGoodsPageProps { onNavigate: (p: string) => void; }

type PayMethod = "wallet" | "card";

interface AutoItem {
  id: string;
  category: string;
  name: string;
  brand: string;
  price: number;
  unit: string;
  inStock: boolean;
  desc: string;
  icon: string;
}

const AUTO_CATALOG: AutoItem[] = [
  { id: "oil-1",  category: "Масла и жидкости",  name: "Моторное масло 5W-30",            brand: "Mobil 1",       price: 2800,  unit: "4 л",    inStock: true,  desc: "Синтетическое моторное масло для бензиновых и дизельных двигателей",          icon: "Droplets" },
  { id: "oil-2",  category: "Масла и жидкости",  name: "Моторное масло 5W-40",            brand: "Castrol EDGE",  price: 3200,  unit: "4 л",    inStock: true,  desc: "Полностью синтетическое масло с технологией Fluid TITANIUM",                   icon: "Droplets" },
  { id: "oil-3",  category: "Масла и жидкости",  name: "Антифриз G12+",                   brand: "FELIX",         price: 580,   unit: "1 л",    inStock: true,  desc: "Охлаждающая жидкость красного цвета, готовая к применению",                    icon: "Droplets" },
  { id: "oil-4",  category: "Масла и жидкости",  name: "Тормозная жидкость DOT4",         brand: "Liqui Moly",    price: 420,   unit: "0.5 л",  inStock: true,  desc: "Высококачественная тормозная жидкость для всех типов тормозных систем",       icon: "Droplets" },
  { id: "oil-5",  category: "Масла и жидкости",  name: "Жидкость ГУР",                    brand: "MANNOL",        price: 340,   unit: "1 л",    inStock: false, desc: "Гидравлическая жидкость для рулевого управления",                             icon: "Droplets" },
  { id: "flt-1",  category: "Фильтры",           name: "Масляный фильтр",                 brand: "MANN-FILTER",   price: 380,   unit: "шт",     inStock: true,  desc: "Оригинальный масляный фильтр европейского производства",                      icon: "Filter" },
  { id: "flt-2",  category: "Фильтры",           name: "Воздушный фильтр",                brand: "KNECHT",        price: 520,   unit: "шт",     inStock: true,  desc: "Высокоэффективный воздушный фильтр для двигателя",                            icon: "Filter" },
  { id: "flt-3",  category: "Фильтры",           name: "Салонный фильтр (угольный)",      brand: "MANN-FILTER",   price: 680,   unit: "шт",     inStock: true,  desc: "Фильтр с активированным углём, задерживает запахи и вредные вещества",      icon: "Filter" },
  { id: "flt-4",  category: "Фильтры",           name: "Топливный фильтр",                brand: "BOSCH",         price: 890,   unit: "шт",     inStock: false, desc: "Фильтр тонкой очистки топлива",                                               icon: "Filter" },
  { id: "brk-1",  category: "Тормозная система", name: "Тормозные колодки передние",      brand: "BREMBO",        price: 2400,  unit: "компл",  inStock: true,  desc: "Высокоэффективные тормозные колодки, улучшенный тормозной путь",             icon: "CircleSlash" },
  { id: "brk-2",  category: "Тормозная система", name: "Тормозные колодки задние",        brand: "BREMBO",        price: 1800,  unit: "компл",  inStock: true,  desc: "Задние тормозные колодки с датчиком износа",                                  icon: "CircleSlash" },
  { id: "brk-3",  category: "Тормозная система", name: "Тормозной диск передний",         brand: "ATE",           price: 3200,  unit: "шт",     inStock: true,  desc: "Вентилируемый тормозной диск повышенной надёжности",                          icon: "CircleSlash" },
  { id: "bat-1",  category: "Аккумуляторы",      name: "АКБ 60 Ач",                       brand: "VARTA Silver",  price: 6800,  unit: "шт",     inStock: true,  desc: "Аккумулятор 60 Ач, пусковой ток 540 А, европейская полярность",              icon: "Battery" },
  { id: "bat-2",  category: "Аккумуляторы",      name: "АКБ 74 Ач",                       brand: "VARTA Blue",    price: 7900,  unit: "шт",     inStock: true,  desc: "Аккумулятор 74 Ач, пусковой ток 680 А",                                       icon: "Battery" },
  { id: "bat-3",  category: "Аккумуляторы",      name: "АКБ 90 Ач",                       brand: "Optima",        price: 12500, unit: "шт",     inStock: false, desc: "Аккумулятор повышенной мощности для внедорожников и минивэнов",              icon: "Battery" },
  { id: "tir-1",  category: "Шины и диски",      name: "Летняя шина R15",                 brand: "Michelin",      price: 4200,  unit: "шт",     inStock: true,  desc: "Летняя шина 195/65 R15, индекс нагрузки 91, скорость V",                     icon: "Circle" },
  { id: "tir-2",  category: "Шины и диски",      name: "Зимняя шина R15 (шип)",           brand: "Nokian",        price: 5100,  unit: "шт",     inStock: true,  desc: "Зимняя шина 195/65 R15 с шипами противоскольжения",                          icon: "Circle" },
  { id: "tir-3",  category: "Шины и диски",      name: "Литой диск R17",                  brand: "KIK",           price: 3800,  unit: "шт",     inStock: true,  desc: "Лёгкий литой диск 7J×17 ET45, 5×114.3, серебристый",                         icon: "Circle" },
  { id: "acc-1",  category: "Аксессуары",        name: "Коврики резиновые",               brand: "Autoflex",      price: 1200,  unit: "компл",  inStock: true,  desc: "Универсальные резиновые коврики в салон, 4 штуки",                            icon: "LayoutGrid" },
  { id: "acc-2",  category: "Аксессуары",        name: "Дефлекторы окон",                 brand: "REIN",          price: 1800,  unit: "компл",  inStock: true,  desc: "Дефлекторы боковых окон, 4 штуки, тёмные",                                   icon: "LayoutGrid" },
  { id: "acc-3",  category: "Аксессуары",        name: "Видеорегистратор",                brand: "70mai",         price: 4900,  unit: "шт",     inStock: true,  desc: "4K видеорегистратор с GPS, ночное видение, Wi-Fi",                            icon: "Camera" },
  { id: "acc-4",  category: "Аксессуары",        name: "Очиститель стёкол (концентрат)",  brand: "Liqui Moly",    price: 320,   unit: "500 мл", inStock: true,  desc: "Концентрат для омывателя, -30°С",                                             icon: "Sparkles" },
];

const CATEGORIES = ["Все", ...Array.from(new Set(AUTO_CATALOG.map(i => i.category)))];

export default function AutoGoodsPage({ onNavigate }: AutoGoodsPageProps) {
  const { user, token } = useAuth();
  const [activeCategory, setActiveCategory] = useState("Все");
  const [search, setSearch]                 = useState("");
  const [selected, setSelected]             = useState<AutoItem | null>(null);
  const [balance, setBalance]               = useState<number | null>(null);
  const [payMethod, setPayMethod]           = useState<PayMethod>("wallet");
  const [processing, setProcessing]         = useState(false);
  const [orderMsg, setOrderMsg]             = useState("");

  const loadBalance = useCallback(async () => {
    if (!token) return;
    try {
      const r = await fetch(`${WALLET_URL}?action=balance`, { headers: { "X-Auth-Token": token } });
      const d = await r.json();
      if (r.ok) setBalance(d.balance);
    } catch { /* ignore */ }
  }, [token]);

  useEffect(() => { loadBalance(); }, [loadBalance]);

  const filtered = AUTO_CATALOG.filter(item => {
    const matchCat    = activeCategory === "Все" || item.category === activeCategory;
    const matchSearch = !search || item.name.toLowerCase().includes(search.toLowerCase()) || item.brand.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const hasEnough = selected !== null && balance !== null && balance >= selected.price;
  const shortage  = selected && balance !== null ? Math.max(0, selected.price - balance) : 0;

  const openModal = (item: AutoItem) => {
    setSelected(item);
    setOrderMsg("");
    setPayMethod("wallet");
  };

  // Оплата с кошелька
  const handlePayWallet = async () => {
    if (!user || !token || !selected) return;
    setProcessing(true); setOrderMsg("");
    try {
      const r = await fetch(`${WALLET_URL}?action=spend`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Auth-Token": token },
        body: JSON.stringify({
          amount: selected.price,
          description: `Автотовар: ${selected.name} ${selected.brand} (${selected.unit})`,
        })
      });
      const d = await r.json();
      if (r.ok) {
        setOrderMsg(`✓ Заказ оформлен! Списано ${selected.price.toLocaleString("ru-RU")} ₽. Остаток: ${(d.balance_after ?? 0).toLocaleString("ru-RU")} ₽. Менеджер свяжется с вами.`);
        setBalance(d.balance_after ?? null);
      } else {
        setOrderMsg(d.error || "Ошибка списания");
      }
    } finally { setProcessing(false); }
  };

  // Оплата картой
  const handlePayCard = async () => {
    if (!user || !token || !selected) return;
    setProcessing(true); setOrderMsg("");
    try {
      const r = await fetch(`${WALLET_URL}?action=create_service_payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Auth-Token": token },
        body: JSON.stringify({
          amount: selected.price,
          description: `Автотовар: ${selected.name} ${selected.brand} (${selected.unit})`,
          return_url: window.location.origin + "/?payment=success&type=goods",
        })
      });
      const d = await r.json();
      if (r.ok && d.confirmation_url) {
        window.location.href = d.confirmation_url;
      } else {
        setOrderMsg(d.error || "Ошибка платёжной системы");
        setProcessing(false);
      }
    } catch {
      setOrderMsg("Ошибка соединения с платёжной системой");
      setProcessing(false);
    }
  };

  return (
    <div className="animate-fade-in min-h-screen">
      {/* Hero */}
      <section className="bg-card border-b border-border py-10">
        <div className="container mx-auto">
          <button onClick={() => onNavigate("shop")} className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm mb-5 transition-colors">
            <Icon name="ArrowLeft" size={15} />Назад в магазин
          </button>
          <div className="flex items-end justify-between flex-wrap gap-4">
            <div>
              <div className="label-tag mb-3">DD MAXI — Автотовары</div>
              <h1 className="font-display font-black text-3xl sm:text-4xl uppercase tracking-widest mb-2">Автотовары</h1>
              <p className="text-muted-foreground text-sm">Запчасти, масла, аксессуары — оплата с кошелька или картой</p>
            </div>
            {user && (
              <div className="card-dark px-5 py-3 flex items-center gap-4">
                <Icon name="Wallet" size={20} className="text-green-400" />
                <div>
                  <div className="label-tag">Мой кошелёк</div>
                  <div className="font-display font-bold text-xl text-green-400">
                    {balance !== null ? `${balance.toLocaleString("ru-RU")} ₽` : "—"}
                  </div>
                </div>
                <button onClick={() => onNavigate("account")} className="btn-ghost text-xs py-1.5 px-3">Пополнить</button>
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="container mx-auto section-py">
        {/* Поиск */}
        <div className="flex gap-3 mb-6 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Icon name="Search" size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Поиск по названию или бренду..." className="input-dark pl-9 w-full" />
          </div>
          {search && (
            <button onClick={() => setSearch("")} className="btn-ghost text-xs py-2.5 px-4">
              <Icon name="X" size={13} />Сбросить
            </button>
          )}
        </div>

        {/* Категории */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {CATEGORIES.map(c => (
            <button key={c} onClick={() => setActiveCategory(c)}
              className={`px-4 py-2 text-xs font-display font-bold uppercase tracking-wide border transition-colors ${
                activeCategory === c ? "bg-primary border-primary text-white" : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
              }`}>
              {c}
            </button>
          ))}
        </div>

        {/* Товары */}
        {filtered.length === 0 ? (
          <div className="card-dark p-16 text-center">
            <Icon name="Car" size={40} className="text-muted-foreground mx-auto mb-5 opacity-30" />
            <h3 className="font-display font-bold uppercase tracking-wide">Ничего не найдено</h3>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(item => (
              <div key={item.id} onClick={() => openModal(item)}
                className={`card-dark p-5 flex flex-col cursor-pointer group hover:border-primary/40 transition-all relative ${!item.inStock ? "opacity-60" : ""}`}>
                {!item.inStock && (
                  <div className="absolute top-3 right-3 text-[10px] font-display font-bold uppercase px-2 py-0.5 bg-secondary text-muted-foreground border border-border">
                    Под заказ
                  </div>
                )}
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                    <Icon name={item.icon as "Car"} size={22} className="text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="label-tag mb-1">{item.category}</div>
                    <div className="font-display font-bold text-sm uppercase tracking-wide leading-tight group-hover:text-primary transition-colors">
                      {item.name}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">{item.brand} · {item.unit}</div>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground flex-1 line-clamp-2 mb-4">{item.desc}</p>
                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <div className="font-display font-black text-lg text-primary">{item.price.toLocaleString("ru-RU")} ₽</div>
                  <div className="flex gap-1.5">
                    <span className="text-[10px] text-muted-foreground border border-border px-2 py-0.5 flex items-center gap-1">
                      <Icon name="Wallet" size={10} />Кошелёк
                    </span>
                    <span className="text-[10px] text-muted-foreground border border-border px-2 py-0.5 flex items-center gap-1">
                      <Icon name="CreditCard" size={10} />Карта
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Блок преимуществ */}
        <div className="mt-12 grid sm:grid-cols-3 gap-4">
          {[
            { icon: "Truck",  title: "Доставка в сервис",  desc: "Товар поступит к вашему визиту — удобно и без лишних поездок" },
            { icon: "Wallet", title: "Кошелёк или карта",  desc: "Оплата мгновенно с кошелька или банковской картой через ЮКасса" },
            { icon: "Shield", title: "Гарантия качества",  desc: "Только оригиналы и проверенные бренды с документами" },
          ].map(f => (
            <div key={f.title} className="card-dark p-5 flex gap-4">
              <div className="w-10 h-10 bg-primary/10 flex items-center justify-center shrink-0">
                <Icon name={f.icon as "Truck"} size={20} className="text-primary" />
              </div>
              <div>
                <div className="font-display font-bold text-sm uppercase tracking-wide mb-1">{f.title}</div>
                <div className="text-xs text-muted-foreground leading-relaxed">{f.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Модал заказа */}
      {selected && (
        <div className="fixed inset-0 bg-background/85 backdrop-blur z-50 flex items-center justify-center p-4"
          onClick={e => e.target === e.currentTarget && setSelected(null)}>
          <div className="card-dark w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between p-5 border-b border-border">
              <div>
                <div className="label-tag mb-1">{selected.category} · {selected.brand}</div>
                <div className="font-display font-bold text-lg uppercase tracking-wide">{selected.name}</div>
                <div className="text-sm text-muted-foreground mt-0.5">{selected.unit}</div>
              </div>
              <button onClick={() => setSelected(null)} className="text-muted-foreground hover:text-foreground shrink-0 ml-4">
                <Icon name="X" size={20} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <p className="text-sm text-muted-foreground leading-relaxed">{selected.desc}</p>

              {!selected.inStock && (
                <div className="bg-amber-500/10 border border-amber-500/30 px-4 py-3 text-sm text-amber-400 flex gap-2">
                  <Icon name="Info" size={15} className="shrink-0 mt-0.5" />
                  <span>Товар под заказ — срок поставки 1–3 рабочих дня</span>
                </div>
              )}

              <div className="flex items-center justify-between py-3 border-t border-border">
                <div>
                  <div className="label-tag">Цена</div>
                  <div className="font-display font-black text-2xl text-primary">{selected.price.toLocaleString("ru-RU")} ₽</div>
                </div>
                {user && balance !== null && (
                  <div className="text-right">
                    <div className="label-tag">Баланс кошелька</div>
                    <div className={`font-display font-bold text-lg ${hasEnough ? "text-green-400" : "text-amber-400"}`}>
                      {balance.toLocaleString("ru-RU")} ₽
                    </div>
                  </div>
                )}
              </div>

              {/* Сообщение */}
              {orderMsg && (
                <div className={`text-sm px-4 py-3 rounded border ${orderMsg.startsWith("✓") ? "bg-green-500/10 border-green-500/30 text-green-400" : "bg-destructive/10 border-destructive/30 text-destructive"}`}>
                  {orderMsg}
                </div>
              )}

              {!user ? (
                <button onClick={() => { setSelected(null); onNavigate("login"); }} className="btn-red w-full justify-center">
                  <Icon name="LogIn" size={15} />Войти для заказа
                </button>
              ) : orderMsg.startsWith("✓") ? (
                <button onClick={() => setSelected(null)} className="btn-ghost w-full justify-center">
                  <Icon name="Check" size={15} />Готово
                </button>
              ) : (
                <>
                  <PayMethodSelector value={payMethod} onChange={setPayMethod} balance={balance} amount={selected.price} />

                  {payMethod === "wallet" ? (
                    hasEnough ? (
                      <button onClick={handlePayWallet} disabled={processing} className="btn-green w-full justify-center disabled:opacity-60">
                        {processing ? <><Icon name="Loader2" size={15} className="animate-spin" />Оформляем...</> : <><Icon name="Wallet" size={15} />Заказать — {selected.price.toLocaleString("ru-RU")} ₽ с кошелька</>}
                      </button>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-xs text-muted-foreground text-center">
                          Не хватает <span className="text-destructive font-bold">{shortage.toLocaleString("ru-RU")} ₽</span> — пополните кошелёк или оплатите картой
                        </p>
                        <button onClick={() => { setSelected(null); onNavigate("account"); }} className="btn-ghost w-full justify-center text-xs py-2.5">
                          <Icon name="Wallet" size={13} />Пополнить кошелёк
                        </button>
                      </div>
                    )
                  ) : (
                    <button onClick={handlePayCard} disabled={processing} className="btn-red w-full justify-center disabled:opacity-60">
                      {processing ? <><Icon name="Loader2" size={15} className="animate-spin" />Переходим к оплате...</> : <><Icon name="CreditCard" size={15} />Заказать — {selected.price.toLocaleString("ru-RU")} ₽ картой</>}
                    </button>
                  )}

                  <p className="text-center text-xs text-muted-foreground flex items-center justify-center gap-1.5">
                    <Icon name="Lock" size={11} />Безопасная оплата через ЮКасса
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}