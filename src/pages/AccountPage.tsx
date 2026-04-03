import { useState } from "react";
import Icon from "@/components/ui/icon";

// Личный кабинет клиента
const visits = [
  { id: "V-2024-0431", date: "28.03.2024", service: "Замена масла + фильтр", car: "Toyota Camry", cost: 2400, bonus: 24 },
  { id: "V-2024-0319", date: "15.02.2024", service: "Диагностика ходовой", car: "Toyota Camry", cost: 700, bonus: 7 },
  { id: "V-2024-0201", date: "10.01.2024", service: "Шиномонтаж (4 колеса)", car: "Toyota Camry", cost: 2000, bonus: 20 },
];

const notifications = [
  { text: "Пора на плановое ТО — прошло 8 000 км с последней замены масла", time: "Сегодня", read: false },
  { text: "Ваш визит 28 марта завершён. Начислено 24 бонусных балла", time: "28 марта", read: false },
  { text: "Акция для членов клуба: скидка 15% на шиномонтаж в апреле", time: "25 марта", read: true },
];

const tabs = [
  { id: "history", label: "История визитов", icon: "ClipboardList" },
  { id: "bonus", label: "Бонусы", icon: "Coins" },
  { id: "notifications", label: "Уведомления", icon: "Bell", badge: 2 },
  { id: "settings", label: "Настройки", icon: "Settings" },
];

interface AccountPageProps {
  onNavigate: (p: string) => void;
}

