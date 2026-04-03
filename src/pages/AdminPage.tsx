import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { useAuth } from "@/context/AuthContext";

const ADMIN_URL = "https://functions.poehali.dev/6e67d0ba-38ba-488e-8380-36b54668214b";
const MAILER_URL = "https://functions.poehali.dev/093c15a5-d14e-4c9e-8c01-38296645286f";

interface AdminUser {
  id: number;
  name: string;
  phone: string;
  email?: string;
  role: string;
  car_model?: string;
  bonus_points: number;
  club_level: string;
  is_active: boolean;
  created_at: string;
  last_login?: string;
}

interface AdminVisit {
  id: number;
  visit_number: string;
  service: string;
  car?: string;
  cost: number;
  bonus_earned: number;
  status: string;
  visit_date: string;
  user_name?: string;
  user_phone?: string;
}

interface Stats {
  total_users: number;
  new_users_month: number;
  total_visits: number;
  month_revenue: number;
  total_bonus_issued: number;
  blocked_users: number;
}

const LEVEL_LABELS: Record<string, string> = {
  bronze: "Бронза", silver: "Серебро", gold: "Золото", platinum: "Платинум",
};

const STATUS_LABELS: Record<string, string> = {
  completed: "Завершён", in_progress: "В работе", scheduled: "Запланирован", cancelled: "Отменён",
};

const adminTabs = [
  { id: "stats", label: "Дашборд", icon: "BarChart3" },
  { id: "users", label: "Пользователи", icon: "Users" },
  { id: "visits", label: "Визиты", icon: "CalendarCheck" },
  { id: "add_visit", label: "Добавить визит", icon: "Plus" },
  { id: "mailing", label: "Рассылка", icon: "Send" },
];

interface AdminPageProps {
  onNavigate: (p: string) => void;
}

