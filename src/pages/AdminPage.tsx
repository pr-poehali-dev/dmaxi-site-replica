import { useState, useEffect, useCallback, useRef } from "react";
import Icon from "@/components/ui/icon";
import { useAuth, User } from "@/context/AuthContext";

const ADMIN_URL  = "https://functions.poehali.dev/6e67d0ba-38ba-488e-8380-36b54668214b";
const MAILER_URL = "https://functions.poehali.dev/093c15a5-d14e-4c9e-8c01-38296645286f";
const AUTH_URL   = "https://functions.poehali.dev/3e75355e-bbd8-4e2b-b8cd-aa607ff82304";
const CHAT_URL   = "https://functions.poehali.dev/62695b16-64b3-4804-820c-c7db5baf86a8";
const WALLET_URL = "https://functions.poehali.dev/686b24a0-6c64-41f9-8ff3-a7a49d17304b";

/* ── interfaces ── */
interface AdminUser {
  id: number; name: string; phone: string; email?: string;
  role: string; car_model?: string; bonus_points: number;
  club_level: string; is_active: boolean; created_at: string; last_login?: string;
}
interface AdminVisit {
  id: number; visit_number: string; service: string; car?: string;
  cost: number; bonus_earned: number; status: string; visit_date: string;
  user_name?: string; user_phone?: string;
}
interface Stats {
  total_users: number; new_users_month: number; total_visits: number;
  month_revenue: number; total_bonus_issued: number; blocked_users: number;
}
interface Notification {
  id: number; title: string; body: string; type: string; is_read: boolean; created_at: string;
}
interface ChatUser  { id: number; name: string; role: string; }
interface Contact   { id: number; name: string; role: string; last_message?: string; last_at?: string; unread: number; }
interface Message   {
  id: number; from: number; to: number; body?: string;
  file_url?: string; file_type?: string; file_name?: string;
  is_read: boolean; created_at: string; mine: boolean;
}

/* ── consts ── */
const LEVEL_LABELS: Record<string,string> = { bronze:"Бронза", silver:"Серебро", gold:"Золото", platinum:"Платинум" };
const STATUS_LABELS: Record<string,string> = { completed:"Завершён", in_progress:"В работе", scheduled:"Запланирован", cancelled:"Отменён" };
const STS_LIMIT = 2;
const EMOJI_LIST = ["😊","😂","❤️","👍","🔥","🚗","🛠️","✅","⚠️","📞","📸","🎉","💪","🙏","😎","🤝","👌","💯","⭐","🏆","🔧","⚙️","🛞","🔑","📋","📅","💰","✨","😅","🤔"];

const MANAGE_TABS = [
  { id: "stats",      label: "Дашборд",           icon: "BarChart3" },
  { id: "users",      label: "Пользователи",      icon: "Users" },
  { id: "user_mgmt",  label: "Управление",        icon: "UserCog" },
  { id: "wallets",    label: "Кошельки",          icon: "Wallet" },
  { id: "visits",     label: "Визиты",            icon: "CalendarCheck" },
  { id: "add_visit",  label: "Добавить визит",    icon: "Plus" },
  { id: "mailing",    label: "Рассылка",          icon: "Send" },
];
const PERSONAL_TABS = [
  { id: "my_mail",     label: "Моя почта",    icon: "Mail" },
  { id: "my_chat",     label: "Мой чат",      icon: "MessageCircle" },
  { id: "my_settings", label: "Мои настройки",icon: "Settings" },
];

interface AdminPageProps { onNavigate: (p: string) => void; }

