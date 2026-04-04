import { useState, useCallback, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { useAuth } from "@/context/AuthContext";
import PayMethodSelector from "@/components/PayMethodSelector";

const WALLET_URL = "https://functions.poehali.dev/686b24a0-6c64-41f9-8ff3-a7a49d17304b";

interface ServicePayPageProps { onNavigate: (p: string) => void; }

type PayMethod = "wallet" | "card";

interface Service {
  id: string;
  category: string;
  name: string;
  priceFrom: number;
  priceTo?: number;
  duration: string;
  desc: string;
  icon: string;
  popular?: boolean;
}

const SERVICES: Service[] = [
  { id: "oil-change",  category: "ТО и замена жидкостей", name: "Замена моторного масла + фильтр",    priceFrom: 800,  duration: "30 мин",    desc: "Слив старого масла, замена масляного фильтра, заливка нового масла",                        icon: "Droplets",     popular: true },
  { id: "coolant",     category: "ТО и замена жидкостей", name: "Замена охлаждающей жидкости",        priceFrom: 600,  duration: "40 мин",    desc: "Полный слив антифриза, промывка системы охлаждения, заправка новым антифризом",            icon: "Droplets" },
  { id: "brake-fluid", category: "ТО и замена жидкостей", name: "Замена тормозной жидкости",          priceFrom: 500,  duration: "20 мин",    desc: "Замена тормозной жидкости с прокачкой тормозной системы",                                   icon: "Droplets" },
  { id: "to-1",        category: "ТО и замена жидкостей", name: "ТО-1 (по регламенту)",               priceFrom: 3500, duration: "2–3 ч",     desc: "Плановое техническое обслуживание согласно регламенту производителя",                       icon: "ClipboardList" },
  { id: "to-2",        category: "ТО и замена жидкостей", name: "ТО-2 (по регламенту)",               priceFrom: 6000, duration: "3–4 ч",     desc: "Расширенное техническое обслуживание с заменой фильтров и регулировкой",                    icon: "ClipboardList", popular: true },
  { id: "engine-diag", category: "Двигатель",             name: "Диагностика двигателя",              priceFrom: 800,  duration: "1 ч",       desc: "Компьютерная диагностика двигателя, считывание ошибок, расшифровка",                        icon: "Search" },
  { id: "timing",      category: "Двигатель",             name: "Замена ремня ГРМ",                   priceFrom: 3000, priceTo: 8000, duration: "3–5 ч", desc: "Замена ремня или цепи ГРМ с сопутствующими роликами",                icon: "Settings" },
  { id: "spark",       category: "Двигатель",             name: "Замена свечей зажигания",            priceFrom: 600,  duration: "30–60 мин", desc: "Замена свечей зажигания на все цилиндры",                                                   icon: "Zap" },
  { id: "fuel-pump",   category: "Двигатель",             name: "Замена топливного насоса",           priceFrom: 2500, duration: "2–3 ч",     desc: "Замена бензонасоса или насоса высокого давления",                                           icon: "Fuel" },
  { id: "brakes-f",    category: "Тормозная система",     name: "Замена передних тормозных колодок",  priceFrom: 800,  duration: "1 ч",       desc: "Замена передних тормозных колодок, проверка дисков",                                        icon: "CircleSlash",  popular: true },
  { id: "brakes-r",    category: "Тормозная система",     name: "Замена задних тормозных колодок",    priceFrom: 600,  duration: "1 ч",       desc: "Замена задних тормозных колодок или барабанных накладок",                                   icon: "CircleSlash" },
  { id: "disc-f",      category: "Тормозная система",     name: "Замена тормозных дисков (перед.)",  priceFrom: 2000, duration: "1.5–2 ч",   desc: "Замена передних тормозных дисков с установкой и прокачкой",                                icon: "CircleSlash" },
  { id: "shock-abs",   category: "Подвеска и рулевое",    name: "Замена амортизаторов (2 шт.)",       priceFrom: 2500, duration: "2–3 ч",     desc: "Замена двух амортизаторов на одной оси с установкой",                                       icon: "ArrowUpDown" },
  { id: "arm",         category: "Подвеска и рулевое",    name: "Замена рычага подвески",             priceFrom: 1500, duration: "1–2 ч",     desc: "Замена рычага передней или задней подвески",                                                icon: "ArrowUpDown" },
  { id: "alignment",   category: "Подвеска и рулевое",    name: "Развал-схождение",                   priceFrom: 1500, duration: "1 ч",       desc: "Регулировка углов установки колёс, устранение увода",                                       icon: "Sliders",      popular: true },
  { id: "wheel-hub",   category: "Подвеска и рулевое",    name: "Замена ступичного подшипника",       priceFrom: 2000, duration: "2–3 ч",     desc: "Замена ступичного подшипника со ступицей или отдельно",                                     icon: "Circle" },
  { id: "tires-swap",  category: "Шиномонтаж",            name: "Сезонная замена шин (4 шт.)",        priceFrom: 1200, duration: "30–60 мин", desc: "Снятие, установка и балансировка 4 колёс",                                                  icon: "Circle",       popular: true },
  { id: "tires-mount", category: "Шиномонтаж",            name: "Монтаж-демонтаж 1 шины",            priceFrom: 200,  duration: "15 мин",    desc: "Монтаж или демонтаж одной шины с балансировкой",                                            icon: "Circle" },
  { id: "balance",     category: "Шиномонтаж",            name: "Балансировка (4 колеса)",            priceFrom: 600,  duration: "30 мин",    desc: "Балансировка четырёх колёс, устранение биения",                                             icon: "Circle" },
  { id: "wash",        category: "Кузов и детейлинг",     name: "Мойка автомобиля",                   priceFrom: 500,  duration: "30–60 мин", desc: "Ручная мойка кузова, колёс, порогов, протирка стёкол",                                      icon: "Droplets" },
  { id: "polish",      category: "Кузов и детейлинг",     name: "Полировка кузова",                   priceFrom: 5000, duration: "4–8 ч",     desc: "Машинная полировка кузова, удаление царапин и матовости",                                   icon: "Sparkles" },
  { id: "dry-clean",   category: "Кузов и детейлинг",     name: "Химчистка салона",                   priceFrom: 3000, duration: "3–5 ч",     desc: "Глубокая чистка ковров, сидений и обивки салона",                                           icon: "Sparkles" },
];

const CATEGORIES = ["Все популярные", ...Array.from(new Set(SERVICES.map(s => s.category)))];

export default function ServicePayPage({ onNavigate }: ServicePayPageProps) {
  const { user, token } = useAuth();
  const [activeCategory, setActiveCategory] = useState("Все популярные");
  const [search, setSearch]                 = useState("");
  const [selected, setSelected]             = useState<Service | null>(null);
  const [customAmount, setCustomAmount]     = useState("");
  const [balance, setBalance]               = useState<number | null>(null);
  const [payMethod, setPayMethod]           = useState<PayMethod>("wallet");
  const [processing, setProcessing]         = useState(false);
  const [payMsg, setPayMsg]                 = useState("");
  const [note, setNote]                     = useState("");

  const loadBalance = useCallback(async () => {
    if (!token) return;
    try {
      const r = await fetch(`${WALLET_URL}?action=balance`, { headers: { "X-Auth-Token": token } });
      const d = await r.json();
      if (r.ok) setBalance(d.balance);
    } catch { /* ignore */ }
  }, [token]);

  useEffect(() => { loadBalance(); }, [loadBalance]);

  const allFiltered = SERVICES.filter(s => {
    const matchCat    = activeCategory === "Все популярные" ? s.popular : s.category === activeCategory;
    const matchSearch = !search || s.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const amountToPay = selected ? (customAmount ? Number(customAmount) : selected.priceFrom) : 0;
  const hasEnough   = balance !== null && balance >= amountToPay;
  const shortage    = balance !== null ? Math.max(0, amountToPay - balance) : 0;

  const openModal = (s: Service) => {
    setSelected(s);
    setCustomAmount(String(s.priceFrom));
    setPayMsg("");
    setNote("");
    setPayMethod("wallet");
  };

  // Оплата с кошелька — реальное списание через admin_adjust (от имени пользователя через wallet spend)
  const handlePayWallet = async () => {
    if (!user || !token) { onNavigate("login"); return; }
    if (!selected || amountToPay <= 0) return;
    setProcessing(true); setPayMsg("");
    try {
      // Прямое списание через spend — используем wallet spend endpoint
      const r = await fetch(`${WALLET_URL}?action=spend`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Auth-Token": token },
        body: JSON.stringify({
          amount: amountToPay,
          description: `Оплата услуги: ${selected.name}${note ? ` (${note})` : ""}`,
        })
      });
      const d = await r.json();
      if (r.ok) {
        setPayMsg(`✓ Оплачено! Списано ${amountToPay.toLocaleString("ru-RU")} ₽ с кошелька. Остаток: ${(d.balance_after ?? 0).toLocaleString("ru-RU")} ₽`);
        setBalance(d.balance_after ?? null);
      } else {
        setPayMsg(d.error || "Ошибка списания");
      }
    } finally { setProcessing(false); }
  };

  // Оплата картой через ЮКасса
  const handlePayCard = async () => {
    if (!user || !token) { onNavigate("login"); return; }
    if (!selected || amountToPay <= 0) return;
    setProcessing(true); setPayMsg("");
    try {
      const desc = `Оплата услуги: ${selected.name}${note ? ` (${note})` : ""}`;
      const r = await fetch(`${WALLET_URL}?action=create_service_payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Auth-Token": token },
        body: JSON.stringify({ amount: amountToPay, description: desc, return_url: window.location.origin + "/?payment=success&type=service" })
      });
      const d = await r.json();
      if (r.ok && d.confirmation_url) {
        window.location.href = d.confirmation_url;
      } else {
        setPayMsg(d.error || "Ошибка платёжной системы");
        setProcessing(false);
      }
    } catch {
      setPayMsg("Ошибка соединения с платёжной системой");
      setProcessing(false);
    }
  };

  // Произвольная оплата — тот же флоу
  const handleQuickPay = async (method: PayMethod) => {
    const amount = Number(customAmount);
    if (!user || !token) { onNavigate("login"); return; }
    if (!amount || amount <= 0) return;
    setProcessing(true); setPayMsg("");
    try {
      if (method === "card") {
        const r = await fetch(`${WALLET_URL}?action=create_service_payment`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Auth-Token": token },
          body: JSON.stringify({ amount, description: `Оплата услуги автосервиса${note ? `: ${note}` : ""}`, return_url: window.location.origin + "/?payment=success&type=service" })
        });
        const d = await r.json();
        if (r.ok && d.confirmation_url) { window.location.href = d.confirmation_url; return; }
        setPayMsg(d.error || "Ошибка платёжной системы");
      } else {
        const r = await fetch(`${WALLET_URL}?action=spend`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Auth-Token": token },
          body: JSON.stringify({ amount, description: `Оплата услуги автосервиса${note ? `: ${note}` : ""}` })
        });
        const d = await r.json();
        if (r.ok) {
          setPayMsg(`✓ Оплачено ${amount.toLocaleString("ru-RU")} ₽ с кошелька`);
          setBalance(d.balance_after ?? null);
        } else {
          setPayMsg(d.error || "Ошибка списания");
        }
      }
    } finally { setProcessing(false); }
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
              <div className="label-tag mb-3">DD MAXI — Оплата услуг</div>
              <h1 className="font-display font-black text-3xl sm:text-4xl uppercase tracking-widest mb-2">Оплата услуг</h1>
              <p className="text-muted-foreground text-sm">Выберите услугу — оплатите с кошелька или картой</p>
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

      {/* Быстрая оплата по счёту */}
      <div className="bg-primary/5 border-b border-primary/20">
        <div className="container mx-auto py-5">
          <div className="flex items-start gap-4 flex-wrap">
            <Icon name="Zap" size={20} className="text-primary shrink-0 mt-1" />
            <div className="flex-1 min-w-[200px]">
              <div className="font-display font-bold text-sm uppercase tracking-wide">Оплата по счёту / произвольная сумма</div>
              <div className="text-xs text-muted-foreground mb-3">Введите сумму из счёта или назовите менеджеру</div>
              <div className="flex gap-3 items-center flex-wrap">
                <div className="relative">
                  <input type="number" min="1" placeholder="Сумма"
                    value={customAmount} onChange={e => setCustomAmount(e.target.value)}
                    className="input-dark pr-8 w-36" />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold text-sm">₽</span>
                </div>
                <input type="text" placeholder="Комментарий / № заказа" value={note} onChange={e => setNote(e.target.value)}
                  className="input-dark flex-1 min-w-[150px]" />
                <div className="flex gap-2">
                  <button disabled={!customAmount || Number(customAmount) <= 0 || !user || processing}
                    onClick={() => handleQuickPay("wallet")}
                    className="btn-ghost text-xs py-2.5 px-4 disabled:opacity-60">
                    <Icon name="Wallet" size={13} />Кошелёк
                  </button>
                  <button disabled={!customAmount || Number(customAmount) <= 0 || !user || processing}
                    onClick={() => handleQuickPay("card")}
                    className="btn-red text-xs py-2.5 px-4 disabled:opacity-60">
                    <Icon name="CreditCard" size={13} />Карта
                  </button>
                </div>
                {!user && <span className="text-xs text-muted-foreground self-center">Необходима авторизация</span>}
              </div>
              {payMsg && !selected && (
                <div className={`mt-3 text-sm px-4 py-2 rounded border ${payMsg.startsWith("✓") ? "bg-green-500/10 border-green-500/30 text-green-400" : "bg-destructive/10 border-destructive/30 text-destructive"}`}>
                  {payMsg}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto section-py">
        {/* Поиск */}
        <div className="flex gap-3 mb-6 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Icon name="Search" size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Поиск по услугам..." className="input-dark pl-9 w-full" />
          </div>
          {search && <button onClick={() => setSearch("")} className="btn-ghost text-xs py-2.5 px-4"><Icon name="X" size={13} />Сбросить</button>}
        </div>

        {/* Категории */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {CATEGORIES.map(c => (
            <button key={c} onClick={() => { setActiveCategory(c); setSearch(""); }}
              className={`px-4 py-2 text-xs font-display font-bold uppercase tracking-wide border transition-colors ${
                activeCategory === c ? "bg-primary border-primary text-white" : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
              }`}>
              {c === "Все популярные" ? "⭐ Популярные" : c}
            </button>
          ))}
        </div>

        {/* Услуги */}
        {allFiltered.length === 0 ? (
          <div className="card-dark p-16 text-center">
            <Icon name="Wrench" size={40} className="text-muted-foreground mx-auto mb-5 opacity-30" />
            <h3 className="font-display font-bold uppercase tracking-wide">Услуги не найдены</h3>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {allFiltered.map(s => (
              <div key={s.id} onClick={() => openModal(s)}
                className="card-dark p-5 flex gap-4 cursor-pointer group hover:border-primary/40 transition-all relative">
                {s.popular && (
                  <div className="absolute top-3 right-3 bg-primary text-white text-[9px] font-display font-bold uppercase px-2 py-0.5 tracking-widest">Хит</div>
                )}
                <div className="w-12 h-12 bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                  <Icon name={s.icon as "Wrench"} size={22} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="label-tag mb-1">{s.category}</div>
                  <div className="font-display font-bold text-sm uppercase tracking-wide mb-1 group-hover:text-primary transition-colors">{s.name}</div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1 mb-2">
                    <Icon name="Clock" size={11} />{s.duration}
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{s.desc}</p>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                    <div className="font-display font-bold text-base text-primary">
                      от {s.priceFrom.toLocaleString("ru-RU")} ₽
                      {s.priceTo && <span className="text-muted-foreground font-normal text-sm"> — {s.priceTo.toLocaleString("ru-RU")} ₽</span>}
                    </div>
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
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Модал оплаты */}
      {selected && (
        <div className="fixed inset-0 bg-background/85 backdrop-blur z-50 flex items-center justify-center p-4"
          onClick={e => e.target === e.currentTarget && setSelected(null)}>
          <div className="card-dark w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between p-5 border-b border-border">
              <div>
                <div className="label-tag mb-1">{selected.category}</div>
                <div className="font-display font-bold text-lg uppercase tracking-wide">{selected.name}</div>
                <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                  <Icon name="Clock" size={11} />{selected.duration}
                </div>
              </div>
              <button onClick={() => setSelected(null)} className="text-muted-foreground hover:text-foreground shrink-0 ml-4">
                <Icon name="X" size={20} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <p className="text-sm text-muted-foreground leading-relaxed">{selected.desc}</p>

              {/* Сумма */}
              <div>
                <label className="label-tag mb-1.5 block">Сумма оплаты, ₽</label>
                <div className="relative">
                  <input type="number" min="1" value={customAmount}
                    onChange={e => setCustomAmount(e.target.value)}
                    className="input-dark w-full pr-8" />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">₽</span>
                </div>
                {selected.priceTo && (
                  <div className="text-xs text-muted-foreground mt-1.5">
                    Рекомендуемый диапазон: {selected.priceFrom.toLocaleString("ru-RU")} — {selected.priceTo.toLocaleString("ru-RU")} ₽
                  </div>
                )}
                <div className="flex gap-2 mt-2 flex-wrap">
                  {[selected.priceFrom, ...(selected.priceTo ? [Math.round((selected.priceFrom + selected.priceTo) / 2), selected.priceTo] : [])]
                    .filter((v, i, a) => a.indexOf(v) === i)
                    .map(v => (
                      <button key={v} onClick={() => setCustomAmount(String(v))}
                        className={`px-3 py-1.5 text-xs font-display border transition-colors ${Number(customAmount) === v ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/40"}`}>
                        {v.toLocaleString("ru-RU")} ₽
                      </button>
                    ))}
                </div>
              </div>

              {/* Комментарий */}
              <div>
                <label className="label-tag mb-1.5 block">Комментарий (необязательно)</label>
                <input type="text" value={note} onChange={e => setNote(e.target.value)}
                  placeholder="Номер заказ-наряда, пожелания..." className="input-dark w-full" />
              </div>

              {/* Итог + баланс */}
              <div className="flex items-center justify-between py-3 border-t border-border">
                <div>
                  <div className="label-tag">К оплате</div>
                  <div className="font-display font-black text-2xl text-primary">{amountToPay.toLocaleString("ru-RU")} ₽</div>
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
              {payMsg && (
                <div className={`text-sm px-4 py-3 rounded border ${payMsg.startsWith("✓") ? "bg-green-500/10 border-green-500/30 text-green-400" : "bg-destructive/10 border-destructive/30 text-destructive"}`}>
                  {payMsg}
                </div>
              )}

              {!user ? (
                <button onClick={() => { setSelected(null); onNavigate("login"); }} className="btn-red w-full justify-center">
                  <Icon name="LogIn" size={15} />Войти для оплаты
                </button>
              ) : payMsg.startsWith("✓") ? (
                <button onClick={() => setSelected(null)} className="btn-ghost w-full justify-center">
                  <Icon name="Check" size={15} />Готово
                </button>
              ) : (
                <>
                  <PayMethodSelector value={payMethod} onChange={setPayMethod} balance={balance} amount={amountToPay} />

                  {payMethod === "wallet" ? (
                    hasEnough ? (
                      <button onClick={handlePayWallet} disabled={processing || amountToPay <= 0} className="btn-green w-full justify-center disabled:opacity-60">
                        {processing ? <><Icon name="Loader2" size={15} className="animate-spin" />Оплачиваем...</> : <><Icon name="Wallet" size={15} />Оплатить {amountToPay.toLocaleString("ru-RU")} ₽ с кошелька</>}
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
                    <button onClick={handlePayCard} disabled={processing || amountToPay <= 0} className="btn-red w-full justify-center disabled:opacity-60">
                      {processing ? <><Icon name="Loader2" size={15} className="animate-spin" />Переходим к оплате...</> : <><Icon name="CreditCard" size={15} />Оплатить {amountToPay.toLocaleString("ru-RU")} ₽ картой</>}
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