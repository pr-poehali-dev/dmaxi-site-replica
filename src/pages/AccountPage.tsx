import { useState } from "react";
import Icon from "@/components/ui/icon";

const orders = [
  { id: "ORD-2024-0892", date: "28.03.2024", status: "Доставлен", items: 3, total: 87400 },
  { id: "ORD-2024-0743", date: "15.03.2024", status: "В пути", items: 1, total: 45600 },
  { id: "ORD-2024-0621", date: "01.03.2024", status: "Доставлен", items: 5, total: 124300 },
];

const notifications = [
  { id: 1, text: "Ваш заказ ORD-2024-0743 передан курьеру", time: "2 часа назад", read: false },
  { id: 2, text: "Новое поступление: Кресла серии Executive Pro", time: "1 день назад", read: false },
  { id: 3, text: "Скидка 15% на оргтехнику до конца месяца", time: "3 дня назад", read: true },
  { id: 4, text: "Ваш отзыв на МФУ Laser Business 3500 опубликован", time: "5 дней назад", read: true },
];

const statusColors: Record<string, string> = {
  "Доставлен": "text-green-700 bg-green-50",
  "В пути": "text-blue-700 bg-blue-50",
  "Обработка": "text-orange-700 bg-orange-50",
};

interface AccountPageProps {
  onNavigate: (page: string) => void;
}

export default function AccountPage({ onNavigate }: AccountPageProps) {
  const [activeTab, setActiveTab] = useState("orders");

  const tabs = [
    { id: "orders", label: "Заказы", icon: "Package" },
    { id: "notifications", label: "Уведомления", icon: "Bell", badge: 2 },
    { id: "reviews", label: "Отзывы", icon: "Star" },
    { id: "settings", label: "Настройки", icon: "Settings" },
  ];

  return (
    <div className="animate-fade-in">
      {/* Breadcrumb */}
      <div className="border-b border-border bg-secondary/30">
        <div className="container mx-auto px-4 py-3 flex items-center gap-2 text-xs text-muted-foreground font-mono">
          <span className="hover:text-foreground cursor-pointer" onClick={() => onNavigate("home")}>Главная</span>
          <Icon name="ChevronRight" size={12} />
          <span className="text-foreground">Личный кабинет</span>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Profile Header */}
        <div className="flex items-center gap-5 mb-8 p-6 border border-border bg-card">
          <div className="w-14 h-14 bg-[hsl(var(--primary))] flex items-center justify-center shrink-0">
            <span className="text-white font-black text-xl font-mono">ИП</span>
          </div>
          <div className="flex-1">
            <h1 className="text-lg font-black">Иван Петров</h1>
            <div className="text-sm text-muted-foreground">ivan@company.ru · ООО «МояКомпания»</div>
            <div className="section-label mt-1">Корпоративный клиент с 2021 года</div>
          </div>
          <div className="hidden sm:flex flex-col items-end gap-1">
            <div className="text-xl font-black">3</div>
            <div className="section-label">Заказа</div>
          </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <aside className="lg:col-span-1">
            <nav className="border border-border bg-card overflow-hidden">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 text-sm font-medium transition-colors border-b border-border last:border-0 ${
                    activeTab === tab.id
                      ? "bg-[hsl(var(--primary))] text-white"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                  }`}
                >
                  <Icon name={tab.icon as "Package"} size={15} />
                  <span className="flex-1 text-left">{tab.label}</span>
                  {tab.badge && (
                    <span className={`w-5 h-5 rounded-full text-xs flex items-center justify-center font-bold ${
                      activeTab === tab.id ? "bg-white/20 text-white" : "bg-[hsl(var(--corp-gold))] text-white"
                    }`}>
                      {tab.badge}
                    </span>
                  )}
                </button>
              ))}
            </nav>
            <button
              onClick={() => onNavigate("home")}
              className="w-full mt-3 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground px-4 py-2 transition-colors"
            >
              <Icon name="LogOut" size={14} />
              Выйти из аккаунта
            </button>
          </aside>

          {/* Content */}
          <div className="lg:col-span-3">
            {activeTab === "orders" && (
              <div>
                <div className="section-label mb-4">История заказов</div>
                <div className="space-y-3">
                  {orders.map((order) => (
                    <div key={order.id} className="product-card p-5">
                      <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div>
                          <div className="font-black font-mono text-sm">{order.id}</div>
                          <div className="text-xs text-muted-foreground mt-1">{order.date} · {order.items} товара</div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${statusColors[order.status] || "bg-secondary text-muted-foreground"}`}>
                            {order.status}
                          </span>
                          <div className="font-black text-sm">{order.total.toLocaleString("ru-RU")} ₽</div>
                        </div>
                      </div>
                      <div className="flex gap-3 mt-4">
                        <button className="text-xs font-medium text-foreground hover:underline">Подробнее</button>
                        {order.status === "Доставлен" && (
                          <button className="text-xs font-medium text-muted-foreground hover:text-foreground">Повторить заказ</button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "notifications" && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="section-label">Уведомления</div>
                  <button className="text-xs text-muted-foreground hover:text-foreground underline">Прочитать все</button>
                </div>
                <div className="space-y-2">
                  {notifications.map((n) => (
                    <div key={n.id} className={`p-4 border border-border flex items-start gap-3 ${!n.read ? "bg-blue-50/50" : "bg-card"}`}>
                      <div className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${!n.read ? "bg-blue-500" : "bg-transparent border border-border"}`} />
                      <div className="flex-1">
                        <div className="text-sm">{n.text}</div>
                        <div className="section-label mt-1">{n.time}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "reviews" && (
              <div>
                <div className="section-label mb-4">Мои отзывы</div>
                <div className="product-card p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="font-semibold text-sm">МФУ Laser Business 3500</div>
                      <div className="flex gap-1 mt-1">
                        {[1,2,3,4,5].map((s) => (
                          <Icon key={s} name="Star" size={12} className="text-[hsl(var(--corp-gold))] fill-[hsl(var(--corp-gold))]" />
                        ))}
                      </div>
                    </div>
                    <div className="section-label">22 марта 2024</div>
                  </div>
                  <p className="text-sm text-muted-foreground">Отличный принтер для офиса. Работает тихо, качество печати на высоте. Уже 3 месяца без проблем.</p>
                </div>
                <div className="mt-6 text-center py-8 border border-dashed border-border">
                  <Icon name="Star" size={28} className="mx-auto text-muted-foreground/30 mb-3" />
                  <div className="text-sm text-muted-foreground">Оставьте отзывы на купленные товары</div>
                  <button onClick={() => onNavigate("catalog")} className="mt-3 text-xs font-medium underline text-foreground">Перейти к покупкам</button>
                </div>
              </div>
            )}

            {activeTab === "settings" && (
              <div>
                <div className="section-label mb-4">Настройки аккаунта</div>
                <div className="space-y-4">
                  {[
                    { label: "Имя и фамилия", val: "Иван Петров" },
                    { label: "Email", val: "ivan@company.ru" },
                    { label: "Телефон", val: "+7 (999) 123-45-67" },
                    { label: "Компания", val: "ООО «МояКомпания»" },
                  ].map((field) => (
                    <div key={field.label}>
                      <label className="section-label mb-1 block">{field.label}</label>
                      <input
                        type="text"
                        defaultValue={field.val}
                        className="w-full border border-border px-4 py-2.5 text-sm bg-background focus:outline-none focus:border-foreground/40"
                      />
                    </div>
                  ))}
                  <button className="btn-primary mt-2">Сохранить изменения</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