export default function AccountPage({ onNavigate }: AccountPageProps) {
  const [activeTab, setActiveTab] = useState("history");

  const totalBonus = visits.reduce((s, v) => s + v.bonus, 0);
  const totalSpent = visits.reduce((s, v) => s + v.cost, 0);

  return (
    <div className="animate-fade-in">
      <div className="border-b border-border">
        <div className="container mx-auto py-3 flex items-center gap-2 text-xs text-muted-foreground">
          <button onClick={() => onNavigate("home")} className="hover:text-foreground transition-colors font-display uppercase tracking-wide">Главная</button>
          <Icon name="ChevronRight" size={12} />
          <span className="text-foreground font-display uppercase tracking-wide">Личный кабинет</span>
        </div>
      </div>

      {/* Profile header */}
      <div className="bg-card border-b border-border py-8">
        <div className="container mx-auto">
          <div className="flex items-center gap-5 flex-wrap">
            <div className="w-14 h-14 bg-primary flex items-center justify-center shrink-0">
              <span className="text-white font-display font-black text-xl">ИП</span>
            </div>
            <div className="flex-1">
              <h1 className="font-display font-bold text-xl uppercase tracking-wide">Иван Петров</h1>
              <div className="flex items-center gap-3 mt-1 flex-wrap">
                <span className="label-tag">+7 (999) 123-45-67</span>
                <span className="label-tag">Toyota Camry</span>
                <div className="bg-primary text-white px-2 py-0.5 text-[9px] font-display font-bold tracking-widest uppercase">Серебро</div>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="text-center">
                <div className="font-display font-bold text-2xl text-primary">{totalBonus}</div>
                <div className="label-tag">баллов</div>
              </div>
              <div className="w-px bg-border" />
              <div className="text-center">
                <div className="font-display font-bold text-2xl">{visits.length}</div>
                <div className="label-tag">визита</div>
              </div>
              <div className="w-px bg-border" />
              <div className="text-center">
                <div className="font-display font-bold text-2xl">{(totalSpent / 1000).toFixed(0)}к</div>
                <div className="label-tag">потрачено</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto section-py">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <aside className="lg:col-span-1">
            <nav className="card-dark overflow-hidden">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-5 py-3.5 border-b border-border last:border-0 transition-colors ${
                    activeTab === tab.id
                      ? "bg-primary text-white"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/30"
                  }`}
                >
                  <Icon name={tab.icon as "ClipboardList"} size={15} />
                  <span className="flex-1 text-left font-display text-xs uppercase tracking-wide">{tab.label}</span>
                  {tab.badge && (
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      activeTab === tab.id ? "bg-white/20 text-white" : "bg-primary text-white"
                    }`}>{tab.badge}</span>
                  )}
                </button>
              ))}
            </nav>
            <button
              onClick={() => onNavigate("home")}
              className="w-full mt-3 flex items-center gap-2 text-xs text-muted-foreground hover:text-primary px-5 py-2.5 transition-colors font-display uppercase tracking-wide"
            >
              <Icon name="LogOut" size={13} />
              Выйти
            </button>
          </aside>

          {/* Content */}
          <div className="lg:col-span-3">
            {activeTab === "history" && (
              <div>
                <div className="label-tag mb-5">История обслуживания</div>
                <div className="space-y-3">
                  {visits.map((v) => (
                    <div key={v.id} className="card-dark p-5 flex items-center gap-5 flex-wrap">
                      <div className="flex-1 min-w-0">
                        <div className="font-display font-bold text-sm uppercase tracking-wide">{v.service}</div>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="label-tag">{v.date}</span>
                          <span className="label-tag">{v.car}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 shrink-0">
                        <div className="text-right">
                          <div className="font-display font-bold text-sm">{v.cost.toLocaleString("ru-RU")} ₽</div>
                          <div className="label-tag text-primary">+{v.bonus} баллов</div>
                        </div>
                        <div className="font-mono text-xs text-muted-foreground/50">{v.id}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-6 text-center">
                  <button onClick={() => onNavigate("booking")} className="btn-red">
                    <Icon name="CalendarCheck" size={16} />
                    Записаться снова
                  </button>
                </div>
              </div>
            )}

            {activeTab === "bonus" && (
              <div>
                <div className="label-tag mb-5">Бонусный счёт</div>
                <div className="grid sm:grid-cols-3 gap-4 mb-8">
                  {[
                    { val: totalBonus, label: "баллов на счёте", sub: "1 балл = 1 ₽" },
                    { val: "5%", label: "текущая скидка", sub: "Уровень: Серебро" },
                    { val: "850", label: "баллов до Золота", sub: "Накопите ещё" },
                  ].map((s, i) => (
                    <div key={i} className="card-dark p-5 text-center border-t-2 border-t-primary">
                      <div className="font-display font-bold text-3xl text-primary">{s.val}</div>
                      <div className="text-sm mt-1">{s.label}</div>
                      <div className="label-tag mt-1">{s.sub}</div>
                    </div>
                  ))}
                </div>
                <div className="card-dark p-5">
                  <div className="label-tag mb-4">Прогресс до следующего уровня</div>
                  <div className="flex items-center gap-4">
                    <span className="label-tag shrink-0">Серебро</span>
                    <div className="flex-1 h-2 bg-secondary relative">
                      <div className="absolute left-0 top-0 h-full bg-primary" style={{ width: "46%" }} />
                    </div>
                    <span className="label-tag shrink-0 text-primary">Золото</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-3">Ещё 850 баллов до уровня «Золото» со скидкой 10%</p>
                </div>
              </div>
            )}

            {activeTab === "notifications" && (
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div className="label-tag">Уведомления</div>
                  <button className="text-xs text-muted-foreground hover:text-primary underline transition-colors">Прочитать все</button>
                </div>
                <div className="space-y-2">
                  {notifications.map((n, i) => (
                    <div key={i} className={`card-dark p-5 flex items-start gap-3 ${!n.read ? "border-primary/30" : ""}`}>
                      <div className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${!n.read ? "bg-primary" : "bg-border"}`} />
                      <div className="flex-1">
                        <p className="text-sm">{n.text}</p>
                        <div className="label-tag mt-1">{n.time}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "settings" && (
              <div>
                <div className="label-tag mb-5">Настройки профиля</div>
                <div className="card-dark p-6 space-y-4">
                  {[
                    { label: "Имя", val: "Иван Петров", type: "text" },
                    { label: "Телефон", val: "+7 (999) 123-45-67", type: "tel" },
                    { label: "Email", val: "ivan@mail.ru", type: "email" },
                    { label: "Автомобиль", val: "Toyota Camry 2019", type: "text" },
                  ].map((f) => (
                    <div key={f.label}>
                      <label className="label-tag mb-1.5 block">{f.label}</label>
                      <input type={f.type} defaultValue={f.val} className="input-dark" />
                    </div>
                  ))}
                  <button className="btn-red mt-2">Сохранить</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
