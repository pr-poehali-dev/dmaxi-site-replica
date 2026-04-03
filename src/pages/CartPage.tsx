import { useState } from "react";
import Icon from "@/components/ui/icon";

interface CartItem {
  id: number;
  name: string;
  category: string;
  price: number;
  qty: number;
}

interface CartPageProps {
  onNavigate: (page: string) => void;
}

const initialItems: CartItem[] = [
  { id: 1, name: "МФУ Laser Business 3500", category: "Оргтехника", price: 45600, qty: 1 },
  { id: 2, name: "Кресло руководителя Exec Pro", category: "Мебель", price: 28900, qty: 2 },
];

export default function CartPage({ onNavigate }: CartPageProps) {
  const [items, setItems] = useState<CartItem[]>(initialItems);
  const [promoCode, setPromoCode] = useState("");
  const [promoApplied, setPromoApplied] = useState(false);

  const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  const discount = promoApplied ? Math.round(subtotal * 0.1) : 0;
  const delivery = 0;
  const total = subtotal - discount + delivery;

  const updateQty = (id: number, delta: number) => {
    setItems(items.map((item) =>
      item.id === id ? { ...item, qty: Math.max(1, item.qty + delta) } : item
    ));
  };

  const removeItem = (id: number) => {
    setItems(items.filter((item) => item.id !== id));
  };

  const applyPromo = () => {
    if (promoCode.toLowerCase() === "korpus10") {
      setPromoApplied(true);
    }
  };

  if (items.length === 0) {
    return (
      <div className="animate-fade-in">
        <div className="border-b border-border bg-secondary/30">
          <div className="container mx-auto px-4 py-3 flex items-center gap-2 text-xs text-muted-foreground font-mono">
            <span className="cursor-pointer hover:text-foreground" onClick={() => onNavigate("home")}>Главная</span>
            <Icon name="ChevronRight" size={12} />
            <span className="text-foreground">Корзина</span>
          </div>
        </div>
        <div className="container mx-auto px-4 py-24 text-center">
          <Icon name="ShoppingCart" size={56} className="mx-auto text-muted-foreground/20 mb-6" />
          <h2 className="text-2xl font-black mb-3">Корзина пуста</h2>
          <p className="text-muted-foreground text-sm mb-8">Добавьте товары из каталога</p>
          <button onClick={() => onNavigate("catalog")} className="btn-primary">Перейти в каталог</button>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="border-b border-border bg-secondary/30">
        <div className="container mx-auto px-4 py-3 flex items-center gap-2 text-xs text-muted-foreground font-mono">
          <span className="cursor-pointer hover:text-foreground" onClick={() => onNavigate("home")}>Главная</span>
          <Icon name="ChevronRight" size={12} />
          <span className="text-foreground">Корзина</span>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <div className="section-label mb-1">Оформление заказа</div>
          <h1 className="text-2xl font-black tracking-tight">Корзина</h1>
        </div>

        {/* Steps */}
        <div className="flex items-center gap-0 mb-10 max-w-lg">
          {["Корзина", "Оформление", "Оплата"].map((step, i) => (
            <div key={step} className="flex items-center">
              <div className={`flex items-center gap-2 ${i === 0 ? "text-foreground" : "text-muted-foreground"}`}>
                <div className={`w-6 h-6 flex items-center justify-center text-xs font-bold font-mono ${i === 0 ? "bg-[hsl(var(--primary))] text-white" : "border border-border"}`}>
                  {i + 1}
                </div>
                <span className="text-sm font-medium hidden sm:block">{step}</span>
              </div>
              {i < 2 && <div className="w-8 sm:w-12 h-px bg-border mx-2" />}
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Items */}
          <div className="lg:col-span-2 space-y-3">
            {items.map((item) => (
              <div key={item.id} className="product-card p-4 flex items-center gap-4">
                <div className="w-16 h-16 bg-secondary flex items-center justify-center shrink-0">
                  <Icon name="Package" size={24} className="text-muted-foreground/30" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="section-label mb-0.5">{item.category}</div>
                  <div className="text-sm font-semibold truncate">{item.name}</div>
                  <div className="text-base font-black mt-1">{(item.price * item.qty).toLocaleString("ru-RU")} ₽</div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => updateQty(item.id, -1)}
                    className="w-7 h-7 border border-border flex items-center justify-center hover:bg-secondary transition-colors"
                  >
                    <Icon name="Minus" size={12} />
                  </button>
                  <span className="w-6 text-center text-sm font-semibold font-mono">{item.qty}</span>
                  <button
                    onClick={() => updateQty(item.id, 1)}
                    className="w-7 h-7 border border-border flex items-center justify-center hover:bg-secondary transition-colors"
                  >
                    <Icon name="Plus" size={12} />
                  </button>
                </div>
                <button
                  onClick={() => removeItem(item.id)}
                  className="text-muted-foreground hover:text-destructive transition-colors ml-2 shrink-0"
                >
                  <Icon name="Trash2" size={15} />
                </button>
              </div>
            ))}

            {/* Promo */}
            <div className="p-4 border border-border bg-secondary/20">
              <div className="section-label mb-3">Промокод</div>
              {promoApplied ? (
                <div className="flex items-center gap-2 text-sm">
                  <Icon name="CheckCircle" size={16} className="text-green-600" />
                  <span className="font-semibold">Промокод KORPUS10 применён — скидка 10%</span>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                    placeholder="Введите промокод"
                    className="flex-1 border border-border px-3 py-2 text-sm bg-background focus:outline-none focus:border-foreground/40 font-mono"
                  />
                  <button onClick={applyPromo} className="btn-outline px-4 py-2 text-sm">Применить</button>
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-2">Попробуйте KORPUS10 для скидки 10%</p>
            </div>
          </div>

          {/* Summary */}
          <div className="lg:sticky lg:top-24 self-start">
            <div className="border border-border bg-card p-6">
              <div className="section-label mb-4">Итого</div>
              <div className="space-y-3 mb-5">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Товары ({items.reduce((s, i) => s + i.qty, 0)} шт.)</span>
                  <span className="font-semibold">{subtotal.toLocaleString("ru-RU")} ₽</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Скидка по промокоду</span>
                    <span className="font-semibold text-green-600">−{discount.toLocaleString("ru-RU")} ₽</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Доставка</span>
                  <span className="font-semibold text-green-600">Бесплатно</span>
                </div>
              </div>
              <div className="divider-rule pt-4 mb-5">
                <div className="flex justify-between items-center">
                  <span className="font-black text-base">К оплате</span>
                  <span className="font-black text-2xl">{total.toLocaleString("ru-RU")} ₽</span>
                </div>
              </div>
              <button className="btn-primary w-full">Оформить заказ</button>
              <button
                onClick={() => onNavigate("catalog")}
                className="w-full mt-3 text-sm text-center text-muted-foreground hover:text-foreground transition-colors"
              >
                Продолжить покупки
              </button>
            </div>

            {/* Trust */}
            <div className="mt-4 space-y-2">
              {[
                { icon: "Shield", text: "Защита покупателя" },
                { icon: "RefreshCw", text: "Возврат 14 дней" },
                { icon: "Truck", text: "Доставка 1–3 дня" },
              ].map((t) => (
                <div key={t.text} className="flex items-center gap-2.5 text-xs text-muted-foreground">
                  <Icon name={t.icon as "Shield"} size={13} />
                  {t.text}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
