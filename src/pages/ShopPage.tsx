import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { useAuth } from "@/context/AuthContext";

const SHOP_URL   = "https://functions.poehali.dev/714bb75b-cfea-4178-a588-3dcaf54e74cc";
const WALLET_URL = "https://functions.poehali.dev/686b24a0-6c64-41f9-8ff3-a7a49d17304b";

interface Product {
  id: number;
  title: string;
  description: string;
  price: string;
  category: string;
  image_url: string;
  demo_url: string;
  is_active: boolean;
}

interface ShopPageProps { onNavigate: (p: string) => void; }

type PayMethod = "wallet" | "card";

const SHOP_SECTIONS = [
  { id: "digital",    label: "Цифровые продукты", icon: "Monitor",  desc: "Программы, сервисы и цифровые решения",        page: null },
  { id: "autogoods",  label: "Автотовары",         icon: "Car",      desc: "Запчасти, расходники, аксессуары для вашего авто", page: "autogoods" },
  { id: "servicepay", label: "Оплата услуг",       icon: "Wrench",   desc: "Оплата услуг автосервиса с кошелька",          page: "servicepay" },
];

export default function ShopPage({ onNavigate }: ShopPageProps) {
  const { user, token } = useAuth();
  const [products, setProducts]     = useState<Product[]>([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState("");
  const [category, setCategory]     = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [selected, setSelected]     = useState<Product | null>(null);
  const [payMethod, setPayMethod]   = useState<PayMethod>("wallet");
  const [processing, setProcessing] = useState(false);
  const [msg, setMsg]               = useState("");
  const [balance, setBalance]       = useState<number | null>(null);

  const loadProducts = useCallback(async (q = "", cat = "") => {
    setLoading(true);
    try {
      let url = `${SHOP_URL}?action=products`;
      if (q) url += `&q=${encodeURIComponent(q)}`;
      if (cat) url += `&category=${encodeURIComponent(cat)}`;
      const r = await fetch(url);
      const d = await r.json();
      const list: Product[] = d.products || [];
      setProducts(list);
      if (!q && !cat) {
        const cats = [...new Set(list.map(p => p.category).filter(Boolean))];
        setCategories(cats);
      }
    } finally { setLoading(false); }
  }, []);

  const loadBalance = useCallback(async () => {
    if (!token) return;
    try {
      const r = await fetch(`${WALLET_URL}?action=balance`, { headers: { "X-Auth-Token": token } });
      const d = await r.json();
      if (r.ok) setBalance(d.balance);
    } catch { /* ignore */ }
  }, [token]);

  useEffect(() => { loadProducts(); }, [loadProducts]);
  useEffect(() => { loadBalance(); }, [loadBalance]);

  const openModal = (p: Product) => {
    setSelected(p);
    setMsg("");
    setPayMethod("wallet");
  };

  // Оплата с кошелька
  const handleBuyWallet = async () => {
    if (!user || !token) { onNavigate("login"); return; }
    if (!selected) return;
    setProcessing(true); setMsg("");
    try {
      const r = await fetch(`${SHOP_URL}?action=buy`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Auth-Token": token },
        body: JSON.stringify({ product_id: selected.id })
      });
      const d = await r.json();
      if (r.ok) {
        setMsg(`✓ ${d.message}`);
        setBalance(d.balance_after);
      } else {
        setMsg(d.error || "Ошибка покупки");
      }
    } finally { setProcessing(false); }
  };

  // Оплата картой — получаем ссылку ЮКасса и редиректим
  const handleBuyCard = async () => {
    if (!user || !token) { onNavigate("login"); return; }
    if (!selected) return;
    setProcessing(true); setMsg("");
    try {
      const returnUrl = window.location.origin + "/?payment=success&type=shop";
      const r = await fetch(`${SHOP_URL}?action=buy_card`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Auth-Token": token },
        body: JSON.stringify({ product_id: selected.id, return_url: returnUrl })
      });
      const d = await r.json();
      if (r.ok && d.confirmation_url) {
        localStorage.setItem("yk_pending_order_id", String(d.order_id));
        localStorage.setItem("yk_pending_type", "shop");
        window.location.href = d.confirmation_url;
      } else {
        setMsg(d.error || "Ошибка при создании платежа");
        setProcessing(false);
      }
    } catch {
      setMsg("Ошибка соединения с платёжной системой");
      setProcessing(false);
    }
  };

  const price = selected ? parseFloat(selected.price) : 0;
  const hasEnough = balance !== null && balance >= price;
  const shortage = balance !== null ? Math.max(0, price - balance) : 0;

  return (
    <div className="animate-fade-in min-h-screen">
      {/* Hero */}
      <section className="bg-card border-b border-border py-12">
        <div className="container mx-auto">
          <div className="flex items-end justify-between flex-wrap gap-4">
            <div>
              <div className="label-tag mb-3">DD MAXI</div>
              <h1 className="font-display font-black text-3xl sm:text-4xl uppercase tracking-widest mb-2">Магазин</h1>
              <p className="text-muted-foreground text-sm">Товары, автозапчасти и оплата услуг — всё в одном месте</p>
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

      {/* Разделы */}
      <div className="bg-card border-b border-border">
        <div className="container mx-auto">
          <div className="grid sm:grid-cols-3 gap-0">
            {SHOP_SECTIONS.map((s, i) => (
              <button key={s.id} onClick={() => s.page ? onNavigate(s.page) : undefined}
                className={`flex items-center gap-3 px-6 py-5 text-left transition-all border-b-2 group
                  ${!s.page ? "border-b-primary bg-primary/5 text-foreground cursor-default"
                    : "border-b-transparent hover:border-b-primary/40 hover:bg-secondary/20 text-muted-foreground hover:text-foreground cursor-pointer"}
                  ${i < SHOP_SECTIONS.length - 1 ? "border-r border-border" : ""}`}>
                <div className={`w-10 h-10 flex items-center justify-center shrink-0 transition-colors
                  ${!s.page ? "bg-primary text-white" : "bg-secondary/40 group-hover:bg-primary/10 text-muted-foreground group-hover:text-primary"}`}>
                  <Icon name={s.icon as "Car"} size={20} />
                </div>
                <div className="min-w-0">
                  <div className={`font-display font-bold text-sm uppercase tracking-wide ${!s.page ? "text-foreground" : ""}`}>{s.label}</div>
                  <div className="text-xs text-muted-foreground mt-0.5 hidden sm:block truncate">{s.desc}</div>
                </div>
                {s.page && <Icon name="ChevronRight" size={16} className="ml-auto shrink-0 opacity-40 group-hover:opacity-100 transition-opacity" />}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="container mx-auto section-py">
        <div className="flex items-center gap-3 mb-6">
          <Icon name="Monitor" size={20} className="text-primary" />
          <h2 className="font-display font-bold text-lg uppercase tracking-wide">Цифровые продукты</h2>
          <div className="h-px flex-1 bg-border" />
        </div>

        {/* Поиск */}
        <form onSubmit={e => { e.preventDefault(); loadProducts(search, category); }} className="flex gap-3 mb-6 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Icon name="Search" size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Поиск товара..." className="input-dark pl-9 w-full" />
          </div>
          {categories.length > 0 && (
            <select value={category} onChange={e => { setCategory(e.target.value); loadProducts(search, e.target.value); }}
              className="input-dark min-w-[180px]">
              <option value="">Все категории</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          )}
          <button type="submit" className="btn-ghost text-xs py-2.5 px-5">
            <Icon name="Search" size={14} />Найти
          </button>
        </form>

        {/* Товары */}
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="card-dark p-5 animate-pulse">
                <div className="bg-secondary/40 h-40 mb-4 rounded" />
                <div className="bg-secondary/40 h-4 mb-2 rounded w-3/4" />
                <div className="bg-secondary/40 h-3 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="card-dark p-16 text-center">
            <Icon name="ShoppingBag" size={40} className="text-muted-foreground mx-auto mb-5 opacity-30" />
            <h3 className="font-display font-bold text-xl uppercase tracking-wide mb-2">Товаров не найдено</h3>
            <p className="text-sm text-muted-foreground mb-5">Попробуйте другой запрос</p>
            <button onClick={() => { setSearch(""); setCategory(""); loadProducts(); }} className="btn-ghost text-xs">
              Сбросить фильтры
            </button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {products.map(p => (
              <div key={p.id} className="card-dark overflow-hidden flex flex-col cursor-pointer group hover:border-primary/40 transition-all"
                onClick={() => openModal(p)}>
                <div className="relative h-44 bg-secondary/20 overflow-hidden">
                  {p.image_url ? (
                    <img src={p.image_url} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Icon name="Package" size={40} className="text-muted-foreground/30" />
                    </div>
                  )}
                  <div className="absolute top-3 left-3">
                    <span className="bg-card/90 backdrop-blur text-[10px] font-display font-bold uppercase tracking-wider px-2 py-1 border border-border">
                      {p.category}
                    </span>
                  </div>
                </div>
                <div className="p-5 flex flex-col flex-1">
                  <h3 className="font-display font-bold text-base uppercase tracking-wide mb-2 group-hover:text-primary transition-colors">{p.title}</h3>
                  <p className="text-sm text-muted-foreground flex-1 line-clamp-3 mb-4">{p.description}</p>
                  <div className="flex items-center justify-between pt-3 border-t border-border">
                    <div className="font-display font-black text-xl text-primary">{parseFloat(p.price).toLocaleString("ru-RU")} ₽</div>
                    <button className="btn-ghost text-xs py-2 px-4"><Icon name="ShoppingCart" size={13} />Купить</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Баннеры других разделов */}
        <div className="grid sm:grid-cols-2 gap-5 mt-12">
          {[
            { page: "autogoods", icon: "Car", title: "Автотовары", desc: "Запчасти, масла, аксессуары и расходники" },
            { page: "servicepay", icon: "Wrench", title: "Оплата услуг", desc: "Оплатите услуги автосервиса с кошелька онлайн" },
          ].map(b => (
            <div key={b.page} onClick={() => onNavigate(b.page)}
              className="card-dark p-6 cursor-pointer hover:border-primary/40 transition-all group flex items-center gap-5">
              <div className="w-14 h-14 bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                <Icon name={b.icon as "Car"} size={28} className="text-primary" />
              </div>
              <div className="flex-1">
                <div className="font-display font-bold text-base uppercase tracking-wide mb-1 group-hover:text-primary transition-colors">{b.title}</div>
                <div className="text-sm text-muted-foreground">{b.desc}</div>
              </div>
              <Icon name="ArrowRight" size={18} className="text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
            </div>
          ))}
        </div>
      </div>

      {/* ── Модал товара ── */}
      {selected && (
        <div className="fixed inset-0 bg-background/85 backdrop-blur z-50 flex items-center justify-center p-4"
          onClick={e => e.target === e.currentTarget && setSelected(null)}>
          <div className="card-dark w-full max-w-lg max-h-[90vh] overflow-y-auto">

            {/* Шапка */}
            <div className="flex items-start justify-between p-5 border-b border-border">
              <div>
                <div className="label-tag mb-1">{selected.category}</div>
                <div className="font-display font-bold text-lg uppercase tracking-wide">{selected.title}</div>
              </div>
              <button onClick={() => setSelected(null)} className="text-muted-foreground hover:text-foreground shrink-0 ml-4">
                <Icon name="X" size={20} />
              </button>
            </div>

            {/* Фото */}
            {selected.image_url && (
              <div className="h-48 overflow-hidden">
                <img src={selected.image_url} alt={selected.title} className="w-full h-full object-cover" />
              </div>
            )}

            <div className="p-5 space-y-5">
              <p className="text-sm text-muted-foreground leading-relaxed">{selected.description}</p>
              {selected.demo_url && (
                <a href={selected.demo_url} target="_blank" rel="noopener noreferrer" className="btn-ghost text-xs py-2 px-4 w-fit inline-flex">
                  <Icon name="ExternalLink" size={13} />Открыть демо
                </a>
              )}

              {/* Цена */}
              <div className="flex items-center justify-between py-3 border-t border-border">
                <div>
                  <div className="label-tag">Цена</div>
                  <div className="font-display font-black text-3xl text-primary">{price.toLocaleString("ru-RU")} ₽</div>
                </div>
                {user && balance !== null && (
                  <div className="text-right">
                    <div className="label-tag">Баланс кошелька</div>
                    <div className={`font-display font-bold text-lg ${hasEnough ? "text-green-400" : "text-destructive"}`}>
                      {balance.toLocaleString("ru-RU")} ₽
                    </div>
                  </div>
                )}
              </div>

              {/* Незалогинен */}
              {!user ? (
                <button onClick={() => { setSelected(null); onNavigate("login"); }} className="btn-red w-full justify-center">
                  <Icon name="LogIn" size={15} />Войти для покупки
                </button>
              ) : msg.startsWith("✓") ? (
                /* Успех */
                <div className="space-y-3">
                  <div className="bg-green-500/10 border border-green-500/30 text-green-400 px-4 py-3 text-sm rounded">{msg}</div>
                  <div className="flex gap-3">
                    <button onClick={() => setSelected(null)} className="btn-ghost flex-1 justify-center text-xs">
                      <Icon name="ShoppingBag" size={13} />Продолжить покупки
                    </button>
                    <button onClick={() => { setSelected(null); onNavigate("account"); }} className="btn-ghost flex-1 justify-center text-xs">
                      <Icon name="ClipboardList" size={13} />Мои заказы
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Ошибка */}
                  {msg && !msg.startsWith("✓") && (
                    <div className="bg-destructive/10 border border-destructive/30 text-destructive px-4 py-3 text-sm rounded">{msg}</div>
                  )}

                  {/* Выбор способа оплаты */}
                  <div>
                    <div className="label-tag mb-3">Способ оплаты</div>
                    <div className="grid grid-cols-2 gap-3">
                      <button onClick={() => setPayMethod("wallet")}
                        className={`p-4 border-2 text-left transition-all ${payMethod === "wallet" ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}>
                        <div className="flex items-center gap-2 mb-1.5">
                          <Icon name="Wallet" size={18} className={payMethod === "wallet" ? "text-primary" : "text-muted-foreground"} />
                          <span className="font-display font-bold text-sm uppercase tracking-wide">Кошелёк</span>
                        </div>
                        {balance !== null ? (
                          <div className={`text-xs font-bold ${hasEnough ? "text-green-400" : "text-destructive"}`}>
                            {hasEnough ? `Доступно ${balance.toLocaleString("ru-RU")} ₽` : `Не хватает ${shortage.toLocaleString("ru-RU")} ₽`}
                          </div>
                        ) : (
                          <div className="text-xs text-muted-foreground">Мгновенно</div>
                        )}
                      </button>

                      <button onClick={() => setPayMethod("card")}
                        className={`p-4 border-2 text-left transition-all ${payMethod === "card" ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}>
                        <div className="flex items-center gap-2 mb-1.5">
                          <Icon name="CreditCard" size={18} className={payMethod === "card" ? "text-primary" : "text-muted-foreground"} />
                          <span className="font-display font-bold text-sm uppercase tracking-wide">Карта</span>
                        </div>
                        <div className="text-xs text-muted-foreground">Visa, МИР, МастерКард</div>
                      </button>
                    </div>
                  </div>

                  {/* Кнопка действия */}
                  {payMethod === "wallet" ? (
                    hasEnough ? (
                      <button onClick={handleBuyWallet} disabled={processing} className="btn-green w-full justify-center disabled:opacity-60">
                        {processing
                          ? <><Icon name="Loader2" size={15} className="animate-spin" />Оплачиваем...</>
                          : <><Icon name="Wallet" size={15} />Оплатить {price.toLocaleString("ru-RU")} ₽ с кошелька</>
                        }
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
                    <button onClick={handleBuyCard} disabled={processing} className="btn-red w-full justify-center disabled:opacity-60">
                      {processing
                        ? <><Icon name="Loader2" size={15} className="animate-spin" />Переходим к оплате...</>
                        : <><Icon name="CreditCard" size={15} />Оплатить {price.toLocaleString("ru-RU")} ₽ картой</>
                      }
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