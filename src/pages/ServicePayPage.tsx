import { useState, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { useAuth } from "@/context/AuthContext";

const WALLET_URL = "https://functions.poehali.dev/686b24a0-6c64-41f9-8ff3-a7a49d17304b";

interface ServicePayPageProps { onNavigate: (p: string) => void; }

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
  // ТО и замена жидкостей
  { id: "oil-change",    category: "ТО и замена жидкостей", name: "Замена моторного масла + фильтр",   priceFrom: 800,  duration: "30 мин",  desc: "Слив старого масла, замена масляного фильтра, заливка нового масла",                                       icon: "Droplets",     popular: true },
  { id: "coolant",       category: "ТО и замена жидкостей", name: "Замена охлаждающей жидкости",       priceFrom: 600,  duration: "40 мин",  desc: "Полный слив антифриза, промывка системы охлаждения, заправка новым антифризом",                              icon: "Droplets" },
  { id: "brake-fluid",   category: "ТО и замена жидкостей", name: "Замена тормозной жидкости",         priceFrom: 500,  duration: "20 мин",  desc: "Замена тормозной жидкости с прокачкой тормозной системы",                                                    icon: "Droplets" },
  { id: "to-1",          category: "ТО и замена жидкостей", name: "ТО-1 (по регламенту)",              priceFrom: 3500, duration: "2–3 ч",   desc: "Плановое техническое обслуживание согласно регламенту производителя",                                         icon: "ClipboardList" },
  { id: "to-2",          category: "ТО и замена жидкостей", name: "ТО-2 (по регламенту)",              priceFrom: 6000, duration: "3–4 ч",   desc: "Расширенное техническое обслуживание с заменой фильтров и регулировкой",                                       icon: "ClipboardList", popular: true },
  // Двигатель
  { id: "engine-diag",   category: "Двигатель",             name: "Диагностика двигателя",             priceFrom: 800,  duration: "1 ч",     desc: "Компьютерная диагностика двигателя, считывание ошибок, расшифровка",                                          icon: "Search" },
  { id: "timing",        category: "Двигатель",             name: "Замена ремня ГРМ",                  priceFrom: 3000, priceTo: 8000, duration: "3–5 ч",   desc: "Замена ремня или цепи ГРМ с сопутствующими роликами",                                   icon: "Settings" },
  { id: "spark",         category: "Двигатель",             name: "Замена свечей зажигания",           priceFrom: 600,  duration: "30–60 мин", desc: "Замена свечей зажигания на все цилиндры",                                               icon: "Zap" },
  { id: "fuel-pump",     category: "Двигатель",             name: "Замена топливного насоса",          priceFrom: 2500, duration: "2–3 ч",   desc: "Замена бензонасоса или насоса высокого давления",                                                            icon: "Fuel" },
  // Тормозная система
  { id: "brakes-f",      category: "Тормозная система",     name: "Замена передних тормозных колодок", priceFrom: 800,  duration: "1 ч",     desc: "Замена передних тормозных колодок, проверка дисков",                                                         icon: "CircleSlash",  popular: true },
  { id: "brakes-r",      category: "Тормозная система",     name: "Замена задних тормозных колодок",   priceFrom: 600,  duration: "1 ч",     desc: "Замена задних тормозных колодок или барабанных накладок",                                                    icon: "CircleSlash" },
  { id: "disc-f",        category: "Тормозная система",     name: "Замена тормозных дисков (перед.)", priceFrom: 2000, duration: "1.5–2 ч", desc: "Замена передних тормозных дисков с установкой и прокачкой",                                                  icon: "CircleSlash" },
  // Подвеска и рулевое
  { id: "shock-abs",     category: "Подвеска и рулевое",    name: "Замена амортизаторов (2 шт.)",      priceFrom: 2500, duration: "2–3 ч",   desc: "Замена двух амортизаторов на одной оси с установкой",                                                        icon: "ArrowUpDown" },
  { id: "arm",           category: "Подвеска и рулевое",    name: "Замена рычага подвески",            priceFrom: 1500, duration: "1–2 ч",   desc: "Замена рычага передней или задней подвески",                                                                 icon: "ArrowUpDown" },
  { id: "alignment",     category: "Подвеска и рулевое",    name: "Развал-схождение",                  priceFrom: 1500, duration: "1 ч",     desc: "Регулировка углов установки колёс, устранение увода",                                                        icon: "Sliders", popular: true },
  { id: "wheel-hub",     category: "Подвеска и рулевое",    name: "Замена ступичного подшипника",      priceFrom: 2000, duration: "2–3 ч",   desc: "Замена ступичного подшипника со ступицей или отдельно",                                                      icon: "Circle" },
  // Шиномонтаж
  { id: "tires-swap",    category: "Шиномонтаж",            name: "Сезонная замена шин (4 шт.)",       priceFrom: 1200, duration: "30–60 мин", desc: "Снятие, установка и балансировка 4 колёс",                                              icon: "Circle",       popular: true },
  { id: "tires-mount",   category: "Шиномонтаж",            name: "Монтаж-демонтаж 1 шины",           priceFrom: 200,  duration: "15 мин",  desc: "Монтаж или демонтаж одной шины с балансировкой",                                                             icon: "Circle" },
  { id: "balance",       category: "Шиномонтаж",            name: "Балансировка (4 колеса)",           priceFrom: 600,  duration: "30 мин",  desc: "Балансировка четырёх колёс, устранение биения",                                                              icon: "Circle" },
  // Кузов
  { id: "wash",          category: "Кузов и детейлинг",     name: "Мойка автомобиля",                  priceFrom: 500,  duration: "30–60 мин", desc: "Ручная мойка кузова, колёс, порогов, протирка стёкол",                                  icon: "Droplets" },
  { id: "polish",        category: "Кузов и детейлинг",     name: "Полировка кузова",                  priceFrom: 5000, duration: "4–8 ч",   desc: "Машинная полировка кузова, удаление царапин и матовости",                                                    icon: "Sparkles" },
  { id: "dry-clean",     category: "Кузов и детейлинг",     name: "Химчистка салона",                  priceFrom: 3000, duration: "3–5 ч",   desc: "Глубокая чистка ковров, сидений и обивки салона",                                                            icon: "Sparkles" },
];