export default function AdminPage({ onNavigate }: AdminPageProps) {
  const { user, token, updateProfile, refreshProfile, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("stats");

  /* manage state */
  const [stats,   setStats]   = useState<Stats | null>(null);
  const [users,   setUsers]   = useState<AdminUser[]>([]);
  const [visits,  setVisits]  = useState<AdminVisit[]>([]);
  const [loading, setLoading] = useState(false);
  const [search,  setSearch]  = useState("");
  const [editUser, setEditUser]   = useState<AdminUser | null>(null);
  const [editSaving, setEditSaving] = useState(false);
  const [editMsg, setEditMsg] = useState("");

  const [visitForm, setVisitForm] = useState({
    user_id: "", service: "", cost: "", car: "", status: "completed", notes: "",
    visit_date: new Date().toISOString().split("T")[0],
  });
  const [visitSaving, setVisitSaving] = useState(false);
  const [visitMsg, setVisitMsg] = useState("");

  const [mailForm, setMailForm] = useState({ subject: "", message: "", user_id: "", type: "broadcast" });
  const [mailSending, setMailSending] = useState(false);
  const [mailMsg, setMailMsg] = useState("");

  /* user management state */
  const [userDetail, setUserDetail] = useState<(AdminUser & { visits?: AdminVisit[]; full_name_sts?: string; car_plate?: string; car_sts?: string; sts_edit_count?: number; car_year?: string; car_vin?: string }) | null>(null);
  const [userDetailLoading, setUserDetailLoading] = useState(false);
  const [userEditForm, setUserEditForm] = useState<Record<string, string | number | boolean>>({});
  const [userEditSaving, setUserEditSaving] = useState(false);
  const [userEditMsg, setUserEditMsg] = useState("");
  const [newUserForm, setNewUserForm] = useState({ name: "", phone: "", email: "", password: "", car_model: "", car_year: "", car_vin: "", full_name_sts: "", car_plate: "", car_sts: "", role: "user", club_level: "bronze", bonus_points: "0" });
  const [newUserSaving, setNewUserSaving] = useState(false);
  const [newUserMsg, setNewUserMsg] = useState("");
  const [ghostLoading, setGhostLoading] = useState<number | null>(null);
  const [ghostUser, setGhostUser] = useState<User | null>(null);
  const [ghostToken, setGhostToken] = useState<string | null>(null);

  /* wallets admin state */
  const [adminWallets, setAdminWallets] = useState<{wallet_id:number;user_id:number;name:string;phone:string;email?:string;balance:number;updated_at:string}[]>([]);
  const [adminWalletsTotal, setAdminWalletsTotal] = useState(0);
  const [walletsLoading, setWalletsLoading] = useState(false);
  const [walletSearch, setWalletSearch] = useState("");
  const [adjustForm, setAdjustForm] = useState<{userId:number;userName:string;amount:string;direction:"credit"|"debit";description:string}|null>(null);
  const [adjustSaving, setAdjustSaving] = useState(false);
  const [adjustMsg, setAdjustMsg] = useState("");

  /* personal state */
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notifLoading,  setNotifLoading]  = useState(false);
  const [unreadNotif,   setUnreadNotif]   = useState(0);
  const [unreadChat,    setUnreadChat]    = useState(0);

  const [contacts,    setContacts]    = useState<Contact[]>([]);
  const [chatUsers,   setChatUsers]   = useState<ChatUser[]>([]);
  const [activeChat,  setActiveChat]  = useState<ChatUser | null>(null);
  const [messages,    setMessages]    = useState<Message[]>([]);
  const [msgText,     setMsgText]     = useState("");
  const [showEmoji,   setShowEmoji]   = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [sendingMsg,  setSendingMsg]  = useState(false);
  const [showNewChat, setShowNewChat] = useState(false);
  const fileInputRef   = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [profileForm, setProfileForm] = useState({
    name: "", email: "", car_model: "", car_year: "", car_vin: "",
    full_name_sts: "", car_plate: "", car_sts: "", new_password: "", confirm_password: "",
  });
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  const H = useCallback(() => ({ "Content-Type": "application/json", "X-Auth-Token": token || "" }), [token]);

  /* ── loaders ── */
  const loadStats  = useCallback(async () => { setLoading(true); try { const r = await fetch(`${ADMIN_URL}?action=stats`, { headers: H() }); const d = await r.json(); if (r.ok) setStats(d); } finally { setLoading(false); } }, [H]);
  const loadUsers  = useCallback(async (q = "") => { setLoading(true); try { const r = await fetch(`${ADMIN_URL}?action=users&search=${encodeURIComponent(q)}`, { headers: H() }); const d = await r.json(); if (r.ok) setUsers(d.users || []); } finally { setLoading(false); } }, [H]);
  const loadVisits = useCallback(async () => { setLoading(true); try { const r = await fetch(`${ADMIN_URL}?action=visits`, { headers: H() }); const d = await r.json(); if (r.ok) setVisits(d.visits || []); } finally { setLoading(false); } }, [H]);

  const loadAdminWallets = useCallback(async (q = "") => {
    setWalletsLoading(true);
    try {
      const r = await fetch(`${WALLET_URL}?action=admin_wallets&search=${encodeURIComponent(q)}`, { headers: H() });
      const d = await r.json();
      if (r.ok) { setAdminWallets(d.wallets || []); setAdminWalletsTotal(d.total_balance || 0); }
    } finally { setWalletsLoading(false); }
  }, [H]);

  const loadUserDetail = useCallback(async (id: number) => {
    setUserDetailLoading(true);
    try {
      const r = await fetch(`${ADMIN_URL}?action=user_detail&id=${id}`, { headers: H() });
      const d = await r.json();
      if (r.ok) {
        setUserDetail(d);
        setUserEditForm({
          name: d.name || "", phone: d.phone || "", email: d.email || "",
          car_model: d.car_model || "", car_year: d.car_year || "", car_vin: d.car_vin || "",
          full_name_sts: d.full_name_sts || "", car_plate: d.car_plate || "", car_sts: d.car_sts || "",
          role: d.role || "user", club_level: d.club_level || "bronze",
          bonus_points: d.bonus_points ?? 0, is_active: d.is_active ?? true,
          sts_edit_count: d.sts_edit_count ?? 0, new_password: "",
        });
      }
    } finally { setUserDetailLoading(false); }
  }, [H]);

  const ghostLogin = useCallback(async (userId: number) => {
    setGhostLoading(userId);
    try {
      const r = await fetch(`${AUTH_URL}?action=ghost_login`, {
        method: "POST", headers: H(), body: JSON.stringify({ user_id: userId })
      });
      const d = await r.json();
      if (r.ok) { setGhostUser(d.user); setGhostToken(d.ghost_token); }
      else alert(d.error || "Ошибка входа");
    } finally { setGhostLoading(null); }
  }, [H]);

  const loadNotifications = useCallback(async () => {
    setNotifLoading(true);
    try {
      const r = await fetch(`${AUTH_URL}?action=notifications`, { headers: H() });
      const d = await r.json();
      setNotifications(d.notifications || []); setUnreadNotif(d.unread || 0);
    } finally { setNotifLoading(false); }
  }, [H]);

  const loadContacts  = useCallback(async () => { const r = await fetch(`${CHAT_URL}?action=contacts`, { headers: H() }); const d = await r.json(); setContacts(d.contacts || []); }, [H]);
  const loadChatUsers = useCallback(async () => { const r = await fetch(`${CHAT_URL}?action=users`, { headers: H() }); const d = await r.json(); setChatUsers(d.users || []); }, [H]);

  useEffect(() => {
    if (user) setProfileForm({ name: user.name||"", email: user.email||"", car_model: user.car_model||"", car_year: user.car_year||"", car_vin: user.car_vin||"", full_name_sts: user.full_name_sts||"", car_plate: user.car_plate||"", car_sts: user.car_sts||"", new_password: "", confirm_password: "" });
  }, [user]);

  useEffect(() => {
    if (!token) return;
    if (activeTab === "stats")    loadStats();
    if (activeTab === "users")    loadUsers();
    if (activeTab === "visits")   loadVisits();
    if (activeTab === "wallets")  loadAdminWallets();
    if (activeTab === "my_mail")  loadNotifications();
    if (activeTab === "my_chat")  { loadContacts(); loadChatUsers(); }
  }, [activeTab, token]);

  /* badge counters every 15s */
  useEffect(() => {
    if (!token) return;
    const run = () => {
      fetch(`${AUTH_URL}?action=notifications`, { headers: H() }).then(r=>r.json()).then(d=>setUnreadNotif(d.unread||0)).catch(()=>{});
      fetch(`${CHAT_URL}?action=unread`,        { headers: H() }).then(r=>r.json()).then(d=>setUnreadChat(d.unread||0)).catch(()=>{});
    };
    run();
    const iv = setInterval(run, 15000);
    return () => clearInterval(iv);
  }, [token, H]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior:"smooth" }); }, [messages]);

  /* ── chat helpers ── */
  const openChat = async (cu: ChatUser) => {
    setActiveChat(cu); setChatLoading(true);
    try { const r = await fetch(`${CHAT_URL}?action=messages&with=${cu.id}`, { headers: H() }); const d = await r.json(); setMessages(d.messages||[]); loadContacts(); } finally { setChatLoading(false); }
  };

  const sendMessage = async (fileData?: string, fileName?: string, fileType?: string) => {
    if (!activeChat || (!msgText.trim() && !fileData)) return;
    setSendingMsg(true);
    try {
      await fetch(`${CHAT_URL}?action=send`, { method:"POST", headers: H(), body: JSON.stringify({ to: activeChat.id, body: msgText.trim()||undefined, file: fileData, file_name: fileName, file_type: fileType }) });
      setMsgText("");
      const r = await fetch(`${CHAT_URL}?action=messages&with=${activeChat.id}`, { headers: H() });
      const d = await r.json(); setMessages(d.messages||[]);
    } finally { setSendingMsg(false); }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    if (file.size > 20*1024*1024) { alert("Максимальный размер файла 20 МБ"); return; }
    const reader = new FileReader();
    reader.onload = () => { const b64 = (reader.result as string).split(",")[1]; const ft = file.type.startsWith("image/")?"image":file.type.startsWith("video/")?"video":"file"; sendMessage(b64, file.name, ft); };
    reader.readAsDataURL(file); e.target.value = "";
  };

  const markNotifRead = async (id?: number) => {
    await fetch(`${AUTH_URL}?action=notifications_read`, { method:"PUT", headers: H(), body: JSON.stringify(id ? { id } : {}) });
    loadNotifications();
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (profileForm.new_password && profileForm.new_password !== profileForm.confirm_password) { setSaveMsg("Пароли не совпадают"); return; }
    setSaveLoading(true); setSaveMsg("");
    try {
      await updateProfile({ name: profileForm.name, email: profileForm.email, car_model: profileForm.car_model, car_year: profileForm.car_year, car_vin: profileForm.car_vin, ...(profileForm.new_password ? { new_password: profileForm.new_password } : {}) });
      setSaveMsg("Данные сохранены!"); setProfileForm(p => ({ ...p, new_password: "", confirm_password: "" }));
      await refreshProfile();
    } catch (err: unknown) { setSaveMsg(err instanceof Error ? err.message : "Ошибка"); } finally { setSaveLoading(false); }
  };

  const handleSaveSts = async (e: React.FormEvent) => {
    e.preventDefault(); setSaveLoading(true); setSaveMsg("");
    try {
      await updateProfile({ full_name_sts: profileForm.full_name_sts, car_plate: profileForm.car_plate, car_sts: profileForm.car_sts });
      setSaveMsg("Данные по СТС сохранены!"); await refreshProfile();
    } catch (err: unknown) { setSaveMsg(err instanceof Error ? err.message : "Ошибка"); } finally { setSaveLoading(false); }
  };

  if (!user || user.role !== "admin") return (
    <div className="animate-fade-in min-h-[70vh] flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 bg-destructive/10 border border-destructive/30 flex items-center justify-center mx-auto mb-5"><Icon name="ShieldOff" size={28} className="text-destructive" /></div>
        <h2 className="font-display font-bold text-xl uppercase mb-3">Доступ запрещён</h2>
        <p className="text-sm text-muted-foreground mb-6">Только для администраторов</p>
        <button onClick={() => onNavigate("home")} className="btn-red"><Icon name="Home" size={16} />На главную</button>
      </div>
    </div>
  );

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault(); if (!editUser) return;
    setEditSaving(true); setEditMsg("");
    try {
      const r = await fetch(`${ADMIN_URL}?action=user&id=${editUser.id}`, { method:"PUT", headers: H(), body: JSON.stringify(editUser) });
      const d = await r.json();
      if (r.ok) { setEditMsg("Сохранено!"); loadUsers(search); setTimeout(() => { setEditUser(null); setEditMsg(""); }, 1200); }
      else setEditMsg(d.error || "Ошибка");
    } finally { setEditSaving(false); }
  };

  const handleAddVisit = async (e: React.FormEvent) => {
    e.preventDefault(); setVisitSaving(true); setVisitMsg("");
    try {
      const r = await fetch(`${ADMIN_URL}?action=visits`, { method:"POST", headers: H(), body: JSON.stringify({ user_id: parseInt(visitForm.user_id), service: visitForm.service, cost: parseFloat(visitForm.cost), car: visitForm.car, status: visitForm.status, notes: visitForm.notes, visit_date: visitForm.visit_date }) });
      const d = await r.json();
      if (r.ok) { setVisitMsg(`Визит ${d.visit_number} добавлен!`); setVisitForm({ user_id:"", service:"", cost:"", car:"", status:"completed", notes:"", visit_date: new Date().toISOString().split("T")[0] }); }
      else setVisitMsg(d.error || "Ошибка");
    } finally { setVisitSaving(false); }
  };

  const initials = user.name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0,2);
  const stsUsed  = user.sts_edit_count ?? 0;
  const stsLeft  = STS_LIMIT - stsUsed;
  const stsLocked = stsLeft <= 0;

  const personalTabsWithBadge = PERSONAL_TABS.map(t => ({
    ...t,
    badge: t.id === "my_mail" ? unreadNotif : t.id === "my_chat" ? unreadChat : 0,
  }));

  return (
    <div className="animate-fade-in">
      {/* Breadcrumb */}
      <div className="border-b border-border">
        <div className="container mx-auto py-3 flex items-center gap-2 text-xs text-muted-foreground">
          <button onClick={() => onNavigate("home")} className="hover:text-foreground transition-colors font-display uppercase tracking-wide">Главная</button>
          <Icon name="ChevronRight" size={12} />
          <span className="text-foreground font-display uppercase tracking-wide">Панель администратора</span>
        </div>
      </div>

      {/* Header */}
      <div className="bg-card border-b border-border py-6">
        <div className="container mx-auto flex items-center gap-4 flex-wrap">
          <div className="w-12 h-12 bg-primary flex items-center justify-center shrink-0">
            <span className="text-white font-display font-black text-lg">{initials}</span>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <h1 className="font-display font-bold text-xl uppercase tracking-wide">{user.name}</h1>
              <span className="bg-primary text-white text-[9px] px-2 py-0.5 font-display font-bold tracking-widest uppercase">Администратор</span>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <span className="label-tag">{user.phone}</span>
              {user.email && <span className="label-tag">{user.email}</span>}
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            {unreadNotif > 0 && (
              <button onClick={() => setActiveTab("my_mail")} className="relative p-2 text-muted-foreground hover:text-primary transition-colors">
                <Icon name="Mail" size={18} />
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-primary text-white text-[9px] rounded-full flex items-center justify-center font-bold">{unreadNotif}</span>
              </button>
            )}
            {unreadChat > 0 && (
              <button onClick={() => setActiveTab("my_chat")} className="relative p-2 text-muted-foreground hover:text-primary transition-colors">
                <Icon name="MessageCircle" size={18} />
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-primary text-white text-[9px] rounded-full flex items-center justify-center font-bold">{unreadChat}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto section-py">
        <div className="grid lg:grid-cols-4 gap-8">

          {/* Sidebar */}
          <aside className="lg:col-span-1 space-y-3">
            {/* Управление */}
            <div>
              <div className="label-tag px-2 mb-2">Управление</div>
              <nav className="card-dark overflow-hidden">
                {MANAGE_TABS.map(tab => (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-5 py-3.5 border-b border-border last:border-0 transition-colors ${activeTab === tab.id ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground hover:bg-secondary/30"}`}
                  >
                    <Icon name={tab.icon as "BarChart3"} size={15} />
                    <span className="flex-1 text-left font-display text-xs uppercase tracking-wide">{tab.label}</span>
                  </button>
                ))}
              </nav>
            </div>

            {/* Личное */}
            <div>
              <div className="label-tag px-2 mb-2">Личный кабинет</div>
              <nav className="card-dark overflow-hidden">
                {personalTabsWithBadge.map(tab => (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-5 py-3.5 border-b border-border last:border-0 transition-colors ${activeTab === tab.id ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground hover:bg-secondary/30"}`}
                  >
                    <Icon name={tab.icon as "Mail"} size={15} />
                    <span className="flex-1 text-left font-display text-xs uppercase tracking-wide">{tab.label}</span>
                    {tab.badge > 0 && (
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${activeTab === tab.id ? "bg-white/20 text-white" : "bg-primary text-white"}`}>{tab.badge}</span>
                    )}
                  </button>
                ))}
              </nav>
            </div>

            <button onClick={() => { logout(); onNavigate("home"); }} className="w-full flex items-center gap-2 text-xs text-muted-foreground hover:text-primary px-5 py-2.5 transition-colors font-display uppercase tracking-wide">
              <Icon name="LogOut" size={13} />Выйти
            </button>
          </aside>

          {/* Content */}
          <div className="lg:col-span-3">

            {/* ── ДАШБОРД ── */}
            {activeTab === "stats" && (
              <div>
                <div className="label-tag mb-5">Статистика</div>
                {loading && !stats ? (
                  <div className="card-dark p-10 text-center"><Icon name="Loader2" size={24} className="animate-spin mx-auto text-primary" /></div>
                ) : stats ? (
                  <>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
                      {[
                        { val: stats.total_users,                                label: "Всего клиентов",    icon: "Users",       color: "text-blue-400" },
                        { val: stats.new_users_month,                            label: "Новых за месяц",    icon: "UserPlus",    color: "text-green-400" },
                        { val: stats.total_visits,                               label: "Всего визитов",     icon: "CalendarCheck",color:"text-yellow-400" },
                        { val: `${stats.month_revenue.toLocaleString("ru-RU")} ₽`, label:"Выручка за месяц",icon: "Banknote",    color: "text-primary" },
                        { val: stats.total_bonus_issued,                         label: "Выдано баллов",    icon: "Star",        color: "text-purple-400" },
                        { val: stats.blocked_users,                              label: "Заблокировано",    icon: "UserX",       color: "text-red-400" },
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
                        <div className="space-y-1">
                          {[["users","Users","Пользователи"],["add_visit","Plus","Добавить визит"],["mailing","Send","Рассылка"],["my_chat","MessageCircle","Мой чат"]].map(([tab,icon,label])=>(
                            <button key={tab} onClick={()=>setActiveTab(tab)} className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-secondary/30 transition-colors text-sm text-left">
                              <Icon name={icon as "Users"} size={14} className="text-muted-foreground" />{label}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="card-dark p-5">
                        <div className="label-tag mb-3">Доступы</div>
                        <div className="space-y-1.5 text-xs text-muted-foreground">
                          <p>• Управление всеми пользователями</p>
                          <p>• Просмотр и добавление визитов</p>
                          <p>• Email-рассылка по всей базе</p>
                          <p>• Личная почта и чат</p>
                          <p>• Редактирование профиля</p>
                        </div>
                      </div>
                    </div>
                  </>
                ) : <div className="card-dark p-6 text-center text-muted-foreground">Нет данных</div>}
              </div>
            )}

            {/* ── ПОЛЬЗОВАТЕЛИ ── */}
            {activeTab === "users" && (
              <div>
                <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
                  <div className="label-tag">Пользователи ({users.length})</div>
                  <div className="flex gap-2">
                    <input type="text" value={search} onChange={e=>setSearch(e.target.value)} onKeyDown={e=>e.key==="Enter"&&loadUsers(search)} className="input-dark py-2 px-3 text-xs w-48" placeholder="Поиск по имени / тел." />
                    <button onClick={()=>loadUsers(search)} className="btn-red py-2 px-4 text-xs"><Icon name="Search" size={14} /></button>
                  </div>
                </div>
                {loading ? <div className="card-dark p-10 text-center"><Icon name="Loader2" size={24} className="animate-spin mx-auto text-primary" /></div> : (
                  <div className="space-y-2">
                    {users.map(u => (
                      <div key={u.id} className="card-dark p-4 flex items-center gap-4 flex-wrap">
                        <div className="w-10 h-10 bg-primary/10 border border-primary/30 flex items-center justify-center shrink-0 text-sm font-display font-bold text-primary">
                          {u.name.split(" ").map(w=>w[0]).join("").toUpperCase().slice(0,2)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-display font-bold text-sm tracking-wide flex items-center gap-2 flex-wrap">
                            {u.name}
                            <span className="label-tag text-muted-foreground">#{u.id}</span>
                            {u.role==="admin" && <span className="bg-primary text-white text-[9px] px-1.5 py-0.5 font-bold uppercase">Админ</span>}
                            {!u.is_active && <span className="bg-destructive/20 text-destructive text-[9px] px-1.5 py-0.5 font-bold uppercase">Заблокирован</span>}
                          </div>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className="label-tag">{u.phone}</span>
                            {u.email && <span className="label-tag">{u.email}</span>}
                            {u.car_model && <span className="label-tag">{u.car_model}</span>}
                            <span className="label-tag text-primary">{u.bonus_points} баллов · {LEVEL_LABELS[u.club_level]||u.club_level}</span>
                          </div>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <button onClick={()=>{setActiveTab("user_mgmt");loadUserDetail(u.id);}} className="btn-ghost text-xs py-1.5 px-3"><Icon name="UserCog" size={13} />Управление</button>
                          <button onClick={()=>{setEditUser({...u});setEditMsg("");}} className="btn-ghost text-xs py-1.5 px-3"><Icon name="Edit" size={13} />Быстро</button>
                        </div>
                      </div>
                    ))}
                    {users.length===0 && <div className="card-dark p-8 text-center text-muted-foreground"><Icon name="Users" size={24} className="mx-auto mb-3" /><p className="text-sm">Нет пользователей</p></div>}
                  </div>
                )}

                {editUser && (
                  <div className="fixed inset-0 bg-background/80 backdrop-blur z-50 flex items-center justify-center p-4">
                    <div className="card-dark w-full max-w-lg overflow-y-auto max-h-[90vh]">
                      <div className="flex items-center justify-between p-5 border-b border-border">
                        <div className="font-display font-bold uppercase tracking-wide">Редактировать пользователя #{editUser.id}</div>
                        <button onClick={()=>setEditUser(null)} className="text-muted-foreground hover:text-foreground"><Icon name="X" size={18} /></button>
                      </div>
                      <form onSubmit={handleSaveUser} className="p-5 space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                          <div><label className="label-tag mb-1.5 block">Имя</label><input type="text" value={editUser.name} onChange={e=>setEditUser({...editUser,name:e.target.value})} className="input-dark" /></div>
                          <div><label className="label-tag mb-1.5 block">Телефон</label><input type="text" value={editUser.phone} onChange={e=>setEditUser({...editUser,phone:e.target.value})} className="input-dark" /></div>
                        </div>
                        <div><label className="label-tag mb-1.5 block">Email</label><input type="email" value={editUser.email||""} onChange={e=>setEditUser({...editUser,email:e.target.value})} className="input-dark" /></div>
                        <div><label className="label-tag mb-1.5 block">Автомобиль</label><input type="text" value={editUser.car_model||""} onChange={e=>setEditUser({...editUser,car_model:e.target.value})} className="input-dark" /></div>
                        <div className="grid grid-cols-2 gap-3">
                          <div><label className="label-tag mb-1.5 block">Бонусы</label><input type="number" value={editUser.bonus_points} onChange={e=>setEditUser({...editUser,bonus_points:parseInt(e.target.value)||0})} className="input-dark" /></div>
                          <div><label className="label-tag mb-1.5 block">Уровень</label>
                            <select value={editUser.club_level} onChange={e=>setEditUser({...editUser,club_level:e.target.value})} className="input-dark">
                              {Object.entries(LEVEL_LABELS).map(([k,v])=><option key={k} value={k}>{v}</option>)}
                            </select>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div><label className="label-tag mb-1.5 block">Роль</label>
                            <select value={editUser.role} onChange={e=>setEditUser({...editUser,role:e.target.value})} className="input-dark">
                              <option value="user">Пользователь</option><option value="admin">Администратор</option>
                            </select>
                          </div>
                          <div><label className="label-tag mb-1.5 block">Статус</label>
                            <select value={editUser.is_active?"active":"blocked"} onChange={e=>setEditUser({...editUser,is_active:e.target.value==="active"})} className="input-dark">
                              <option value="active">Активен</option><option value="blocked">Заблокирован</option>
                            </select>
                          </div>
                        </div>
                        {editMsg && <div className={`text-xs px-3 py-2 rounded ${editMsg==="Сохранено!"?"bg-green-500/10 border border-green-500/30 text-green-500":"bg-destructive/10 border border-destructive/30 text-destructive"}`}>{editMsg}</div>}
                        <div className="flex gap-3 pt-2">
                          <button type="submit" disabled={editSaving} className="btn-red flex-1 justify-center disabled:opacity-60">{editSaving?<Icon name="Loader2" size={15} className="animate-spin"/>:<><Icon name="Save" size={15}/>Сохранить</>}</button>
                          <button type="button" onClick={()=>setEditUser(null)} className="btn-ghost flex-1 justify-center">Отмена</button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── ВИЗИТЫ ── */}
            {activeTab === "visits" && (
              <div>
                <div className="label-tag mb-5">Все визиты ({visits.length})</div>
                {loading ? <div className="card-dark p-10 text-center"><Icon name="Loader2" size={24} className="animate-spin mx-auto text-primary" /></div> : (
                  <div className="space-y-2">
                    {visits.map(v => (
                      <div key={v.id} className="card-dark p-4 flex items-center gap-4 flex-wrap">
                        <div className="flex-1 min-w-0">
                          <div className="font-display font-bold text-sm tracking-wide">{v.service}</div>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className="label-tag">{v.visit_date}</span>
                            {v.user_name && <span className="label-tag">{v.user_name}</span>}
                            {v.user_phone && <span className="label-tag">{v.user_phone}</span>}
                            {v.car && <span className="label-tag">{v.car}</span>}
                            <span className={`label-tag font-bold ${v.status==="completed"?"text-green-500":v.status==="cancelled"?"text-red-400":"text-yellow-500"}`}>{STATUS_LABELS[v.status]||v.status}</span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="font-display font-bold text-sm">{v.cost.toLocaleString("ru-RU")} ₽</div>
                          <div className="label-tag text-primary">+{v.bonus_earned} баллов</div>
                        </div>
                        <div className="font-mono text-xs text-muted-foreground/50 shrink-0">{v.visit_number}</div>
                      </div>
                    ))}
                    {visits.length===0 && <div className="card-dark p-8 text-center text-muted-foreground"><Icon name="CalendarX" size={24} className="mx-auto mb-3" /><p className="text-sm">Визитов нет</p></div>}
                  </div>
                )}
              </div>
            )}

            {/* ── КОШЕЛЬКИ ── */}
            {activeTab === "wallets" && (
              <div>
                <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
                  <div className="label-tag">Кошельки пользователей</div>
                  <div className="flex items-center gap-3">
                    <div className="text-sm text-muted-foreground">Общая сумма на кошельках:</div>
                    <div className="font-display font-bold text-green-400 text-lg">{adminWalletsTotal.toLocaleString("ru-RU")} ₽</div>
                  </div>
                </div>

                <div className="flex gap-3 mb-5">
                  <input type="text" value={walletSearch} onChange={e=>setWalletSearch(e.target.value)}
                    onKeyDown={e=>e.key==="Enter"&&loadAdminWallets(walletSearch)}
                    placeholder="Поиск по имени или телефону..." className="input-dark flex-1" />
                  <button onClick={()=>loadAdminWallets(walletSearch)} className="btn-ghost text-xs py-2 px-4">
                    <Icon name="Search" size={14}/>Найти
                  </button>
                </div>

                {walletsLoading ? (
                  <div className="card-dark p-10 text-center"><Icon name="Loader2" size={24} className="animate-spin mx-auto text-primary"/></div>
                ) : (
                  <div className="space-y-2">
                    {adminWallets.map(w => (
                      <div key={w.wallet_id} className="card-dark p-4 flex items-center gap-4 flex-wrap">
                        <div className="w-10 h-10 bg-green-500/10 border border-green-500/20 flex items-center justify-center shrink-0">
                          <Icon name="Wallet" size={18} className="text-green-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-display font-bold text-sm uppercase">{w.name}</div>
                          <div className="flex gap-2 mt-0.5 flex-wrap">
                            <span className="label-tag">{w.phone}</span>
                            {w.email && <span className="label-tag">{w.email}</span>}
                            <span className="label-tag text-muted-foreground/60">#{w.user_id}</span>
                          </div>
                        </div>
                        <div className="text-right shrink-0 mr-4">
                          <div className={`font-display font-bold text-xl ${w.balance>0?"text-green-400":"text-muted-foreground"}`}>
                            {w.balance.toLocaleString("ru-RU")} ₽
                          </div>
                          <div className="label-tag">баланс</div>
                        </div>
                        <button
                          onClick={()=>setAdjustForm({userId:w.user_id, userName:w.name, amount:"", direction:"credit", description:""})}
                          className="btn-ghost text-xs py-1.5 px-3 shrink-0">
                          <Icon name="PenLine" size={13}/>Корректировка
                        </button>
                      </div>
                    ))}
                    {adminWallets.length===0 && (
                      <div className="card-dark p-10 text-center text-muted-foreground">
                        <Icon name="Wallet" size={28} className="mx-auto mb-3 opacity-30"/>
                        <p className="text-sm">Кошельков нет</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Модал корректировки */}
                {adjustForm && (
                  <div className="fixed inset-0 bg-background/80 backdrop-blur z-50 flex items-center justify-center p-4">
                    <div className="card-dark w-full max-w-md">
                      <div className="flex items-center justify-between p-5 border-b border-border">
                        <div className="font-display font-bold uppercase tracking-wide text-sm">Корректировка кошелька</div>
                        <button onClick={()=>{setAdjustForm(null);setAdjustMsg("");}} className="text-muted-foreground hover:text-foreground"><Icon name="X" size={18}/></button>
                      </div>
                      <form onSubmit={async e => {
                        e.preventDefault(); setAdjustSaving(true); setAdjustMsg("");
                        try {
                          const r = await fetch(`${WALLET_URL}?action=admin_adjust`, {
                            method: "POST", headers: H(),
                            body: JSON.stringify({
                              user_id: adjustForm.userId,
                              amount: Number(adjustForm.amount),
                              direction: adjustForm.direction,
                              description: adjustForm.description || (adjustForm.direction==="credit"?"Зачисление администратором":"Списание администратором"),
                              type: "admin_adjust"
                            })
                          });
                          const d = await r.json();
                          if (r.ok) {
                            setAdjustMsg(`Готово! Новый баланс: ${d.new_balance.toLocaleString("ru-RU")} ₽`);
                            loadAdminWallets(walletSearch);
                          } else setAdjustMsg(d.error || "Ошибка");
                        } finally { setAdjustSaving(false); }
                      }} className="p-5 space-y-4">
                        <div className="bg-secondary/20 rounded p-3 text-sm">
                          <span className="text-muted-foreground">Пользователь:</span> <strong>{adjustForm.userName}</strong>
                        </div>
                        <div>
                          <label className="label-tag mb-1.5 block">Тип операции</label>
                          <div className="flex gap-2">
                            <button type="button" onClick={()=>setAdjustForm(f=>f?{...f,direction:"credit"}:f)}
                              className={`flex-1 py-2.5 text-xs font-display font-bold uppercase border transition-colors ${adjustForm.direction==="credit"?"bg-green-500/10 border-green-500 text-green-400":"border-border text-muted-foreground hover:border-green-500/50"}`}>
                              <Icon name="ArrowDownLeft" size={13} className="inline mr-1"/>Зачислить
                            </button>
                            <button type="button" onClick={()=>setAdjustForm(f=>f?{...f,direction:"debit"}:f)}
                              className={`flex-1 py-2.5 text-xs font-display font-bold uppercase border transition-colors ${adjustForm.direction==="debit"?"bg-destructive/10 border-destructive text-destructive":"border-border text-muted-foreground hover:border-destructive/50"}`}>
                              <Icon name="ArrowUpRight" size={13} className="inline mr-1"/>Списать
                            </button>
                          </div>
                        </div>
                        <div>
                          <label className="label-tag mb-1.5 block">Сумма, ₽</label>
                          <input required type="number" min="1" value={adjustForm.amount}
                            onChange={e=>setAdjustForm(f=>f?{...f,amount:e.target.value}:f)}
                            className="input-dark w-full" placeholder="Например: 500"/>
                        </div>
                        <div>
                          <label className="label-tag mb-1.5 block">Комментарий</label>
                          <input type="text" value={adjustForm.description}
                            onChange={e=>setAdjustForm(f=>f?{...f,description:e.target.value}:f)}
                            className="input-dark w-full" placeholder="Причина корректировки"/>
                        </div>
                        {adjustMsg && (
                          <div className={`text-xs px-3 py-2 rounded border ${adjustMsg.startsWith("Готово")?"border-green-500/30 bg-green-500/10 text-green-400":"border-destructive/30 bg-destructive/10 text-destructive"}`}>
                            {adjustMsg}
                          </div>
                        )}
                        <div className="flex gap-3 pt-1">
                          <button type="submit" disabled={adjustSaving} className={`flex-1 disabled:opacity-60 ${adjustForm.direction==="credit"?"btn-green":"btn-red"}`}>
                            {adjustSaving ? <><Icon name="Loader2" size={14} className="animate-spin"/>Сохраняем...</> : adjustForm.direction==="credit" ? <><Icon name="Plus" size={14}/>Зачислить</> : <><Icon name="Minus" size={14}/>Списать</>}
                          </button>
                          <button type="button" onClick={()=>{setAdjustForm(null);setAdjustMsg("");}} className="btn-ghost py-2 px-4 text-xs">Отмена</button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── ДОБАВИТЬ ВИЗИТ ── */}
            {activeTab === "add_visit" && (
              <div>
                <div className="label-tag mb-5">Добавить визит</div>
                <form onSubmit={handleAddVisit} className="card-dark p-6 space-y-5">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="label-tag mb-1.5 block">ID пользователя *</label>
                      <input required type="number" value={visitForm.user_id} onChange={e=>setVisitForm({...visitForm,user_id:e.target.value})} className="input-dark" placeholder="Найдите ID в списке пользователей" />
                    </div>
                    <div>
                      <label className="label-tag mb-1.5 block">Дата визита</label>
                      <input type="date" value={visitForm.visit_date} onChange={e=>setVisitForm({...visitForm,visit_date:e.target.value})} className="input-dark" />
                    </div>
                  </div>
                  <div><label className="label-tag mb-1.5 block">Услуга *</label><input required type="text" value={visitForm.service} onChange={e=>setVisitForm({...visitForm,service:e.target.value})} className="input-dark" placeholder="Замена масла + фильтр" /></div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div><label className="label-tag mb-1.5 block">Стоимость, ₽ *</label><input required type="number" value={visitForm.cost} onChange={e=>setVisitForm({...visitForm,cost:e.target.value})} className="input-dark" placeholder="2400" /></div>
                    <div><label className="label-tag mb-1.5 block">Статус</label>
                      <select value={visitForm.status} onChange={e=>setVisitForm({...visitForm,status:e.target.value})} className="input-dark">
                        <option value="completed">Завершён</option><option value="in_progress">В работе</option>
                        <option value="scheduled">Запланирован</option><option value="cancelled">Отменён</option>
                      </select>
                    </div>
                  </div>
                  <div><label className="label-tag mb-1.5 block">Автомобиль</label><input type="text" value={visitForm.car} onChange={e=>setVisitForm({...visitForm,car:e.target.value})} className="input-dark" placeholder="Toyota Camry 2020" /></div>
                  <div><label className="label-tag mb-1.5 block">Примечания</label><textarea value={visitForm.notes} onChange={e=>setVisitForm({...visitForm,notes:e.target.value})} className="input-dark resize-none h-20" placeholder="Дополнительная информация..." /></div>
                  {visitForm.cost && <div className="bg-primary/10 border border-primary/30 px-4 py-3 text-sm">Будет начислено: <span className="font-bold text-primary">{Math.floor(parseFloat(visitForm.cost||"0")*0.01)} баллов</span></div>}
                  {visitMsg && <div className={`text-xs px-3 py-2 rounded ${visitMsg.includes("добавлен")?"bg-green-500/10 border border-green-500/30 text-green-500":"bg-destructive/10 border border-destructive/30 text-destructive"}`}>{visitMsg}</div>}
                  <button type="submit" disabled={visitSaving} className="btn-red disabled:opacity-60">{visitSaving?<><Icon name="Loader2" size={15} className="animate-spin"/>Добавляем...</>:<><Icon name="Plus" size={15}/>Добавить визит</>}</button>
                </form>
              </div>
            )}

            {/* ── РАССЫЛКА ── */}
            {activeTab === "mailing" && (
              <div>
                <div className="label-tag mb-5">Email-рассылка</div>
                <div className="grid sm:grid-cols-2 gap-4 mb-6">
                  {[
                    { type:"broadcast", icon:"Megaphone", title:"Всем клиентам", desc:"Письмо придёт всем и появится в разделе «Почта»" },
                    { type:"single",    icon:"User",      title:"Одному клиенту", desc:"Уведомление конкретному пользователю (автомобиль готов и т.д.)" },
                  ].map(opt => (
                    <div key={opt.type} onClick={()=>setMailForm(f=>({...f,type:opt.type}))}
                      className={`card-dark p-5 cursor-pointer border transition-colors ${mailForm.type===opt.type?"border-primary/40":"border-transparent hover:border-primary/20"}`}>
                      <div className={`flex items-center gap-3 mb-2 ${mailForm.type===opt.type?"text-primary":""}`}>
                        <Icon name={opt.icon as "Megaphone"} size={18} />
                        <span className="font-display font-bold text-sm uppercase tracking-wide">{opt.title}</span>
                        {mailForm.type===opt.type && <Icon name="Check" size={14} className="ml-auto text-primary" />}
                      </div>
                      <p className="text-xs text-muted-foreground">{opt.desc}</p>
                    </div>
                  ))}
                </div>
                <form onSubmit={async e => {
                  e.preventDefault(); setMailSending(true); setMailMsg("");
                  try {
                    const isSingle = mailForm.type==="single";
                    const r = await fetch(`${MAILER_URL}?action=${isSingle?"send":"broadcast"}`, {
                      method:"POST", headers: H(),
                      body: JSON.stringify(isSingle
                        ? { user_id:parseInt(mailForm.user_id), subject:mailForm.subject, message:mailForm.message, type:"info" }
                        : { subject:mailForm.subject, message:mailForm.message, role:"user" }),
                    });
                    const d = await r.json();
                    if (r.ok) { setMailMsg(isSingle?`Отправлено. Email: ${d.email_sent?"✓ доставлен":"в очереди"}`:`Рассылка: ${d.total_users} чел., Email: ${d.emails_sent}`); setMailForm(f=>({...f,subject:"",message:"",user_id:""})); }
                    else setMailMsg(d.error||"Ошибка");
                  } finally { setMailSending(false); }
                }} className="card-dark p-6 space-y-4">
                  {mailForm.type==="single" && <div><label className="label-tag mb-1.5 block">ID пользователя *</label><input required type="number" value={mailForm.user_id} onChange={e=>setMailForm(f=>({...f,user_id:e.target.value}))} className="input-dark" placeholder="Найдите ID в разделе «Пользователи»" /></div>}
                  <div><label className="label-tag mb-1.5 block">Тема *</label><input required type="text" value={mailForm.subject} onChange={e=>setMailForm(f=>({...f,subject:e.target.value}))} className="input-dark" placeholder="Ваш автомобиль готов!" /></div>
                  <div>
                    <label className="label-tag mb-1.5 block">Текст *</label>
                    <textarea required value={mailForm.message} onChange={e=>setMailForm(f=>({...f,message:e.target.value}))} className="input-dark resize-none h-32" placeholder={mailForm.type==="broadcast"?"Уважаемый, {name}! Напоминаем о плановом ТО...":"Ваш автомобиль прошёл диагностику. Можете забирать!"} />
                    {mailForm.type==="broadcast" && <p className="text-xs text-muted-foreground mt-1">Используйте <code className="bg-secondary px-1 rounded">{"{name}"}</code> для подстановки имени</p>}
                  </div>
                  {mailMsg && <div className={`text-xs px-3 py-2 rounded ${mailMsg.includes("Рассылка")||mailMsg.includes("Отправлено")?"bg-green-500/10 border border-green-500/30 text-green-500":"bg-destructive/10 border border-destructive/30 text-destructive"}`}>{mailMsg}</div>}
                  <button type="submit" disabled={mailSending} className="btn-red disabled:opacity-60">{mailSending?<><Icon name="Loader2" size={15} className="animate-spin"/>Отправляем...</>:<><Icon name="Send" size={15}/>{mailForm.type==="broadcast"?"Отправить всем":"Отправить"}</>}</button>
                </form>
              </div>
            )}

            {/* ── УПРАВЛЕНИЕ ПОЛЬЗОВАТЕЛЯМИ ── */}
            {activeTab === "user_mgmt" && (
              <div>
                {/* Ghost session overlay */}
                {ghostUser && ghostToken && (
                  <div className="fixed inset-0 z-[100] bg-background flex flex-col">
                    <div className="bg-amber-600 text-white px-4 py-2.5 flex items-center gap-3 shrink-0">
                      <Icon name="Eye" size={16} />
                      <span className="text-sm font-bold">Режим просмотра: {ghostUser.name} (ID {ghostUser.id})</span>
                      <span className="text-xs opacity-80 ml-1">— вы видите кабинет от лица пользователя, ваш вход нигде не отображается</span>
                      <button onClick={()=>{setGhostUser(null);setGhostToken(null);}} className="ml-auto bg-white/20 hover:bg-white/30 text-white text-xs px-3 py-1.5 font-bold uppercase tracking-wide flex items-center gap-1.5">
                        <Icon name="X" size={13} />Выйти из просмотра
                      </button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-6">
                      <div className="max-w-3xl mx-auto space-y-6">
                        <div className="card-dark p-5">
                          <div className="label-tag mb-4">Профиль пользователя</div>
                          <div className="flex items-center gap-4 mb-4">
                            <div className="w-14 h-14 bg-primary flex items-center justify-center text-white font-display font-black text-xl">
                              {ghostUser.name.split(" ").map(w=>w[0]).join("").toUpperCase().slice(0,2)}
                            </div>
                            <div>
                              <div className="font-display font-bold text-lg uppercase">{ghostUser.name}</div>
                              <div className="flex gap-2 mt-1 flex-wrap">
                                <span className="label-tag">{ghostUser.phone}</span>
                                {ghostUser.email && <span className="label-tag">{ghostUser.email}</span>}
                                {ghostUser.car_model && <span className="label-tag">{ghostUser.car_model}</span>}
                              </div>
                            </div>
                          </div>
                          <div className="grid grid-cols-3 gap-4">
                            <div className="card-dark p-4 text-center border-t-2 border-t-primary">
                              <div className="font-display font-bold text-2xl text-primary">{ghostUser.bonus_points}</div>
                              <div className="label-tag">баллов</div>
                            </div>
                            <div className="card-dark p-4 text-center border-t-2 border-t-border">
                              <div className="font-display font-bold text-2xl">{LEVEL_LABELS[ghostUser.club_level]||ghostUser.club_level}</div>
                              <div className="label-tag">уровень клуба</div>
                            </div>
                            <div className="card-dark p-4 text-center border-t-2 border-t-border">
                              <div className="font-display font-bold text-2xl">{ghostUser.role==="admin"?"Админ":"Клиент"}</div>
                              <div className="label-tag">роль</div>
                            </div>
                          </div>
                        </div>
                        <div className="card-dark p-5">
                          <div className="label-tag mb-3">Данные автомобиля</div>
                          <div className="grid sm:grid-cols-2 gap-3 text-sm">
                            {[["Модель", ghostUser.car_model],["Год", ghostUser.car_year],["VIN", ghostUser.car_vin],["Гос. номер", ghostUser.car_plate],["ФИО по СТС", ghostUser.full_name_sts],["№ СТС", ghostUser.car_sts]].map(([k,v])=>v?(
                              <div key={k as string} className="flex gap-2"><span className="label-tag">{k}:</span><span className="text-foreground">{v as string}</span></div>
                            ):null)}
                          </div>
                        </div>
                        <div className="bg-amber-600/10 border border-amber-600/30 rounded p-4 text-sm text-amber-500">
                          <Icon name="Info" size={15} className="inline mr-2" />
                          Это режим просмотра. Вы видите кабинет пользователя без возможности изменений от его имени. Ваш вход не логируется.
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
                  <div className="label-tag">Управление пользователями</div>
                  <button onClick={()=>{setUserDetail(null);setNewUserMsg("");}} className="btn-ghost text-xs py-1.5 px-3">
                    <Icon name="Plus" size={13} />Новый пользователь
                  </button>
                </div>

                {/* Форма создания нового пользователя */}
                {!userDetail && (
                  <form onSubmit={async e => {
                    e.preventDefault(); setNewUserSaving(true); setNewUserMsg("");
                    try {
                      const r = await fetch(`${ADMIN_URL}?action=create_user`, {
                        method: "POST", headers: H(), body: JSON.stringify(newUserForm)
                      });
                      const d = await r.json();
                      if (r.ok) {
                        setNewUserMsg(`✓ Создан: ${d.message}${d.temp_password ? `. Временный пароль: ${d.temp_password}` : ""}`);
                        setNewUserForm({ name:"", phone:"", email:"", password:"", car_model:"", car_year:"", car_vin:"", full_name_sts:"", car_plate:"", car_sts:"", role:"user", club_level:"bronze", bonus_points:"0" });
                        loadUsers();
                      } else setNewUserMsg(d.error || "Ошибка");
                    } finally { setNewUserSaving(false); }
                  }} className="card-dark p-6 space-y-5 mb-6">
                    <div className="font-display text-xs uppercase tracking-widest text-muted-foreground mb-1">Регистрация нового пользователя</div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div><label className="label-tag mb-1.5 block">Имя *</label><input required type="text" value={newUserForm.name} onChange={e=>setNewUserForm(f=>({...f,name:e.target.value}))} className="input-dark" placeholder="Иван Петров"/></div>
                      <div><label className="label-tag mb-1.5 block">Телефон *</label><input required type="tel" value={newUserForm.phone} onChange={e=>setNewUserForm(f=>({...f,phone:e.target.value}))} className="input-dark" placeholder="+79991234567"/></div>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div><label className="label-tag mb-1.5 block">Email</label><input type="email" value={newUserForm.email} onChange={e=>setNewUserForm(f=>({...f,email:e.target.value}))} className="input-dark" placeholder="user@mail.ru"/></div>
                      <div><label className="label-tag mb-1.5 block">Пароль (пусто = авто)</label><input type="text" value={newUserForm.password} onChange={e=>setNewUserForm(f=>({...f,password:e.target.value}))} className="input-dark" placeholder="Оставьте пустым для авто"/></div>
                    </div>
                    <div className="grid sm:grid-cols-3 gap-4">
                      <div><label className="label-tag mb-1.5 block">Автомобиль</label><input type="text" value={newUserForm.car_model} onChange={e=>setNewUserForm(f=>({...f,car_model:e.target.value}))} className="input-dark" placeholder="Toyota Camry"/></div>
                      <div><label className="label-tag mb-1.5 block">Год</label><input type="text" value={newUserForm.car_year} onChange={e=>setNewUserForm(f=>({...f,car_year:e.target.value}))} className="input-dark" placeholder="2020"/></div>
                      <div><label className="label-tag mb-1.5 block">Гос. номер</label><input type="text" value={newUserForm.car_plate} onChange={e=>setNewUserForm(f=>({...f,car_plate:e.target.value.toUpperCase()}))} className="input-dark" placeholder="А123БВ777"/></div>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div><label className="label-tag mb-1.5 block">ФИО по СТС</label><input type="text" value={newUserForm.full_name_sts} onChange={e=>setNewUserForm(f=>({...f,full_name_sts:e.target.value}))} className="input-dark" placeholder="Петров Иван Сергеевич"/></div>
                      <div><label className="label-tag mb-1.5 block">№ СТС</label><input type="text" value={newUserForm.car_sts} onChange={e=>setNewUserForm(f=>({...f,car_sts:e.target.value}))} className="input-dark" placeholder="77 АА 123456"/></div>
                    </div>
                    <div className="grid sm:grid-cols-3 gap-4">
                      <div><label className="label-tag mb-1.5 block">Роль</label>
                        <select value={newUserForm.role} onChange={e=>setNewUserForm(f=>({...f,role:e.target.value}))} className="input-dark">
                          <option value="user">Пользователь</option><option value="admin">Администратор</option>
                        </select>
                      </div>
                      <div><label className="label-tag mb-1.5 block">Уровень клуба</label>
                        <select value={newUserForm.club_level} onChange={e=>setNewUserForm(f=>({...f,club_level:e.target.value}))} className="input-dark">
                          {Object.entries(LEVEL_LABELS).map(([k,v])=><option key={k} value={k}>{v}</option>)}
                        </select>
                      </div>
                      <div><label className="label-tag mb-1.5 block">Бонусы</label><input type="number" value={newUserForm.bonus_points} onChange={e=>setNewUserForm(f=>({...f,bonus_points:e.target.value}))} className="input-dark"/></div>
                    </div>
                    {newUserMsg && <div className={`text-xs px-3 py-2 rounded ${newUserMsg.startsWith("✓")?"bg-green-500/10 border border-green-500/30 text-green-500":"bg-destructive/10 border border-destructive/30 text-destructive"}`}>{newUserMsg}</div>}
                    <button type="submit" disabled={newUserSaving} className="btn-red disabled:opacity-60">{newUserSaving?<><Icon name="Loader2" size={15} className="animate-spin"/>Создаём...</>:<><Icon name="UserPlus" size={15}/>Создать пользователя</>}</button>
                  </form>
                )}

                {/* Полное редактирование выбранного пользователя */}
                {userDetail && (
                  <div>
                    <button onClick={()=>setUserDetail(null)} className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-5 text-sm">
                      <Icon name="ArrowLeft" size={15} />Назад к созданию
                    </button>
                    {userDetailLoading ? <div className="card-dark p-10 text-center"><Icon name="Loader2" size={24} className="animate-spin mx-auto text-primary"/></div> : (
                      <div className="space-y-5">
                        {/* Карточка пользователя */}
                        <div className="card-dark p-5 flex items-center gap-4 flex-wrap">
                          <div className="w-12 h-12 bg-primary flex items-center justify-center text-white font-display font-black text-lg shrink-0">
                            {userDetail.name.split(" ").map(w=>w[0]).join("").toUpperCase().slice(0,2)}
                          </div>
                          <div className="flex-1">
                            <div className="font-display font-bold text-base uppercase tracking-wide">{userDetail.name}</div>
                            <div className="flex gap-2 mt-1 flex-wrap">
                              <span className="label-tag">#{userDetail.id}</span>
                              <span className="label-tag">{userDetail.phone}</span>
                              {userDetail.email && <span className="label-tag">{userDetail.email}</span>}
                              <span className="label-tag">Рег: {new Date(userDetail.created_at).toLocaleDateString("ru-RU")}</span>
                              {userDetail.last_login && <span className="label-tag">Вход: {new Date(userDetail.last_login).toLocaleDateString("ru-RU")}</span>}
                            </div>
                          </div>
                          <button
                            onClick={()=>ghostLogin(userDetail.id)}
                            disabled={ghostLoading === userDetail.id}
                            className="btn-ghost text-xs py-2 px-4 border-amber-600/40 text-amber-500 hover:bg-amber-600/10 shrink-0"
                          >
                            {ghostLoading===userDetail.id ? <Icon name="Loader2" size={14} className="animate-spin"/> : <Icon name="Eye" size={14}/>}
                            Войти в кабинет тихо
                          </button>
                        </div>

                        {/* Форма полного редактирования */}
                        <form onSubmit={async e => {
                          e.preventDefault(); setUserEditSaving(true); setUserEditMsg("");
                          try {
                            const r = await fetch(`${ADMIN_URL}?action=user_full&id=${userDetail.id}`, {
                              method: "PUT", headers: H(), body: JSON.stringify(userEditForm)
                            });
                            const d = await r.json();
                            if (r.ok) { setUserEditMsg("Сохранено!"); loadUserDetail(userDetail.id); }
                            else setUserEditMsg(d.error || "Ошибка");
                          } finally { setUserEditSaving(false); }
                        }} className="card-dark p-6 space-y-5">
                          <div className="font-display text-xs uppercase tracking-widest text-muted-foreground">Полное редактирование (без ограничений)</div>

                          <div className="grid sm:grid-cols-2 gap-4">
                            <div><label className="label-tag mb-1.5 block">Имя</label><input type="text" value={String(userEditForm.name||"")} onChange={e=>setUserEditForm(f=>({...f,name:e.target.value}))} className="input-dark"/></div>
                            <div><label className="label-tag mb-1.5 block">Телефон</label><input type="text" value={String(userEditForm.phone||"")} onChange={e=>setUserEditForm(f=>({...f,phone:e.target.value}))} className="input-dark"/></div>
                          </div>
                          <div className="grid sm:grid-cols-2 gap-4">
                            <div><label className="label-tag mb-1.5 block">Email</label><input type="email" value={String(userEditForm.email||"")} onChange={e=>setUserEditForm(f=>({...f,email:e.target.value}))} className="input-dark"/></div>
                            <div><label className="label-tag mb-1.5 block">Новый пароль</label><input type="text" value={String(userEditForm.new_password||"")} onChange={e=>setUserEditForm(f=>({...f,new_password:e.target.value}))} className="input-dark" placeholder="Оставьте пустым чтобы не менять"/></div>
                          </div>

                          <div className="pt-2 border-t border-border">
                            <div className="label-tag mb-3">Данные автомобиля</div>
                            <div className="grid sm:grid-cols-3 gap-4">
                              <div><label className="label-tag mb-1.5 block">Марка и модель</label><input type="text" value={String(userEditForm.car_model||"")} onChange={e=>setUserEditForm(f=>({...f,car_model:e.target.value}))} className="input-dark"/></div>
                              <div><label className="label-tag mb-1.5 block">Год</label><input type="text" value={String(userEditForm.car_year||"")} onChange={e=>setUserEditForm(f=>({...f,car_year:e.target.value}))} className="input-dark"/></div>
                              <div><label className="label-tag mb-1.5 block">VIN</label><input type="text" value={String(userEditForm.car_vin||"")} onChange={e=>setUserEditForm(f=>({...f,car_vin:e.target.value.toUpperCase()}))} className="input-dark"/></div>
                            </div>
                          </div>

                          <div className="pt-2 border-t border-border">
                            <div className="label-tag mb-3">Данные СТС (без лимита для администратора)</div>
                            <div className="grid sm:grid-cols-3 gap-4">
                              <div className="sm:col-span-3"><label className="label-tag mb-1.5 block">ФИО по СТС</label><input type="text" value={String(userEditForm.full_name_sts||"")} onChange={e=>setUserEditForm(f=>({...f,full_name_sts:e.target.value}))} className="input-dark"/></div>
                              <div><label className="label-tag mb-1.5 block">Гос. номер</label><input type="text" value={String(userEditForm.car_plate||"")} onChange={e=>setUserEditForm(f=>({...f,car_plate:e.target.value.toUpperCase()}))} className="input-dark"/></div>
                              <div><label className="label-tag mb-1.5 block">№ СТС</label><input type="text" value={String(userEditForm.car_sts||"")} onChange={e=>setUserEditForm(f=>({...f,car_sts:e.target.value}))} className="input-dark"/></div>
                              <div><label className="label-tag mb-1.5 block">Счётчик изменений СТС</label><input type="number" min="0" max="2" value={Number(userEditForm.sts_edit_count||0)} onChange={e=>setUserEditForm(f=>({...f,sts_edit_count:parseInt(e.target.value)}))} className="input-dark"/></div>
                            </div>
                          </div>

                          <div className="pt-2 border-t border-border">
                            <div className="label-tag mb-3">Аккаунт</div>
                            <div className="grid sm:grid-cols-3 gap-4">
                              <div><label className="label-tag mb-1.5 block">Роль</label>
                                <select value={String(userEditForm.role||"user")} onChange={e=>setUserEditForm(f=>({...f,role:e.target.value}))} className="input-dark">
                                  <option value="user">Пользователь</option><option value="admin">Администратор</option>
                                </select>
                              </div>
                              <div><label className="label-tag mb-1.5 block">Уровень клуба</label>
                                <select value={String(userEditForm.club_level||"bronze")} onChange={e=>setUserEditForm(f=>({...f,club_level:e.target.value}))} className="input-dark">
                                  {Object.entries(LEVEL_LABELS).map(([k,v])=><option key={k} value={k}>{v}</option>)}
                                </select>
                              </div>
                              <div><label className="label-tag mb-1.5 block">Бонусные баллы</label><input type="number" value={Number(userEditForm.bonus_points||0)} onChange={e=>setUserEditForm(f=>({...f,bonus_points:parseInt(e.target.value)}))} className="input-dark"/></div>
                            </div>
                            <div className="mt-4 flex items-center gap-3">
                              <label className="label-tag">Статус аккаунта:</label>
                              <button type="button" onClick={()=>setUserEditForm(f=>({...f,is_active:!f.is_active}))}
                                className={`px-3 py-1.5 text-xs font-display font-bold uppercase tracking-wide transition-colors ${userEditForm.is_active?"bg-green-500/10 border border-green-500/30 text-green-500":"bg-destructive/10 border border-destructive/30 text-destructive"}`}>
                                {userEditForm.is_active ? "Активен — нажать для блокировки" : "Заблокирован — нажать для разблокировки"}
                              </button>
                            </div>
                          </div>

                          {userEditMsg && <div className={`text-xs px-3 py-2 rounded ${userEditMsg==="Сохранено!"?"bg-green-500/10 border border-green-500/30 text-green-500":"bg-destructive/10 border border-destructive/30 text-destructive"}`}>{userEditMsg}</div>}
                          <button type="submit" disabled={userEditSaving} className="btn-red disabled:opacity-60">{userEditSaving?<><Icon name="Loader2" size={15} className="animate-spin"/>Сохраняем...</>:<><Icon name="Save" size={15}/>Сохранить все изменения</>}</button>
                        </form>

                        {/* История визитов пользователя */}
                        {userDetail.visits && userDetail.visits.length > 0 && (
                          <div className="card-dark p-5">
                            <div className="label-tag mb-4">История визитов ({userDetail.visits.length})</div>
                            <div className="space-y-2">
                              {userDetail.visits.map(v=>(
                                <div key={v.id} className="flex items-center gap-3 text-sm py-2 border-b border-border last:border-0">
                                  <div className="flex-1"><span className="font-medium">{v.service}</span><span className="label-tag ml-2">{v.visit_date}</span></div>
                                  <div className="text-right shrink-0"><div className="font-bold">{v.cost.toLocaleString("ru-RU")} ₽</div><div className="label-tag text-primary">+{v.bonus_earned} баллов</div></div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ── МОЯ ПОЧТА ── */}
            {activeTab === "my_mail" && (
              <div>
                <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
                  <div className="label-tag">Моя почта {unreadNotif>0&&<span className="ml-2 bg-primary text-white text-[9px] px-1.5 py-0.5 rounded-full font-bold">{unreadNotif} новых</span>}</div>
                  {unreadNotif>0 && <button onClick={()=>markNotifRead()} className="text-xs text-muted-foreground hover:text-primary transition-colors font-display uppercase tracking-wide">Прочитать все</button>}
                </div>
                {notifLoading ? <div className="card-dark p-10 text-center"><Icon name="Loader2" size={24} className="animate-spin mx-auto text-primary" /></div>
                : notifications.length===0 ? (
                  <div className="card-dark p-10 text-center">
                    <Icon name="Mail" size={32} className="text-muted-foreground mx-auto mb-4" />
                    <p className="font-display font-bold uppercase tracking-wide mb-2">Писем нет</p>
                    <p className="text-sm text-muted-foreground">Здесь будут системные уведомления</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {notifications.map(n => {
                      const iconMap: Record<string,string> = { welcome:"PartyPopper", info:"Info", success:"CheckCircle", warning:"AlertTriangle", broadcast:"Megaphone" };
                      return (
                        <div key={n.id} onClick={()=>!n.is_read&&markNotifRead(n.id)}
                          className={`card-dark p-4 flex gap-4 cursor-pointer hover:bg-secondary/10 transition-colors ${!n.is_read?"border-l-2 border-l-primary":"opacity-70"}`}>
                          <Icon name={(iconMap[n.type]||"Mail") as "Mail"} size={18} className={n.is_read?"text-muted-foreground shrink-0 mt-0.5":"text-primary shrink-0 mt-0.5"} />
                          <div className="flex-1 min-w-0">
                            <div className={`font-display font-bold text-sm tracking-wide ${!n.is_read?"text-foreground":"text-muted-foreground"}`}>{n.title}</div>
                            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{n.body}</p>
                            <div className="label-tag mt-2">{new Date(n.created_at).toLocaleString("ru-RU",{day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"})}</div>
                          </div>
                          {!n.is_read && <div className="w-2 h-2 bg-primary rounded-full shrink-0 mt-2" />}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ── МОЙ ЧАТ ── */}
            {activeTab === "my_chat" && (
              <div>
                {!activeChat ? (
                  <div>
                    <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
                      <div className="label-tag">Чат {unreadChat>0&&<span className="ml-2 bg-primary text-white text-[9px] px-1.5 py-0.5 rounded-full font-bold">{unreadChat}</span>}</div>
                      <button onClick={()=>setShowNewChat(s=>!s)} className="btn-ghost text-xs py-1.5 px-3"><Icon name="Plus" size={14}/>Новый диалог</button>
                    </div>
                    {showNewChat && (
                      <div className="card-dark p-4 mb-4">
                        <div className="label-tag mb-3">Выберите пользователя</div>
                        <div className="space-y-1 max-h-48 overflow-y-auto">
                          {chatUsers.map(cu=>(
                            <button key={cu.id} onClick={()=>{openChat(cu);setShowNewChat(false);}} className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-secondary/30 transition-colors text-left">
                              <div className="w-8 h-8 bg-primary/10 border border-primary/30 flex items-center justify-center text-xs font-bold font-display text-primary">{cu.name.split(" ").map(w=>w[0]).join("").toUpperCase().slice(0,2)}</div>
                              <div><div className="text-sm font-medium">{cu.name}</div><div className="label-tag">{cu.role==="admin"?"Администратор":"Клиент"}</div></div>
                            </button>
                          ))}
                          {chatUsers.length===0 && <p className="text-xs text-muted-foreground">Нет доступных пользователей</p>}
                        </div>
                      </div>
                    )}
                    {contacts.length===0 ? (
                      <div className="card-dark p-10 text-center"><Icon name="MessageCircle" size={32} className="text-muted-foreground mx-auto mb-4" /><p className="font-display font-bold uppercase mb-2">Диалогов нет</p><p className="text-sm text-muted-foreground">Нажмите «Новый диалог»</p></div>
                    ) : (
                      <div className="space-y-1">
                        {contacts.map(c=>(
                          <button key={c.id} onClick={()=>openChat({id:c.id,name:c.name,role:c.role})} className="w-full card-dark p-4 flex items-center gap-4 hover:bg-secondary/10 transition-colors text-left">
                            <div className="w-10 h-10 bg-primary/10 border border-primary/30 flex items-center justify-center shrink-0 text-sm font-bold font-display text-primary relative">
                              {c.name.split(" ").map(w=>w[0]).join("").toUpperCase().slice(0,2)}
                              {c.unread>0&&<span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-white text-[9px] rounded-full flex items-center justify-center font-bold">{c.unread}</span>}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-display font-bold text-sm">{c.name}</div>
                              {c.last_message && <p className="text-xs text-muted-foreground truncate mt-0.5">{c.last_message}</p>}
                            </div>
                            {c.last_at && <div className="label-tag shrink-0">{new Date(c.last_at).toLocaleTimeString("ru-RU",{hour:"2-digit",minute:"2-digit"})}</div>}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col h-[70vh]">
                    <div className="flex items-center gap-3 pb-4 border-b border-border mb-4">
                      <button onClick={()=>{setActiveChat(null);loadContacts();}} className="text-muted-foreground hover:text-foreground"><Icon name="ArrowLeft" size={18}/></button>
                      <div className="w-9 h-9 bg-primary/10 border border-primary/30 flex items-center justify-center text-xs font-bold font-display text-primary">{activeChat.name.split(" ").map(w=>w[0]).join("").toUpperCase().slice(0,2)}</div>
                      <div><div className="font-display font-bold text-sm">{activeChat.name}</div><div className="label-tag">{activeChat.role==="admin"?"Администратор":"Клиент"}</div></div>
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                      {chatLoading ? <div className="flex justify-center pt-10"><Icon name="Loader2" size={24} className="animate-spin text-primary"/></div>
                      : messages.length===0 ? <div className="text-center text-muted-foreground text-sm pt-10">Напишите первое сообщение</div>
                      : messages.map(m=>(
                        <div key={m.id} className={`flex ${m.mine?"justify-end":"justify-start"}`}>
                          <div className={`max-w-[75%] rounded px-3 py-2 text-sm ${m.mine?"bg-primary text-white":"bg-card border border-border"}`}>
                            {m.file_url&&m.file_type==="image"&&<a href={m.file_url} target="_blank" rel="noreferrer"><img src={m.file_url} alt={m.file_name||"img"} className="max-w-[220px] max-h-[220px] object-cover rounded mb-1"/></a>}
                            {m.file_url&&m.file_type==="video"&&<video src={m.file_url} controls className="max-w-[220px] rounded mb-1"/>}
                            {m.file_url&&m.file_type==="file"&&<a href={m.file_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-xs underline mb-1"><Icon name="Paperclip" size={13}/>{m.file_name||"Файл"}</a>}
                            {m.body&&<p className="leading-relaxed whitespace-pre-wrap break-words">{m.body}</p>}
                            <div className={`text-[10px] mt-1 ${m.mine?"text-white/60":"text-muted-foreground"}`}>{new Date(m.created_at).toLocaleTimeString("ru-RU",{hour:"2-digit",minute:"2-digit"})}</div>
                          </div>
                        </div>
                      ))}
                      <div ref={messagesEndRef}/>
                    </div>
                    <div className="pt-4 border-t border-border mt-4">
                      {showEmoji && <div className="mb-2 p-2 bg-card border border-border rounded flex flex-wrap gap-1">{EMOJI_LIST.map(em=><button key={em} onClick={()=>setMsgText(t=>t+em)} className="text-lg hover:scale-125 transition-transform p-0.5">{em}</button>)}</div>}
                      <div className="flex gap-2 items-end">
                        <button onClick={()=>setShowEmoji(s=>!s)} className={`p-2 shrink-0 transition-colors ${showEmoji?"text-primary":"text-muted-foreground hover:text-foreground"}`}><Icon name="Smile" size={20}/></button>
                        <button onClick={()=>fileInputRef.current?.click()} className="p-2 text-muted-foreground hover:text-foreground transition-colors shrink-0"><Icon name="Paperclip" size={20}/></button>
                        <input ref={fileInputRef} type="file" className="hidden" accept="image/*,video/*,.pdf,.doc,.docx" onChange={handleFileSelect}/>
                        <textarea value={msgText} onChange={e=>setMsgText(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendMessage();}}} className="input-dark flex-1 resize-none min-h-[40px] max-h-[120px] py-2 text-sm" placeholder="Сообщение... (Enter — отправить)" rows={1}/>
                        <button onClick={()=>sendMessage()} disabled={sendingMsg||!msgText.trim()} className="btn-red py-2 px-3 shrink-0 disabled:opacity-50">{sendingMsg?<Icon name="Loader2" size={16} className="animate-spin"/>:<Icon name="Send" size={16}/>}</button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1.5">Изображения, видео, документы до 20 МБ</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── МОИ НАСТРОЙКИ ── */}
            {activeTab === "my_settings" && (
              <div className="space-y-6">
                <div className="label-tag">Мои настройки</div>

                {/* Основные */}
                <form onSubmit={handleSaveProfile} className="card-dark p-6 space-y-4">
                  <div className="font-display text-xs uppercase tracking-widest text-muted-foreground mb-1">Личные данные</div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div><label className="label-tag mb-1.5 block">Имя *</label><input required type="text" value={profileForm.name} onChange={e=>setProfileForm({...profileForm,name:e.target.value})} className="input-dark"/></div>
                    <div><label className="label-tag mb-1.5 block">Email</label><input type="email" value={profileForm.email} onChange={e=>setProfileForm({...profileForm,email:e.target.value})} className="input-dark" placeholder="your@email.com"/></div>
                  </div>
                  <div className="pt-2 border-t border-border">
                    <div className="label-tag mb-3">Данные автомобиля</div>
                    <div className="grid sm:grid-cols-3 gap-4">
                      <div><label className="label-tag mb-1.5 block">Марка и модель</label><input type="text" value={profileForm.car_model} onChange={e=>setProfileForm({...profileForm,car_model:e.target.value})} className="input-dark" placeholder="Toyota Camry"/></div>
                      <div><label className="label-tag mb-1.5 block">Год выпуска</label><input type="text" value={profileForm.car_year} onChange={e=>setProfileForm({...profileForm,car_year:e.target.value})} className="input-dark" placeholder="2020"/></div>
                      <div><label className="label-tag mb-1.5 block">VIN номер</label><input type="text" value={profileForm.car_vin} onChange={e=>setProfileForm({...profileForm,car_vin:e.target.value.toUpperCase()})} className="input-dark" placeholder="XTA21..."/></div>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-border">
                    <div className="label-tag mb-3">Сменить пароль</div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div><label className="label-tag mb-1.5 block">Новый пароль</label><input type="password" value={profileForm.new_password} onChange={e=>setProfileForm({...profileForm,new_password:e.target.value})} className="input-dark" placeholder="Минимум 6 символов"/></div>
                      <div><label className="label-tag mb-1.5 block">Повторите</label><input type="password" value={profileForm.confirm_password} onChange={e=>setProfileForm({...profileForm,confirm_password:e.target.value})} className="input-dark" placeholder="Повторите пароль"/></div>
                    </div>
                  </div>
                  {saveMsg && <div className={`text-xs px-3 py-2 rounded ${saveMsg.includes("сохранен")?"bg-green-500/10 border border-green-500/30 text-green-500":"bg-destructive/10 border border-destructive/30 text-destructive"}`}>{saveMsg}</div>}
                  <button type="submit" disabled={saveLoading} className="btn-red disabled:opacity-60">{saveLoading?<><Icon name="Loader2" size={15} className="animate-spin"/>Сохраняем...</>:<><Icon name="Save" size={15}/>Сохранить</>}</button>
                </form>

                {/* Данные СТС */}
                <form onSubmit={handleSaveSts} className="card-dark p-6 space-y-4">
                  <div className="flex items-center justify-between flex-wrap gap-2 mb-1">
                    <div className="font-display text-xs uppercase tracking-widest text-muted-foreground">Данные по СТС</div>
                    <div className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium ${stsLocked?"bg-destructive/10 text-destructive border border-destructive/30":stsLeft===1?"bg-yellow-500/10 text-yellow-500 border border-yellow-500/30":"bg-green-500/10 text-green-500 border border-green-500/30"}`}>
                      <Icon name={stsLocked?"Lock":"Edit3"} size={11}/>
                      {stsLocked?"Заблокировано":`Осталось: ${stsLeft} из ${STS_LIMIT}`}
                    </div>
                  </div>
                  {stsLocked ? (
                    <div className="bg-destructive/5 border border-destructive/20 rounded p-4 flex gap-3">
                      <Icon name="Lock" size={18} className="text-destructive shrink-0 mt-0.5"/>
                      <div>
                        <p className="text-sm font-medium text-destructive">Лимит изменений исчерпан</p>
                        <p className="text-xs text-muted-foreground mt-1">Данные по СТС можно изменить максимум {STS_LIMIT} раза. Обратитесь в поддержку.</p>
                        <a href="https://poehali.dev/help" target="_blank" rel="noreferrer" className="text-xs text-primary underline mt-2 inline-block">Поддержка →</a>
                      </div>
                    </div>
                  ) : (
                    <>
                      {stsLeft===1 && <div className="bg-yellow-500/10 border border-yellow-500/30 rounded p-3 flex gap-3"><Icon name="AlertTriangle" size={16} className="text-yellow-500 shrink-0 mt-0.5"/><p className="text-xs text-yellow-500">Последнее доступное изменение. Проверьте данные перед сохранением.</p></div>}
                      <div className="grid sm:grid-cols-3 gap-4">
                        <div className="sm:col-span-3"><label className="label-tag mb-1.5 block">ФИО по СТС</label><input type="text" value={profileForm.full_name_sts} onChange={e=>setProfileForm({...profileForm,full_name_sts:e.target.value})} className="input-dark" placeholder="Петров Иван Сергеевич"/></div>
                        <div><label className="label-tag mb-1.5 block">Гос. номер</label><input type="text" value={profileForm.car_plate} onChange={e=>setProfileForm({...profileForm,car_plate:e.target.value.toUpperCase()})} className="input-dark" placeholder="А123БВ777"/></div>
                        <div><label className="label-tag mb-1.5 block">№ СТС</label><input type="text" value={profileForm.car_sts} onChange={e=>setProfileForm({...profileForm,car_sts:e.target.value})} className="input-dark" placeholder="77 АА 123456"/></div>
                      </div>
                      <button type="submit" disabled={saveLoading} className="btn-ghost text-sm disabled:opacity-60">{saveLoading?<><Icon name="Loader2" size={15} className="animate-spin"/>Сохраняем...</>:<><Icon name="Save" size={15}/>Сохранить данные СТС</>}</button>
                    </>
                  )}
                </form>

                {/* Выход */}
                <div className="card-dark p-5">
                  <div className="label-tag mb-3 text-muted-foreground">Сессия</div>
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div><p className="text-sm font-medium">Выйти из аккаунта</p><p className="text-xs text-muted-foreground">Завершить текущую сессию</p></div>
                    <button onClick={()=>{logout();onNavigate("home");}} className="btn-ghost text-sm text-destructive border-destructive/30 hover:bg-destructive/10"><Icon name="LogOut" size={15}/>Выйти</button>
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