export default function AdminPage({ onNavigate }: AdminPageProps) {
  const { user, token } = useAuth();
  const [activeTab, setActiveTab] = useState("stats");
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [visits, setVisits] = useState<AdminVisit[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [editUser, setEditUser] = useState<AdminUser | null>(null);
  const [editSaving, setEditSaving] = useState(false);
  const [editMsg, setEditMsg] = useState("");

  const [visitForm, setVisitForm] = useState({
    user_id: "",
    service: "",
    cost: "",
    car: "",
    status: "completed",
    notes: "",
    visit_date: new Date().toISOString().split("T")[0],
  });
  const [visitSaving, setVisitSaving] = useState(false);
  const [visitMsg, setVisitMsg] = useState("");

  const [mailForm, setMailForm] = useState({ subject: "", message: "", user_id: "", type: "broadcast" });
  const [mailSending, setMailSending] = useState(false);
  const [mailMsg, setMailMsg] = useState("");

  const authHeaders = useCallback(() => ({
    "Content-Type": "application/json",
    "X-Auth-Token": token || "",
  }), [token]);

  const loadStats = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${ADMIN_URL}?action=stats`, { headers: authHeaders() });
      const data = await res.json();
      if (res.ok) setStats(data);
    } finally {
      setLoading(false);
    }
  }, [authHeaders]);

  const loadUsers = useCallback(async (q = "") => {
    setLoading(true);
    try {
      const res = await fetch(`${ADMIN_URL}?action=users&search=${encodeURIComponent(q)}`, { headers: authHeaders() });
      const data = await res.json();
      if (res.ok) setUsers(data.users || []);
    } finally {
      setLoading(false);
    }
  }, [authHeaders]);

  const loadVisits = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${ADMIN_URL}?action=visits`, { headers: authHeaders() });
      const data = await res.json();
      if (res.ok) setVisits(data.visits || []);
    } finally {
      setLoading(false);
    }
  }, [authHeaders]);

  useEffect(() => {
    if (!token) return;
    if (activeTab === "stats") loadStats();
    if (activeTab === "users") loadUsers();
    if (activeTab === "visits") loadVisits();
  }, [activeTab, token, loadStats, loadUsers, loadVisits]);

  if (!user || user.role !== "admin") {
    return (
      <div className="animate-fade-in min-h-[70vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-destructive/10 border border-destructive/30 flex items-center justify-center mx-auto mb-5">
            <Icon name="ShieldOff" size={28} className="text-destructive" />
          </div>
          <h2 className="font-display font-bold text-xl uppercase mb-3">Доступ запрещён</h2>
          <p className="text-sm text-muted-foreground mb-6">Эта страница доступна только администраторам</p>
          <button onClick={() => onNavigate("home")} className="btn-red">
            <Icon name="Home" size={16} />
            На главную
          </button>
        </div>
      </div>
    );
  }

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUser) return;
    setEditSaving(true);
    setEditMsg("");
    try {
      const res = await fetch(`${ADMIN_URL}?action=user&id=${editUser.id}`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify(editUser),
      });
      const data = await res.json();
      if (res.ok) {
        setEditMsg("Сохранено!");
        loadUsers(search);
        setTimeout(() => { setEditUser(null); setEditMsg(""); }, 1200);
      } else {
        setEditMsg(data.error || "Ошибка");
      }
    } finally {
      setEditSaving(false);
    }
  };

  const handleAddVisit = async (e: React.FormEvent) => {
    e.preventDefault();
    setVisitSaving(true);
    setVisitMsg("");
    try {
      const res = await fetch(`${ADMIN_URL}?action=visits`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          user_id: parseInt(visitForm.user_id),
          service: visitForm.service,
          cost: parseFloat(visitForm.cost),
          car: visitForm.car,
          status: visitForm.status,
          notes: visitForm.notes,
          visit_date: visitForm.visit_date,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setVisitMsg(`Визит ${data.visit_number} добавлен!`);
        setVisitForm({ user_id: "", service: "", cost: "", car: "", status: "completed", notes: "", visit_date: new Date().toISOString().split("T")[0] });
      } else {
        setVisitMsg(data.error || "Ошибка");
      }
    } finally {
      setVisitSaving(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="border-b border-border">
        <div className="container mx-auto py-3 flex items-center gap-2 text-xs text-muted-foreground">
          <button onClick={() => onNavigate("home")} className="hover:text-foreground transition-colors font-display uppercase tracking-wide">Главная</button>
          <Icon name="ChevronRight" size={12} />
          <span className="text-foreground font-display uppercase tracking-wide">Панель администратора</span>
        </div>
      </div>

      <div className="bg-card border-b border-border py-6">
        <div className="container mx-auto flex items-center gap-4 flex-wrap">
          <div className="w-12 h-12 bg-primary flex items-center justify-center shrink-0">
            <Icon name="Shield" size={22} className="text-white" />
          </div>
          <div>
            <h1 className="font-display font-bold text-xl uppercase tracking-wide">Администратор</h1>
            <div className="label-tag">{user.name} · {user.phone}</div>
          </div>
          <div className="ml-auto">
            <button onClick={() => onNavigate("account")} className="btn-ghost text-xs py-2 px-4">
              <Icon name="User" size={14} />
              Мой кабинет
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto section-py">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <aside className="lg:col-span-1">
            <nav className="card-dark overflow-hidden">
              {adminTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-5 py-3.5 border-b border-border last:border-0 transition-colors ${
                    activeTab === tab.id
                      ? "bg-primary text-white"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/30"
                  }`}
                >
                  <Icon name={tab.icon as "BarChart3"} size={15} />
                  <span className="flex-1 text-left font-display text-xs uppercase tracking-wide">{tab.label}</span>
                </button>
              ))}
            </nav>
          </aside>

          {/* Content */}
          <div className="lg:col-span-3">

            {/* ДАШБОРД */}
            {activeTab === "stats" && (
              <div>
                <div className="label-tag mb-5">Статистика сайта</div>
                {loading && !stats ? (
                  <div className="card-dark p-10 text-center">
                    <Icon name="Loader2" size={24} className="animate-spin mx-auto mb-3 text-primary" />
                    <p className="text-sm text-muted-foreground">Загружаем данные...</p>
                  </div>
                ) : stats ? (
                  <>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
                      {[
                        { val: stats.total_users, label: "Всего клиентов", icon: "Users", color: "text-blue-400" },
                        { val: stats.new_users_month, label: "Новых за месяц", icon: "UserPlus", color: "text-green-400" },
                        { val: stats.total_visits, label: "Всего визитов", icon: "CalendarCheck", color: "text-yellow-400" },
                        { val: `${stats.month_revenue.toLocaleString("ru-RU")} ₽`, label: "Выручка за месяц", icon: "Banknote", color: "text-primary" },
                        { val: stats.total_bonus_issued, label: "Выдано баллов", icon: "Star", color: "text-purple-400" },
                        { val: stats.blocked_users, label: "Заблокировано", icon: "UserX", color: "text-red-400" },
                      ].map((s, i) => (
                        <div key={i} className="card-dark p-5 border-t-2 border-t-border hover:border-t-primary transition-colors">
                          <Icon name={s.icon as "Users"} size={20} className={`${s.color} mb-3`} />
                          <div className={`font-display font-bold text-2xl ${s.color}`}>{s.val}</div>
                          <div className="label-tag mt-1">{s.label}</div>
                        </div>
                      ))}
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="card-dark p-5">
                        <div className="label-tag mb-3">Быстрые действия</div>
                        <div className="space-y-2">
                          <button onClick={() => setActiveTab("users")} className="w-full flex items-center gap-3 text-left px-3 py-2.5 hover:bg-secondary/30 transition-colors text-sm">
                            <Icon name="Users" size={15} className="text-muted-foreground" />
                            Управление пользователями
                          </button>
                          <button onClick={() => setActiveTab("add_visit")} className="w-full flex items-center gap-3 text-left px-3 py-2.5 hover:bg-secondary/30 transition-colors text-sm">
                            <Icon name="Plus" size={15} className="text-muted-foreground" />
                            Добавить визит
                          </button>
                          <button onClick={() => setActiveTab("visits")} className="w-full flex items-center gap-3 text-left px-3 py-2.5 hover:bg-secondary/30 transition-colors text-sm">
                            <Icon name="CalendarCheck" size={15} className="text-muted-foreground" />
                            Все визиты
                          </button>
                        </div>
                      </div>
                      <div className="card-dark p-5">
                        <div className="label-tag mb-3">Информация</div>
                        <div className="space-y-2 text-xs text-muted-foreground">
                          <p>• Роль: <span className="text-primary font-bold">Администратор</span></p>
                          <p>• Полный доступ к управлению пользователями</p>
                          <p>• Просмотр и редактирование визитов</p>
                          <p>• Управление бонусными баллами</p>
                          <p>• Блокировка/разблокировка аккаунтов</p>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="card-dark p-6 text-center text-muted-foreground">Нет данных</div>
                )}
              </div>
            )}

            {/* ПОЛЬЗОВАТЕЛИ */}
            {activeTab === "users" && (
              <div>
                <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
                  <div className="label-tag">Пользователи ({users.length})</div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && loadUsers(search)}
                      className="input-dark py-2 px-3 text-xs w-48"
                      placeholder="Поиск по имени / телефону"
                    />
                    <button onClick={() => loadUsers(search)} className="btn-red py-2 px-4 text-xs">
                      <Icon name="Search" size={14} />
                    </button>
                  </div>
                </div>

                {loading ? (
                  <div className="card-dark p-10 text-center">
                    <Icon name="Loader2" size={24} className="animate-spin mx-auto text-primary" />
                  </div>
                ) : (
                  <div className="space-y-2">
                    {users.map((u) => (
                      <div key={u.id} className="card-dark p-4 flex items-center gap-4 flex-wrap">
                        <div className="w-10 h-10 bg-primary/10 border border-primary/30 flex items-center justify-center shrink-0 text-sm font-display font-bold text-primary">
                          {u.name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-display font-bold text-sm tracking-wide flex items-center gap-2">
                            {u.name}
                            {u.role === "admin" && (
                              <span className="bg-primary text-white text-[9px] px-1.5 py-0.5 font-bold uppercase tracking-wide">Админ</span>
                            )}
                            {!u.is_active && (
                              <span className="bg-destructive/20 text-destructive text-[9px] px-1.5 py-0.5 font-bold uppercase tracking-wide">Заблокирован</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className="label-tag">{u.phone}</span>
                            {u.car_model && <span className="label-tag">{u.car_model}</span>}
                            <span className="label-tag text-primary">{u.bonus_points} баллов · {LEVEL_LABELS[u.club_level] || u.club_level}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => { setEditUser({ ...u }); setEditMsg(""); }}
                          className="btn-ghost text-xs py-1.5 px-3 shrink-0"
                        >
                          <Icon name="Edit" size={13} />
                          Изменить
                        </button>
                      </div>
                    ))}
                    {users.length === 0 && (
                      <div className="card-dark p-8 text-center text-muted-foreground">
                        <Icon name="Users" size={24} className="mx-auto mb-3" />
                        <p className="text-sm">Пользователей нет</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Edit user modal */}
                {editUser && (
                  <div className="fixed inset-0 bg-background/80 backdrop-blur z-50 flex items-center justify-center p-4">
                    <div className="card-dark w-full max-w-lg overflow-y-auto max-h-[90vh]">
                      <div className="flex items-center justify-between p-5 border-b border-border">
                        <div className="font-display font-bold uppercase tracking-wide">Редактировать пользователя</div>
                        <button onClick={() => setEditUser(null)} className="text-muted-foreground hover:text-foreground">
                          <Icon name="X" size={18} />
                        </button>
                      </div>
                      <form onSubmit={handleSaveUser} className="p-5 space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="label-tag mb-1.5 block">Имя</label>
                            <input type="text" value={editUser.name} onChange={(e) => setEditUser({ ...editUser, name: e.target.value })} className="input-dark" />
                          </div>
                          <div>
                            <label className="label-tag mb-1.5 block">Телефон</label>
                            <input type="text" value={editUser.phone} onChange={(e) => setEditUser({ ...editUser, phone: e.target.value })} className="input-dark" />
                          </div>
                        </div>
                        <div>
                          <label className="label-tag mb-1.5 block">Email</label>
                          <input type="email" value={editUser.email || ""} onChange={(e) => setEditUser({ ...editUser, email: e.target.value })} className="input-dark" />
                        </div>
                        <div>
                          <label className="label-tag mb-1.5 block">Автомобиль</label>
                          <input type="text" value={editUser.car_model || ""} onChange={(e) => setEditUser({ ...editUser, car_model: e.target.value })} className="input-dark" />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="label-tag mb-1.5 block">Бонусные баллы</label>
                            <input type="number" value={editUser.bonus_points} onChange={(e) => setEditUser({ ...editUser, bonus_points: parseInt(e.target.value) || 0 })} className="input-dark" />
                          </div>
                          <div>
                            <label className="label-tag mb-1.5 block">Уровень клуба</label>
                            <select value={editUser.club_level} onChange={(e) => setEditUser({ ...editUser, club_level: e.target.value })} className="input-dark">
                              <option value="bronze">Бронза</option>
                              <option value="silver">Серебро</option>
                              <option value="gold">Золото</option>
                              <option value="platinum">Платинум</option>
                            </select>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="label-tag mb-1.5 block">Роль</label>
                            <select value={editUser.role} onChange={(e) => setEditUser({ ...editUser, role: e.target.value })} className="input-dark">
                              <option value="user">Пользователь</option>
                              <option value="admin">Администратор</option>
                            </select>
                          </div>
                          <div>
                            <label className="label-tag mb-1.5 block">Статус</label>
                            <select value={editUser.is_active ? "active" : "blocked"} onChange={(e) => setEditUser({ ...editUser, is_active: e.target.value === "active" })} className="input-dark">
                              <option value="active">Активен</option>
                              <option value="blocked">Заблокирован</option>
                            </select>
                          </div>
                        </div>
                        {editMsg && (
                          <div className={`text-xs px-3 py-2 rounded ${editMsg === "Сохранено!" ? "bg-green-500/10 border border-green-500/30 text-green-500" : "bg-destructive/10 border border-destructive/30 text-destructive"}`}>
                            {editMsg}
                          </div>
                        )}
                        <div className="flex gap-3 pt-2">
                          <button type="submit" disabled={editSaving} className="btn-red flex-1 justify-center disabled:opacity-60">
                            {editSaving ? <Icon name="Loader2" size={15} className="animate-spin" /> : <><Icon name="Save" size={15} />Сохранить</>}
                          </button>
                          <button type="button" onClick={() => setEditUser(null)} className="btn-ghost flex-1 justify-center">
                            Отмена
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ВИЗИТЫ */}
            {activeTab === "visits" && (
              <div>
                <div className="label-tag mb-5">Все визиты ({visits.length})</div>
                {loading ? (
                  <div className="card-dark p-10 text-center">
                    <Icon name="Loader2" size={24} className="animate-spin mx-auto text-primary" />
                  </div>
                ) : (
                  <div className="space-y-2">
                    {visits.map((v) => (
                      <div key={v.id} className="card-dark p-4 flex items-center gap-4 flex-wrap">
                        <div className="flex-1 min-w-0">
                          <div className="font-display font-bold text-sm tracking-wide">{v.service}</div>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className="label-tag">{v.visit_date}</span>
                            {v.user_name && <span className="label-tag">{v.user_name}</span>}
                            {v.user_phone && <span className="label-tag">{v.user_phone}</span>}
                            {v.car && <span className="label-tag">{v.car}</span>}
                            <span className={`label-tag font-bold ${v.status === "completed" ? "text-green-500" : v.status === "cancelled" ? "text-red-400" : "text-yellow-500"}`}>
                              {STATUS_LABELS[v.status] || v.status}
                            </span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="font-display font-bold text-sm">{v.cost.toLocaleString("ru-RU")} ₽</div>
                          <div className="label-tag text-primary">+{v.bonus_earned} баллов</div>
                        </div>
                        <div className="font-mono text-xs text-muted-foreground/50 shrink-0">{v.visit_number}</div>
                      </div>
                    ))}
                    {visits.length === 0 && (
                      <div className="card-dark p-8 text-center text-muted-foreground">
                        <Icon name="CalendarX" size={24} className="mx-auto mb-3" />
                        <p className="text-sm">Визитов пока нет</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ДОБАВИТЬ ВИЗИТ */}
            {activeTab === "add_visit" && (
              <div>
                <div className="label-tag mb-5">Добавить визит клиента</div>
                <form onSubmit={handleAddVisit} className="card-dark p-6 space-y-5">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="label-tag mb-1.5 block">ID пользователя *</label>
                      <input
                        required
                        type="number"
                        value={visitForm.user_id}
                        onChange={(e) => setVisitForm({ ...visitForm, user_id: e.target.value })}
                        className="input-dark"
                        placeholder="Найдите в списке пользователей"
                      />
                      <p className="text-xs text-muted-foreground mt-1">Найдите ID в разделе «Пользователи»</p>
                    </div>
                    <div>
                      <label className="label-tag mb-1.5 block">Дата визита</label>
                      <input
                        type="date"
                        value={visitForm.visit_date}
                        onChange={(e) => setVisitForm({ ...visitForm, visit_date: e.target.value })}
                        className="input-dark"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="label-tag mb-1.5 block">Услуга *</label>
                    <input
                      required
                      type="text"
                      value={visitForm.service}
                      onChange={(e) => setVisitForm({ ...visitForm, service: e.target.value })}
                      className="input-dark"
                      placeholder="Замена масла + фильтр"
                    />
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="label-tag mb-1.5 block">Стоимость, ₽ *</label>
                      <input
                        required
                        type="number"
                        value={visitForm.cost}
                        onChange={(e) => setVisitForm({ ...visitForm, cost: e.target.value })}
                        className="input-dark"
                        placeholder="2400"
                      />
                    </div>
                    <div>
                      <label className="label-tag mb-1.5 block">Статус</label>
                      <select value={visitForm.status} onChange={(e) => setVisitForm({ ...visitForm, status: e.target.value })} className="input-dark">
                        <option value="completed">Завершён</option>
                        <option value="in_progress">В работе</option>
                        <option value="scheduled">Запланирован</option>
                        <option value="cancelled">Отменён</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="label-tag mb-1.5 block">Автомобиль</label>
                    <input
                      type="text"
                      value={visitForm.car}
                      onChange={(e) => setVisitForm({ ...visitForm, car: e.target.value })}
                      className="input-dark"
                      placeholder="Toyota Camry 2020"
                    />
                  </div>

                  <div>
                    <label className="label-tag mb-1.5 block">Примечания</label>
                    <textarea
                      value={visitForm.notes}
                      onChange={(e) => setVisitForm({ ...visitForm, notes: e.target.value })}
                      className="input-dark resize-none h-20"
                      placeholder="Дополнительная информация..."
                    />
                  </div>

                  {visitForm.cost && (
                    <div className="bg-primary/10 border border-primary/30 px-4 py-3 text-sm">
                      Будет начислено бонусов: <span className="font-bold text-primary">{Math.floor(parseFloat(visitForm.cost || "0") * 0.01)} баллов</span>
                    </div>
                  )}

                  {visitMsg && (
                    <div className={`text-xs px-3 py-2 rounded ${visitMsg.includes("добавлен") ? "bg-green-500/10 border border-green-500/30 text-green-500" : "bg-destructive/10 border border-destructive/30 text-destructive"}`}>
                      {visitMsg}
                    </div>
                  )}

                  <button type="submit" disabled={visitSaving} className="btn-red disabled:opacity-60">
                    {visitSaving ? (
                      <span className="flex items-center gap-2">
                        <Icon name="Loader2" size={15} className="animate-spin" />
                        Добавляем...
                      </span>
                    ) : (
                      <>
                        <Icon name="Plus" size={15} />
                        Добавить визит
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}

            {/* РАССЫЛКА */}
            {activeTab === "mailing" && (
              <div>
                <div className="label-tag mb-5">Email-рассылка</div>
                <div className="grid sm:grid-cols-2 gap-4 mb-6">
                  <div className="card-dark p-5 cursor-pointer hover:border-primary/30 border border-transparent transition-colors" onClick={() => setMailForm(f => ({ ...f, type: "broadcast" }))}>
                    <div className={`flex items-center gap-3 mb-2 ${mailForm.type === "broadcast" ? "text-primary" : ""}`}>
                      <Icon name="Megaphone" size={18} />
                      <span className="font-display font-bold text-sm uppercase tracking-wide">Всем клиентам</span>
                      {mailForm.type === "broadcast" && <Icon name="Check" size={14} className="ml-auto text-primary" />}
                    </div>
                    <p className="text-xs text-muted-foreground">Письмо придёт всем зарегистрированным пользователям и появится у них в разделе «Почта»</p>
                  </div>
                  <div className="card-dark p-5 cursor-pointer hover:border-primary/30 border border-transparent transition-colors" onClick={() => setMailForm(f => ({ ...f, type: "single" }))}>
                    <div className={`flex items-center gap-3 mb-2 ${mailForm.type === "single" ? "text-primary" : ""}`}>
                      <Icon name="User" size={18} />
                      <span className="font-display font-bold text-sm uppercase tracking-wide">Одному клиенту</span>
                      {mailForm.type === "single" && <Icon name="Check" size={14} className="ml-auto text-primary" />}
                    </div>
                    <p className="text-xs text-muted-foreground">Уведомление конкретному пользователю — например, что автомобиль готов</p>
                  </div>
                </div>

                <form onSubmit={async (e) => {
                  e.preventDefault();
                  setMailSending(true); setMailMsg("");
                  try {
                    const isSingle = mailForm.type === "single";
                    const res = await fetch(`${MAILER_URL}?action=${isSingle ? "send" : "broadcast"}`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json", "X-Auth-Token": token || "" },
                      body: JSON.stringify(isSingle
                        ? { user_id: parseInt(mailForm.user_id), subject: mailForm.subject, message: mailForm.message, type: "info" }
                        : { subject: mailForm.subject, message: mailForm.message, role: "user" }
                      ),
                    });
                    const data = await res.json();
                    if (res.ok) {
                      setMailMsg(isSingle
                        ? `Уведомление отправлено. Email: ${data.email_sent ? "✓ доставлен" : "в очереди"}`
                        : `Рассылка завершена. Получателей: ${data.total_users}, Email отправлено: ${data.emails_sent}`
                      );
                      setMailForm(f => ({ ...f, subject: "", message: "", user_id: "" }));
                    } else {
                      setMailMsg(data.error || "Ошибка отправки");
                    }
                  } finally { setMailSending(false); }
                }} className="card-dark p-6 space-y-4">
                  {mailForm.type === "single" && (
                    <div>
                      <label className="label-tag mb-1.5 block">ID пользователя *</label>
                      <input required type="number" value={mailForm.user_id} onChange={e => setMailForm(f => ({ ...f, user_id: e.target.value }))} className="input-dark" placeholder="Найдите ID в разделе «Пользователи»" />
                    </div>
                  )}
                  <div>
                    <label className="label-tag mb-1.5 block">Тема письма *</label>
                    <input required type="text" value={mailForm.subject} onChange={e => setMailForm(f => ({ ...f, subject: e.target.value }))} className="input-dark" placeholder="Ваш автомобиль готов!" />
                  </div>
                  <div>
                    <label className="label-tag mb-1.5 block">Текст сообщения *</label>
                    <textarea required value={mailForm.message} onChange={e => setMailForm(f => ({ ...f, message: e.target.value }))} className="input-dark resize-none h-32" placeholder={mailForm.type === "broadcast" ? "Уважаемые клиенты! Используйте {name} для подстановки имени.\n\nНапример: Уважаемый, {name}! Напоминаем о плановом ТО..." : "Ваш автомобиль прошёл диагностику. Всё в порядке, можете забирать!"} />
                    {mailForm.type === "broadcast" && <p className="text-xs text-muted-foreground mt-1">Используйте <code className="bg-secondary px-1 rounded">{"{name}"}</code> для подстановки имени получателя</p>}
                  </div>
                  {mailMsg && (
                    <div className={`text-xs px-3 py-2 rounded ${mailMsg.includes("Рассылка") || mailMsg.includes("отправлено") ? "bg-green-500/10 border border-green-500/30 text-green-500" : "bg-destructive/10 border border-destructive/30 text-destructive"}`}>
                      {mailMsg}
                    </div>
                  )}
                  <button type="submit" disabled={mailSending} className="btn-red disabled:opacity-60">
                    {mailSending ? <><Icon name="Loader2" size={15} className="animate-spin" />Отправляем...</> : <><Icon name="Send" size={15} />{mailForm.type === "broadcast" ? "Отправить всем" : "Отправить пользователю"}</>}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}