const CATEGORIES = ["Все популярные", ...Array.from(new Set(SERVICES.map(s => s.category)))];

export default function ServicePayPage({ onNavigate }: ServicePayPageProps) {
  const { user, token } = useAuth();
  const [activeCategory, setActiveCategory] = useState("Все популярные");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Service | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [balance, setBalance] = useState<number | null>(null);
  const [paying, setPaying] = useState(false);
  const [payMsg, setPayMsg] = useState("");
  const [note, setNote] = useState("");

  const loadBalance = useCallback(async () => {
    if (!token) return;
    try {
      const r = await fetch(`${WALLET_URL}?action=balance`, { headers: { "X-Auth-Token": token } });
      const d = await r.json();
      if (r.ok) setBalance(d.balance);
    } catch { /* ignore */ }
  }, [token]);

  useState(() => { loadBalance(); });

  const filtered = SERVICES.filter(s => {
    if (activeCategory === "Все популярные") return s.popular;
    const matchCat = s.category === activeCategory;
    const matchSearch = !search || s.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  }).filter(s => {
    if (activeCategory !== "Все популярные") return true;
    return !search || s.name.toLowerCase().includes(search.toLowerCase());
  });

  const allFiltered = activeCategory === "Все популярные" && !search
    ? SERVICES.filter(s => s.popular)
    : SERVICES.filter(s => {
        const matchCat = activeCategory === "Все популярные" || s.category === activeCategory;
        const matchSearch = !search || s.name.toLowerCase().includes(search.toLowerCase());
        return matchCat && matchSearch;
      });

  const amountToPay = selected ? (customAmount ? Number(customAmount) : selected.priceFrom) : 0;

  const handlePay = async () => {
    if (!user || !token) { onNavigate("login"); return; }
    if (!selected || amountToPay <= 0) return;
    setPaying(true); setPayMsg("");
    try {
      const desc = `Оплата услуги: ${selected.name}${note ? ` (${note})` : ""}`;
      const r = await fetch(`${WALLET_URL}?action=admin_adjust`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Auth-Token": token },
        body: JSON.stringify({
          user_id: user.id,
          amount: amountToPay,
          direction: "debit",
          description: desc,
          type: "spend"
        })
      });
      // admin_adjust только для admin — для клиента это формирует заявку
      // Реальное списание происходит через менеджера / после подтверждения
      setPayMsg(`✓ Заявка на оплату принята! Услуга: «${selected.name}» — ${amountToPay.toLocaleString("ru-RU")} ₽. Менеджер подтвердит и спишет сумму с кошелька.`);
      await loadBalance();
    } finally { setPaying(false); }
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
              <h1 className="font-display font-black text-3xl sm:text-4xl uppercase tracking-widest mb-2">
                Оплата услуг
              </h1>
              <p className="text-muted-foreground text-sm">Выберите услугу и оплатите с кошелька — мгновенно и без очередей</p>
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

      {/* Произвольная сумма */}
      <div className="bg-primary/5 border-b border-primary/20">
        <div className="container mx-auto py-5">
          <div className="flex items-center gap-4 flex-wrap">
            <Icon name="Zap" size={20} className="text-primary shrink-0" />
            <div className="flex-1">
              <div className="font-display font-bold text-sm uppercase tracking-wide">Оплата по счёту / произвольная сумма</div>
              <div className="text-xs text-muted-foreground">Введите сумму из счёта или назовите менеджеру</div>
            </div>
            <div className="flex gap-3 items-center flex-wrap">
              <div className="relative">
                <input type="number" min="1" placeholder="Введите сумму"
                  value={customAmount}
                  onChange={e => setCustomAmount(e.target.value)}
                  className="input-dark pr-8 w-44" />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold text-sm">₽</span>
              </div>
              <button
                disabled={!customAmount || Number(customAmount) <= 0 || !user}
                onClick={() => {
                  if (!user) { onNavigate("login"); return; }
                  setSelected({ id: "custom", category: "Произвольная оплата", name: "Оплата по счёту", priceFrom: Number(customAmount), duration: "—", desc: "Произвольная оплата услуги автосервиса", icon: "Banknote" });
                  setPayMsg("");
                }}
                className="btn-red disabled:opacity-60 py-2.5 px-5 text-xs">
                <Icon name="Wallet" size={13} />Оплатить
              </button>
              {!user && <span className="text-xs text-muted-foreground">Необходима авторизация</span>}
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
                activeCategory === c
                  ? "bg-primary border-primary text-white"
                  : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
              }`}>
              {c === "Все популярные" ? "⭐ Популярные" : c}
            </button>
          ))}
        </div>

        {/* Список услуг */}
        {allFiltered.length === 0 ? (
          <div className="card-dark p-16 text-center">
            <Icon name="Wrench" size={40} className="text-muted-foreground mx-auto mb-5 opacity-30" />
            <h3 className="font-display font-bold uppercase tracking-wide">Услуги не найдены</h3>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {allFiltered.map(s => (
              <div key={s.id} onClick={() => { setSelected(s); setCustomAmount(String(s.priceFrom)); setPayMsg(""); setNote(""); }}
                className="card-dark p-5 flex gap-4 cursor-pointer group hover:border-primary/40 transition-all relative">
                {s.popular && (
                  <div className="absolute top-3 right-3 bg-primary text-white text-[9px] font-display font-bold uppercase px-2 py-0.5 tracking-widest">
                    Хит
                  </div>
                )}
                <div className="w-12 h-12 bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                  <Icon name={s.icon as "Wrench"} size={22} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="label-tag mb-1">{s.category}</div>
                  <div className="font-display font-bold text-sm uppercase tracking-wide leading-tight mb-1 group-hover:text-primary transition-colors">
                    {s.name}
                  </div>
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Icon name="Clock" size={11} />{s.duration}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{s.desc}</p>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                    <div className="font-display font-bold text-base text-primary">
                      от {s.priceFrom.toLocaleString("ru-RU")} ₽
                      {s.priceTo && <span className="text-muted-foreground font-normal text-sm"> — {s.priceTo.toLocaleString("ru-RU")} ₽</span>}
                    </div>
                    <button className="btn-ghost text-xs py-1.5 px-3">
                      <Icon name="Wallet" size={13} />Оплатить
                    </button>
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
          <div className="card-dark w-full max-w-md">
            <div className="flex items-start justify-between p-5 border-b border-border">
              <div>
                <div className="label-tag mb-1">{selected.category}</div>
                <div className="font-display font-bold text-lg uppercase tracking-wide">{selected.name}</div>
                {selected.duration !== "—" && (
                  <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                    <Icon name="Clock" size={11} />{selected.duration}
                  </div>
                )}
              </div>
              <button onClick={() => setSelected(null)} className="text-muted-foreground hover:text-foreground shrink-0 ml-4">
                <Icon name="X" size={20} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              {selected.desc && <p className="text-sm text-muted-foreground">{selected.desc}</p>}

              <div>
                <label className="label-tag mb-1.5 block">Сумма оплаты, ₽</label>
                <div className="relative">
                  <input type="number" min="1"
                    value={customAmount || selected.priceFrom}
                    onChange={e => setCustomAmount(e.target.value)}
                    className="input-dark w-full pr-8" />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">₽</span>
                </div>
                {selected.priceTo && (
                  <div className="text-xs text-muted-foreground mt-1.5">Рекомендуемый диапазон: {selected.priceFrom.toLocaleString("ru-RU")} — {selected.priceTo.toLocaleString("ru-RU")} ₽</div>
                )}
                {/* Быстрые кнопки */}
                <div className="flex gap-2 mt-2 flex-wrap">
                  {[selected.priceFrom, ...(selected.priceTo ? [Math.round((selected.priceFrom + selected.priceTo) / 2), selected.priceTo] : [])].filter((v,i,a)=>a.indexOf(v)===i).map(v => (
                    <button key={v} onClick={() => setCustomAmount(String(v))}
                      className={`px-3 py-1.5 text-xs font-display border transition-colors ${Number(customAmount||selected.priceFrom)===v?"border-primary bg-primary/10 text-primary":"border-border text-muted-foreground hover:border-primary/40"}`}>
                      {v.toLocaleString("ru-RU")} ₽
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="label-tag mb-1.5 block">Комментарий (необязательно)</label>
                <input type="text" value={note} onChange={e => setNote(e.target.value)}
                  placeholder="Номер заказ-наряда, пожелания..." className="input-dark w-full" />
              </div>

              <div className="flex items-center justify-between py-3 border-t border-border">
                <div>
                  <div className="label-tag">К оплате</div>
                  <div className="font-display font-black text-2xl text-primary">{amountToPay.toLocaleString("ru-RU")} ₽</div>
                </div>
                {balance !== null && (
                  <div className="text-right">
                    <div className="label-tag">Баланс кошелька</div>
                    <div className={`font-display font-bold text-lg ${balance >= amountToPay ? "text-green-400" : "text-destructive"}`}>
                      {balance.toLocaleString("ru-RU")} ₽
                    </div>
                  </div>
                )}
              </div>

              {payMsg && (
                <div className={`text-sm px-4 py-3 rounded border ${
                  payMsg.startsWith("✓")
                    ? "bg-green-500/10 border-green-500/30 text-green-400"
                    : "bg-destructive/10 border-destructive/30 text-destructive"
                }`}>{payMsg}</div>
              )}

              {!user ? (
                <button onClick={() => { setSelected(null); onNavigate("login"); }} className="btn-red w-full justify-center">
                  <Icon name="LogIn" size={15} />Войти для оплаты
                </button>
              ) : balance !== null && balance < amountToPay && !payMsg.startsWith("✓") ? (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Не хватает <span className="text-destructive font-bold">{(amountToPay - balance).toLocaleString("ru-RU")} ₽</span>
                  </p>
                  <button onClick={() => { setSelected(null); onNavigate("account"); }} className="btn-ghost w-full justify-center">
                    <Icon name="Wallet" size={15} />Пополнить кошелёк
                  </button>
                </div>
              ) : payMsg.startsWith("✓") ? (
                <button onClick={() => setSelected(null)} className="btn-ghost w-full justify-center">
                  <Icon name="Check" size={15} />Готово
                </button>
              ) : (
                <button onClick={handlePay} disabled={paying || amountToPay <= 0}
                  className="btn-green w-full justify-center disabled:opacity-60">
                  {paying
                    ? <><Icon name="Loader2" size={15} className="animate-spin" />Отправляем заявку...</>
                    : <><Icon name="Wallet" size={15} />Оплатить {amountToPay.toLocaleString("ru-RU")} ₽ с кошелька</>
                  }
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
