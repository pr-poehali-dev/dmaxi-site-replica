import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { useAuth } from "@/context/AuthContext";

const AUTH_URL = "https://functions.poehali.dev/3e75355e-bbd8-4e2b-b8cd-aa607ff82304";

interface Visit {
  id: number;
  visit_number: string;
  service: string;
  car: string;
  cost: number;
  bonus_earned: number;
  status: string;
  visit_date: string;
  notes?: string;
}

const LEVEL_LABELS: Record<string, string> = {
  bronze: "Бронза",
  silver: "Серебро",
  gold: "Золото",
  platinum: "Платинум",
};

const LEVEL_COLORS: Record<string, string> = {
  bronze: "bg-amber-700",
  silver: "bg-gray-400",
  gold: "bg-yellow-500",
  platinum: "bg-purple-500",
};

const LEVEL_DISCOUNT: Record<string, number> = {
  bronze: 3,
  silver: 5,
  gold: 10,
  platinum: 15,
};

const LEVEL_THRESHOLD: Record<string, number> = {
  bronze: 500,
  silver: 2000,
  gold: 5000,
  platinum: 999999,
};

const tabs = [
  { id: "history", label: "История", icon: "ClipboardList" },
  { id: "bonus", label: "Бонусы", icon: "Star" },
  { id: "cars", label: "Автомобили", icon: "Car" },
  { id: "notifications", label: "Уведомления", icon: "Bell", badge: 2 },
  { id: "settings", label: "Настройки", icon: "Settings" },
];

interface AccountPageProps {
  onNavigate: (p: string) => void;
}

export default function AccountPage({ onNavigate }: AccountPageProps) {
  const { user, token, logout, updateProfile } = useAuth();
  const [activeTab, setActiveTab] = useState("history");
  const [visits, setVisits] = useState<Visit[]>([]);
  const [visitsLoading, setVisitsLoading] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    car_model: user?.car_model || "",
    car_year: user?.car_year || "",
    car_vin: user?.car_vin || "",
    new_password: "",
    confirm_password: "",
  });
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || "",
        email: user.email || "",
        car_model: user.car_model || "",
        car_year: user.car_year || "",
        car_vin: user.car_vin || "",
        new_password: "",
        confirm_password: "",
      });
    }
  }, [user]);

  useEffect(() => {
    if (activeTab === "history" && token) {
      setVisitsLoading(true);
      fetch(`${AUTH_URL}?action=profile`, { headers: { "X-Auth-Token": token } })
        .then(() => {
          if (user) {
            return fetch(`https://functions.poehali.dev/6e67d0ba-38ba-488e-8380-36b54668214b?action=users&path=/users/${user.id}/visits`, {
              headers: { "X-Auth-Token": token }
            });
          }
        })
        .catch(() => {})
        .finally(() => setVisitsLoading(false));
    }
  }, [activeTab, token]);

  if (!user) {
    return (
      <div className="animate-fade-in min-h-[70vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-primary/10 border border-primary/30 flex items-center justify-center mx-auto mb-5">
            <Icon name="LogIn" size={28} className="text-primary" />
          </div>
          <h2 className="font-display font-bold text-xl uppercase mb-3">Требуется авторизация</h2>
          <p className="text-muted-foreground text-sm mb-6">Войдите или зарегистрируйтесь для доступа к личному кабинету</p>
          <button onClick={() => onNavigate("login")} className="btn-red">
            <Icon name="LogIn" size={16} />
            Войти / Зарегистрироваться
          </button>
        </div>
      </div>
    );
  }

  const level = user.club_level || "bronze";
  const nextLevel = level === "bronze" ? "silver" : level === "silver" ? "gold" : level === "gold" ? "platinum" : null;
  const nextThreshold = nextLevel ? LEVEL_THRESHOLD[level] : null;
  const progress = nextThreshold ? Math.min((user.bonus_points / nextThreshold) * 100, 100) : 100;

  const initials = user.name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (profileForm.new_password && profileForm.new_password !== profileForm.confirm_password) {
      setSaveMsg("Пароли не совпадают");
      return;
    }
    setSaveLoading(true);
    setSaveMsg("");
    try {
      await updateProfile({
        name: profileForm.name,
        email: profileForm.email,
        car_model: profileForm.car_model,
        car_year: profileForm.car_year,
        car_vin: profileForm.car_vin,
        ...(profileForm.new_password ? { new_password: profileForm.new_password } : {}),
      });
      setSaveMsg("Данные сохранены!");
      setProfileForm((p) => ({ ...p, new_password: "", confirm_password: "" }));
    } catch (err: unknown) {
      setSaveMsg(err instanceof Error ? err.message : "Ошибка сохранения");
    } finally {
      setSaveLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    onNavigate("home");
  };

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
              <span className="text-white font-display font-black text-xl">{initials}</span>
            </div>
            <div className="flex-1">
              <h1 className="font-display font-bold text-xl uppercase tracking-wide">{user.name}</h1>
              <div className="flex items-center gap-3 mt-1 flex-wrap">
                <span className="label-tag">{user.phone}</span>
                {user.car_model && <span className="label-tag">{user.car_model}</span>}
                <div className={`${LEVEL_COLORS[level]} text-white px-2 py-0.5 text-[9px] font-display font-bold tracking-widest uppercase`}>
                  {LEVEL_LABELS[level]}
                </div>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="text-center">
                <div className="font-display font-bold text-2xl text-primary">{user.bonus_points}</div>
                <div className="label-tag">баллов</div>
              </div>
              <div className="w-px bg-border" />
              <div className="text-center">
                <div className="font-display font-bold text-2xl">{LEVEL_DISCOUNT[level]}%</div>
                <div className="label-tag">скидка</div>
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
            {user.role === "admin" && (
              <button
                onClick={() => onNavigate("admin")}
                className="w-full mt-3 flex items-center gap-2 text-xs text-primary hover:text-primary/80 px-5 py-2.5 transition-colors font-display uppercase tracking-wide border border-primary/30 hover:bg-primary/5"
              >
                <Icon name="Shield" size={13} />
                Панель администратора
              </button>
            )}
            <button
              onClick={handleLogout}
              className="w-full mt-2 flex items-center gap-2 text-xs text-muted-foreground hover:text-primary px-5 py-2.5 transition-colors font-display uppercase tracking-wide"
            >
              <Icon name="LogOut" size={13} />
              Выйти
            </button>
          </aside>

          {/* Content */}
          <div className="lg:col-span-3">

            {/* ИСТОРИЯ */}
            {activeTab === "history" && (
              <div>
                <div className="label-tag mb-5">История обслуживания</div>
                {visitsLoading ? (
                  <div className="card-dark p-10 text-center text-muted-foreground">
                    <Icon name="Loader2" size={24} className="animate-spin mx-auto mb-3" />
                    <p className="text-sm">Загружаем историю...</p>
                  </div>
                ) : visits.length === 0 ? (
                  <div className="card-dark p-10 text-center">
                    <Icon name="ClipboardList" size={32} className="text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-display font-bold uppercase tracking-wide mb-2">Визитов пока нет</h3>
                    <p className="text-sm text-muted-foreground mb-6">Запишитесь на первое обслуживание и история появится здесь</p>
                    <button onClick={() => onNavigate("booking")} className="btn-red">
                      <Icon name="CalendarCheck" size={16} />
                      Записаться
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="space-y-3">
                      {visits.map((v) => (
                        <div key={v.id} className="card-dark p-5 flex items-center gap-5 flex-wrap">
                          <div className="flex-1 min-w-0">
                            <div className="font-display font-bold text-sm uppercase tracking-wide">{v.service}</div>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="label-tag">{v.visit_date}</span>
                              {v.car && <span className="label-tag">{v.car}</span>}
                              <span className={`label-tag ${v.status === "completed" ? "text-green-500" : v.status === "cancelled" ? "text-red-400" : "text-yellow-500"}`}>
                                {v.status === "completed" ? "Завершён" : v.status === "cancelled" ? "Отменён" : v.status === "in_progress" ? "В работе" : "Запланирован"}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 shrink-0">
                            <div className="text-right">
                              <div className="font-display font-bold text-sm">{v.cost.toLocaleString("ru-RU")} ₽</div>
                              <div className="label-tag text-primary">+{v.bonus_earned} баллов</div>
                            </div>
                            <div className="font-mono text-xs text-muted-foreground/50">{v.visit_number}</div>
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
                  </>
                )}
              </div>
            )}

            {/* БОНУСЫ */}
            {activeTab === "bonus" && (
              <div>
                <div className="label-tag mb-5">Бонусный счёт</div>
                <div className="grid sm:grid-cols-3 gap-4 mb-8">
                  {[
                    { val: user.bonus_points, label: "баллов на счёте", sub: "1 балл = 1 ₽" },
                    { val: `${LEVEL_DISCOUNT[level]}%`, label: "текущая скидка", sub: `Уровень: ${LEVEL_LABELS[level]}` },
                    { val: nextLevel ? `${(nextThreshold! - user.bonus_points).toLocaleString()}` : "—", label: "баллов до след. уровня", sub: nextLevel ? `До уровня ${LEVEL_LABELS[nextLevel]}` : "Максимальный уровень!" },
                  ].map((s, i) => (
                    <div key={i} className="card-dark p-5 text-center border-t-2 border-t-primary">
                      <div className="font-display font-bold text-3xl text-primary">{s.val}</div>
                      <div className="text-sm mt-1">{s.label}</div>
                      <div className="label-tag mt-1">{s.sub}</div>
                    </div>
                  ))}
                </div>
                {nextLevel && (
                  <div className="card-dark p-5 mb-6">
                    <div className="label-tag mb-4">Прогресс до уровня «{LEVEL_LABELS[nextLevel]}»</div>
                    <div className="flex items-center gap-4">
                      <span className="label-tag shrink-0">{LEVEL_LABELS[level]}</span>
                      <div className="flex-1 h-2 bg-secondary relative">
                        <div className="absolute left-0 top-0 h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
                      </div>
                      <span className="label-tag shrink-0 text-primary">{LEVEL_LABELS[nextLevel]}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-3">
                      Ещё {(nextThreshold! - user.bonus_points).toLocaleString()} баллов до уровня «{LEVEL_LABELS[nextLevel]}» со скидкой {LEVEL_DISCOUNT[nextLevel]}%
                    </p>
                  </div>
                )}
                <div className="card-dark p-5">
                  <div className="label-tag mb-4">Уровни клуба DD MAXI</div>
                  <div className="space-y-3">
                    {Object.entries(LEVEL_LABELS).map(([k, v]) => (
                      <div key={k} className={`flex items-center gap-4 p-3 ${k === level ? "bg-primary/10 border border-primary/30" : "border border-border"}`}>
                        <div className={`${LEVEL_COLORS[k]} w-3 h-3 rounded-full shrink-0`} />
                        <div className="flex-1">
                          <span className="font-display font-bold text-sm tracking-wide">{v}</span>
                        </div>
                        <div className="label-tag">{LEVEL_DISCOUNT[k]}% скидка</div>
                        <div className="label-tag text-muted-foreground">от {k === "bronze" ? "0" : LEVEL_THRESHOLD[k === "silver" ? "bronze" : k === "gold" ? "silver" : "gold"].toLocaleString()} баллов</div>
                        {k === level && <Icon name="Check" size={14} className="text-primary" />}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* АВТОМОБИЛИ */}
            {activeTab === "cars" && (
              <div>
                <div className="label-tag mb-5">Мои автомобили</div>
                <div className="card-dark p-6 mb-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-primary/10 border border-primary/30 flex items-center justify-center shrink-0">
                      <Icon name="Car" size={24} className="text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="font-display font-bold text-base uppercase tracking-wide">
                        {user.car_model || "Автомобиль не добавлен"}
                      </div>
                      {user.car_year && <div className="label-tag mt-1">Год: {user.car_year}</div>}
                      {user.car_vin && <div className="label-tag mt-1">VIN: {user.car_vin}</div>}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-4">
                    Для изменения данных автомобиля перейдите в раздел «Настройки»
                  </p>
                </div>
                <button onClick={() => setActiveTab("settings")} className="btn-ghost text-sm">
                  <Icon name="Edit" size={15} />
                  Изменить данные авто
                </button>
              </div>
            )}

            {/* УВЕДОМЛЕНИЯ */}
            {activeTab === "notifications" && (
              <div>
                <div className="label-tag mb-5">Уведомления</div>
                <div className="space-y-3">
                  {[
                    { text: "Акция: скидка 15% на шиномонтаж в этом месяце для членов клуба", time: "Сегодня", read: false, icon: "Tag" },
                    { text: "Напоминание: пора на плановое ТО (8 000 км с последней замены масла)", time: "Вчера", read: false, icon: "AlertCircle" },
                    { text: "Добро пожаловать в клуб DD MAXI! Ваши бонусы активированы.", time: "При регистрации", read: true, icon: "CheckCircle" },
                  ].map((n, i) => (
                    <div key={i} className={`card-dark p-4 flex gap-4 ${!n.read ? "border-l-2 border-l-primary" : ""}`}>
                      <Icon name={n.icon as "Tag"} size={18} className={n.read ? "text-muted-foreground" : "text-primary"} />
                      <div className="flex-1">
                        <p className={`text-sm ${n.read ? "text-muted-foreground" : "text-foreground"}`}>{n.text}</p>
                        <div className="label-tag mt-1">{n.time}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* НАСТРОЙКИ */}
            {activeTab === "settings" && (
              <div>
                <div className="label-tag mb-5">Настройки профиля</div>
                <form onSubmit={handleSaveProfile} className="card-dark p-6 space-y-5">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="label-tag mb-1.5 block">Имя *</label>
                      <input
                        required
                        type="text"
                        value={profileForm.name}
                        onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                        className="input-dark"
                        placeholder="Ваше имя"
                      />
                    </div>
                    <div>
                      <label className="label-tag mb-1.5 block">Email</label>
                      <input
                        type="email"
                        value={profileForm.email}
                        onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                        className="input-dark"
                        placeholder="your@email.com"
                      />
                    </div>
                  </div>

                  <div className="pt-2 border-t border-border">
                    <div className="label-tag mb-3">Данные автомобиля</div>
                    <div className="grid sm:grid-cols-3 gap-4">
                      <div className="sm:col-span-1">
                        <label className="label-tag mb-1.5 block">Марка и модель</label>
                        <input
                          type="text"
                          value={profileForm.car_model}
                          onChange={(e) => setProfileForm({ ...profileForm, car_model: e.target.value })}
                          className="input-dark"
                          placeholder="Toyota Camry"
                        />
                      </div>
                      <div>
                        <label className="label-tag mb-1.5 block">Год выпуска</label>
                        <input
                          type="text"
                          value={profileForm.car_year}
                          onChange={(e) => setProfileForm({ ...profileForm, car_year: e.target.value })}
                          className="input-dark"
                          placeholder="2020"
                        />
                      </div>
                      <div>
                        <label className="label-tag mb-1.5 block">VIN номер</label>
                        <input
                          type="text"
                          value={profileForm.car_vin}
                          onChange={(e) => setProfileForm({ ...profileForm, car_vin: e.target.value })}
                          className="input-dark"
                          placeholder="XTA21..."
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-border">
                    <div className="label-tag mb-3">Сменить пароль</div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="label-tag mb-1.5 block">Новый пароль</label>
                        <input
                          type="password"
                          value={profileForm.new_password}
                          onChange={(e) => setProfileForm({ ...profileForm, new_password: e.target.value })}
                          className="input-dark"
                          placeholder="Минимум 6 символов"
                        />
                      </div>
                      <div>
                        <label className="label-tag mb-1.5 block">Повторите пароль</label>
                        <input
                          type="password"
                          value={profileForm.confirm_password}
                          onChange={(e) => setProfileForm({ ...profileForm, confirm_password: e.target.value })}
                          className="input-dark"
                          placeholder="Повторите пароль"
                        />
                      </div>
                    </div>
                  </div>

                  {saveMsg && (
                    <div className={`text-xs px-3 py-2 rounded ${saveMsg.includes("сохранены") ? "bg-green-500/10 border border-green-500/30 text-green-500" : "bg-destructive/10 border border-destructive/30 text-destructive"}`}>
                      {saveMsg}
                    </div>
                  )}

                  <button type="submit" disabled={saveLoading} className="btn-red disabled:opacity-60">
                    {saveLoading ? (
                      <span className="flex items-center gap-2">
                        <Icon name="Loader2" size={15} className="animate-spin" />
                        Сохраняем...
                      </span>
                    ) : (
                      <>
                        <Icon name="Save" size={15} />
                        Сохранить изменения
                      </>
                    )}
                  </button>
                </form>

                <div className="mt-4 card-dark p-5">
                  <div className="label-tag mb-3 text-muted-foreground">Опасная зона</div>
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                      <p className="text-sm font-medium">Выйти из аккаунта</p>
                      <p className="text-xs text-muted-foreground">Завершить текущую сессию</p>
                    </div>
                    <button onClick={handleLogout} className="btn-ghost text-sm text-destructive border-destructive/30 hover:bg-destructive/10">
                      <Icon name="LogOut" size={15} />
                      Выйти
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}