import { useState, useEffect, useRef, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { useAuth } from "@/context/AuthContext";

const AUTH_URL   = "https://functions.poehali.dev/3e75355e-bbd8-4e2b-b8cd-aa607ff82304";
const CHAT_URL   = "https://functions.poehali.dev/62695b16-64b3-4804-820c-c7db5baf86a8";
const WALLET_URL = "https://functions.poehali.dev/686b24a0-6c64-41f9-8ff3-a7a49d17304b";

interface Visit {
  id: number; visit_number: string; service: string; car: string;
  cost: number; bonus_earned: number; status: string; visit_date: string;
}
interface Notification {
  id: number; title: string; body: string; type: string; is_read: boolean; created_at: string;
}
interface ChatUser { id: number; name: string; role: string; }
interface Contact { id: number; name: string; role: string; last_message?: string; last_at?: string; unread: number; }
interface Message {
  id: number; from: number; to: number; body?: string;
  file_url?: string; file_type?: string; file_name?: string;
  is_read: boolean; created_at: string; mine: boolean;
}

const LEVEL_LABELS: Record<string, string> = { bronze: "Бронза", silver: "Серебро", gold: "Золото", platinum: "Платинум" };
const LEVEL_COLORS: Record<string, string> = { bronze: "bg-amber-700", silver: "bg-gray-400", gold: "bg-yellow-500", platinum: "bg-purple-500" };
const LEVEL_DISCOUNT: Record<string, number> = { bronze: 3, silver: 5, gold: 10, platinum: 15 };
const LEVEL_THRESHOLD: Record<string, number> = { bronze: 500, silver: 2000, gold: 5000, platinum: 999999 };

const STS_LIMIT = 2;

const EMOJI_LIST = ["😊","😂","❤️","👍","🔥","🚗","🛠️","✅","⚠️","📞","📸","🎉","💪","🙏","😎","🤝","👌","💯","⭐","🏆","🔧","⚙️","🛞","🔑","📋","📅","💰","✨","😅","🤔"];

const tabs = [
  { id: "history",  label: "История",  icon: "ClipboardList" },
  { id: "wallet",   label: "Кошелёк",  icon: "Wallet" },
  { id: "bonus",    label: "Бонусы",   icon: "Star" },
  { id: "cars",     label: "Автомобили", icon: "Car" },
  { id: "mail",     label: "Почта",    icon: "Mail" },
  { id: "chat",     label: "Чат",      icon: "MessageCircle" },
  { id: "settings", label: "Настройки", icon: "Settings" },
];

interface AccountPageProps { onNavigate: (p: string) => void; }

export default function AccountPage({ onNavigate }: AccountPageProps) {
  const { user, token, logout, updateProfile, refreshProfile } = useAuth();
  const [activeTab, setActiveTab] = useState("history");
  const [visits, setVisits] = useState<Visit[]>([]);
  const [visitsLoading, setVisitsLoading] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const [unreadNotif, setUnreadNotif] = useState(0);
  const [unreadChat, setUnreadChat] = useState(0);

  // Wallet state
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [walletTxns, setWalletTxns] = useState<{type:string;amount:number;balance_after:number;description:string;created_at:string}[]>([]);
  const [walletLoading, setWalletLoading] = useState(false);
  const [topupAmount, setTopupAmount] = useState("500");
  const [topupLoading, setTopupLoading] = useState(false);
  const [topupMsg, setTopupMsg] = useState("");
  const [pendingOrderId, setPendingOrderId] = useState<number | null>(null);
  const [checkingPayment, setCheckingPayment] = useState(false);

  // Chat state
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [chatUsers, setChatUsers] = useState<ChatUser[]>([]);
  const [activeChat, setActiveChat] = useState<ChatUser | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [msgText, setMsgText] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [sendingMsg, setSendingMsg] = useState(false);
  const [showNewChat, setShowNewChat] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Profile form
  const [profileForm, setProfileForm] = useState({
    name: "", email: "", car_model: "", car_year: "", car_vin: "",
    full_name_sts: "", car_plate: "", car_sts: "",
    new_password: "", confirm_password: "",
  });
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  const authH = useCallback(() => ({ "Content-Type": "application/json", "X-Auth-Token": token || "" }), [token]);

  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || "", email: user.email || "",
        car_model: user.car_model || "", car_year: user.car_year || "",
        car_vin: user.car_vin || "", full_name_sts: user.full_name_sts || "",
        car_plate: user.car_plate || "", car_sts: user.car_sts || "",
        new_password: "", confirm_password: "",
      });
    }
  }, [user]);

  const loadWallet = useCallback(async () => {
    if (!token) return;
    setWalletLoading(true);
    try {
      const r = await fetch(`${WALLET_URL}?action=balance`, { headers: { "X-Auth-Token": token } });
      const d = await r.json();
      if (r.ok) { setWalletBalance(d.balance); setWalletTxns(d.transactions || []); }
    } finally { setWalletLoading(false); }
  }, [token]);

  // Загрузка баланса при входе
  useEffect(() => {
    if (token) loadWallet();
  }, [token]);

  // Загрузка данных по вкладке
  useEffect(() => {
    if (!token) return;
    if (activeTab === "mail")   loadNotifications();
    if (activeTab === "chat")   { loadContacts(); loadChatUsers(); }
    if (activeTab === "wallet") loadWallet();
  }, [activeTab, token]);

  // Счётчики непрочитанных
  useEffect(() => {
    if (!token) return;
    const loadCounts = () => {
      fetch(`${AUTH_URL}?action=notifications`, { headers: authH() })
        .then(r => r.json()).then(d => setUnreadNotif(d.unread || 0)).catch(() => {});
      fetch(`${CHAT_URL}?action=unread`, { headers: authH() })
        .then(r => r.json()).then(d => setUnreadChat(d.unread || 0)).catch(() => {});
    };
    loadCounts();
    const interval = setInterval(loadCounts, 15000);
    return () => clearInterval(interval);
  }, [token, authH]);

  // Скроллим чат вниз
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadNotifications = async () => {
    setNotifLoading(true);
    try {
      const res = await fetch(`${AUTH_URL}?action=notifications`, { headers: authH() });
      const data = await res.json();
      setNotifications(data.notifications || []);
      setUnreadNotif(data.unread || 0);
    } finally { setNotifLoading(false); }
  };

  const markNotifRead = async (id?: number) => {
    await fetch(`${AUTH_URL}?action=notifications_read`, {
      method: "PUT", headers: authH(),
      body: JSON.stringify(id ? { id } : {}),
    });
    loadNotifications();
  };

  const loadContacts = async () => {
    const res = await fetch(`${CHAT_URL}?action=contacts`, { headers: authH() });
    const data = await res.json();
    setContacts(data.contacts || []);
  };

  const loadChatUsers = async () => {
    const res = await fetch(`${CHAT_URL}?action=users`, { headers: authH() });
    const data = await res.json();
    setChatUsers(data.users || []);
  };

  const openChat = async (cu: ChatUser) => {
    setActiveChat(cu);
    setChatLoading(true);
    try {
      const res = await fetch(`${CHAT_URL}?action=messages&with=${cu.id}`, { headers: authH() });
      const data = await res.json();
      setMessages(data.messages || []);
      loadContacts();
    } finally { setChatLoading(false); }
  };

  const sendMessage = async (fileData?: string, fileName?: string, fileType?: string) => {
    if (!activeChat || (!msgText.trim() && !fileData)) return;
    setSendingMsg(true);
    try {
      await fetch(`${CHAT_URL}?action=send`, {
        method: "POST", headers: authH(),
        body: JSON.stringify({
          to: activeChat.id,
          body: msgText.trim() || undefined,
          file: fileData, file_name: fileName, file_type: fileType,
        }),
      });
      setMsgText("");
      const res = await fetch(`${CHAT_URL}?action=messages&with=${activeChat.id}`, { headers: authH() });
      const data = await res.json();
      setMessages(data.messages || []);
    } finally { setSendingMsg(false); }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const maxMB = 20;
    if (file.size > maxMB * 1024 * 1024) { alert(`Максимальный размер файла ${maxMB} МБ`); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const b64 = (reader.result as string).split(",")[1];
      const ft = file.type.startsWith("image/") ? "image" : file.type.startsWith("video/") ? "video" : "file";
      sendMessage(b64, file.name, ft);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (profileForm.new_password && profileForm.new_password !== profileForm.confirm_password) {
      setSaveMsg("Пароли не совпадают"); return;
    }
    setSaveLoading(true); setSaveMsg("");
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
      setProfileForm(p => ({ ...p, new_password: "", confirm_password: "" }));
      await refreshProfile();
    } catch (err: unknown) {
      setSaveMsg(err instanceof Error ? err.message : "Ошибка сохранения");
    } finally { setSaveLoading(false); }
  };

  const handleSaveSts = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveLoading(true); setSaveMsg("");
    try {
      await updateProfile({
        full_name_sts: profileForm.full_name_sts,
        car_plate: profileForm.car_plate,
        car_sts: profileForm.car_sts,
      });
      setSaveMsg("Данные по СТС сохранены!");
      await refreshProfile();
    } catch (err: unknown) {
      setSaveMsg(err instanceof Error ? err.message : "Ошибка сохранения");
    } finally { setSaveLoading(false); }
  };

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
            <Icon name="LogIn" size={16} />Войти / Зарегистрироваться
          </button>
        </div>
      </div>
    );
  }

  const level = user.club_level || "bronze";
  const nextLevel = level === "bronze" ? "silver" : level === "silver" ? "gold" : level === "gold" ? "platinum" : null;
  const nextThreshold = nextLevel ? LEVEL_THRESHOLD[level] : null;
  const progress = nextThreshold ? Math.min((user.bonus_points / nextThreshold) * 100, 100) : 100;
  const initials = user.name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
  const stsUsed = user.sts_edit_count ?? 0;
  const stsLeft = STS_LIMIT - stsUsed;
  const stsLocked = stsLeft <= 0;

  const tabsWithBadge = tabs.map(t => ({
    ...t,
    badge: t.id === "mail" ? unreadNotif : t.id === "chat" ? unreadChat : 0,
  }));

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
                {user.email && <span className="label-tag">{user.email}</span>}
                {user.car_model && <span className="label-tag">{user.car_model}</span>}
                <div className={`${LEVEL_COLORS[level]} text-white px-2 py-0.5 text-[9px] font-display font-bold tracking-widest uppercase`}>
                  {LEVEL_LABELS[level]}
                </div>
              </div>
            </div>
            <div className="flex gap-4 flex-wrap">
              <div className="text-center">
                <div className="font-display font-bold text-2xl text-primary">{user.bonus_points}</div>
                <div className="label-tag">баллов</div>
              </div>
              <div className="w-px bg-border" />
              <div className="text-center cursor-pointer hover:opacity-80 transition-opacity" onClick={()=>setActiveTab("wallet")}>
                <div className="font-display font-bold text-2xl text-green-400">
                  {walletBalance !== null ? `${walletBalance.toLocaleString("ru-RU")} ₽` : "—"}
                </div>
                <div className="label-tag">кошелёк</div>
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
              {tabsWithBadge.map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-5 py-3.5 border-b border-border last:border-0 transition-colors ${activeTab === tab.id ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground hover:bg-secondary/30"}`}
                >
                  <Icon name={tab.icon as "Star"} size={15} />
                  <span className="flex-1 text-left font-display text-xs uppercase tracking-wide">{tab.label}</span>
                  {tab.badge > 0 && (
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${activeTab === tab.id ? "bg-white/20 text-white" : "bg-primary text-white"}`}>{tab.badge}</span>
                  )}
                </button>
              ))}
            </nav>
            {user.role === "admin" && (
              <button onClick={() => onNavigate("admin")} className="w-full mt-3 flex items-center gap-2 text-xs text-primary hover:text-primary/80 px-5 py-2.5 transition-colors font-display uppercase tracking-wide border border-primary/30 hover:bg-primary/5">
                <Icon name="Shield" size={13} />Панель администратора
              </button>
            )}
            <button onClick={() => { logout(); onNavigate("home"); }} className="w-full mt-2 flex items-center gap-2 text-xs text-muted-foreground hover:text-primary px-5 py-2.5 transition-colors font-display uppercase tracking-wide">
              <Icon name="LogOut" size={13} />Выйти
            </button>
          </aside>

          {/* Content */}
          <div className="lg:col-span-3">

            {/* КОШЕЛЁК */}
            {activeTab === "wallet" && (
              <div>
                <div className="label-tag mb-5">Личный кошелёк</div>

                {/* Баланс */}
                <div className="card-dark p-6 mb-5 flex items-center gap-6 flex-wrap">
                  <div className="w-14 h-14 bg-green-500/10 border border-green-500/30 flex items-center justify-center shrink-0">
                    <Icon name="Wallet" size={28} className="text-green-400" />
                  </div>
                  <div className="flex-1">
                    <div className="label-tag mb-1">Текущий баланс</div>
                    <div className="font-display font-black text-4xl text-green-400">
                      {walletLoading ? <Icon name="Loader2" size={32} className="animate-spin text-green-400/50" /> : `${(walletBalance ?? 0).toLocaleString("ru-RU")} ₽`}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">Средства можно использовать при оплате услуг автосервиса</div>
                  </div>
                </div>

                {/* Форма пополнения */}
                <div className="card-dark p-6 mb-5">
                  <div className="font-display text-xs uppercase tracking-widest text-muted-foreground mb-4">Пополнить кошелёк</div>
                  <div className="flex gap-2 flex-wrap mb-4">
                    {[500, 1000, 2000, 5000].map(a => (
                      <button key={a} onClick={()=>setTopupAmount(String(a))}
                        className={`px-4 py-2 text-sm font-display font-bold border transition-colors ${topupAmount===String(a)?"border-green-500 bg-green-500/10 text-green-400":"border-border hover:border-green-500/50 text-muted-foreground hover:text-foreground"}`}>
                        {a.toLocaleString("ru-RU")} ₽
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-3 flex-wrap items-end">
                    <div className="flex-1 min-w-[160px]">
                      <label className="label-tag mb-1.5 block">Другая сумма (от 100 до 500 000 ₽)</label>
                      <div className="relative">
                        <input type="number" min="100" max="500000" value={topupAmount}
                          onChange={e=>setTopupAmount(e.target.value)}
                          className="input-dark pr-8 w-full"
                          placeholder="Введите сумму"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold text-sm">₽</span>
                      </div>
                    </div>
                    <button
                      disabled={topupLoading || !topupAmount || Number(topupAmount) < 100}
                      onClick={async () => {
                        setTopupLoading(true); setTopupMsg("");
                        try {
                          const returnUrl = window.location.href;
                          const r = await fetch(`${WALLET_URL}?action=create_payment`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json", "X-Auth-Token": token || "" },
                            body: JSON.stringify({ amount: Number(topupAmount), return_url: returnUrl })
                          });
                          const d = await r.json();
                          if (r.ok && d.confirmation_url) {
                            setPendingOrderId(d.order_id);
                            window.open(d.confirmation_url, "_blank");
                            setTopupMsg(`Платёж создан на сумму ${Number(topupAmount).toLocaleString("ru-RU")} ₽. После оплаты средства зачислятся автоматически.`);
                          } else {
                            setTopupMsg(d.error || "Ошибка создания платежа");
                          }
                        } finally { setTopupLoading(false); }
                      }}
                      className="btn-green disabled:opacity-60 py-3 px-6 whitespace-nowrap">
                      {topupLoading ? <><Icon name="Loader2" size={15} className="animate-spin"/>Создаём...</> : <><Icon name="CreditCard" size={15}/>Оплатить картой</>}
                    </button>
                  </div>
                  {topupMsg && (
                    <div className={`mt-3 text-xs px-3 py-2 rounded border ${topupMsg.includes("ошибка")||topupMsg.includes("Ошибка")?"border-destructive/30 bg-destructive/10 text-destructive":"border-green-500/30 bg-green-500/10 text-green-400"}`}>
                      {topupMsg}
                    </div>
                  )}
                  {pendingOrderId && (
                    <div className="mt-3 flex items-center gap-3">
                      <button
                        onClick={async () => {
                          setCheckingPayment(true);
                          try {
                            const r = await fetch(`${WALLET_URL}?action=check_payment&order_id=${pendingOrderId}`, {
                              headers: { "X-Auth-Token": token || "" }
                            });
                            const d = await r.json();
                            if (d.status === "succeeded") {
                              setWalletBalance(d.balance);
                              setTopupMsg(`Оплата подтверждена! Баланс: ${d.balance.toLocaleString("ru-RU")} ₽`);
                              setPendingOrderId(null);
                              loadWallet();
                            } else if (d.status === "canceled") {
                              setTopupMsg("Платёж отменён.");
                              setPendingOrderId(null);
                            } else {
                              setTopupMsg("Платёж ещё не поступил. Попробуйте через несколько секунд.");
                            }
                          } finally { setCheckingPayment(false); }
                        }}
                        disabled={checkingPayment}
                        className="btn-ghost text-xs py-1.5 px-3">
                        {checkingPayment ? <Icon name="Loader2" size={13} className="animate-spin"/> : <Icon name="RefreshCw" size={13}/>}
                        Проверить оплату
                      </button>
                      <span className="text-xs text-muted-foreground">Нажмите после того как оплатили</span>
                    </div>
                  )}
                </div>

                {/* История транзакций */}
                <div className="card-dark p-5">
                  <div className="font-display text-xs uppercase tracking-widest text-muted-foreground mb-4">История операций</div>
                  {walletLoading ? (
                    <div className="py-8 text-center"><Icon name="Loader2" size={20} className="animate-spin mx-auto text-primary" /></div>
                  ) : walletTxns.length === 0 ? (
                    <div className="py-8 text-center text-muted-foreground">
                      <Icon name="Receipt" size={24} className="mx-auto mb-3 opacity-40" />
                      <p className="text-sm">Операций пока нет</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {walletTxns.map((t, i) => {
                        const isCredit = t.amount > 0;
                        const typeLabel: Record<string, string> = {
                          topup: "Пополнение", spend: "Оплата", refund: "Возврат", admin_adjust: "Корректировка"
                        };
                        return (
                          <div key={i} className="flex items-center gap-3 py-3 border-b border-border last:border-0">
                            <div className={`w-8 h-8 flex items-center justify-center shrink-0 ${isCredit?"bg-green-500/10":"bg-destructive/10"}`}>
                              <Icon name={isCredit?"ArrowDownLeft":"ArrowUpRight"} size={15} className={isCredit?"text-green-400":"text-destructive"} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium">{typeLabel[t.type] || t.type}</div>
                              {t.description && <div className="text-xs text-muted-foreground truncate">{t.description}</div>}
                              <div className="text-xs text-muted-foreground">{new Date(t.created_at).toLocaleString("ru-RU")}</div>
                            </div>
                            <div className="text-right shrink-0">
                              <div className={`font-display font-bold text-sm ${isCredit?"text-green-400":"text-destructive"}`}>
                                {isCredit?"+":""}{t.amount.toLocaleString("ru-RU")} ₽
                              </div>
                              <div className="text-xs text-muted-foreground">{t.balance_after.toLocaleString("ru-RU")} ₽</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ИСТОРИЯ */}
            {activeTab === "history" && (
              <div>
                <div className="label-tag mb-5">История обслуживания</div>
                {visitsLoading ? (
                  <div className="card-dark p-10 text-center"><Icon name="Loader2" size={24} className="animate-spin mx-auto text-primary" /></div>
                ) : visits.length === 0 ? (
                  <div className="card-dark p-10 text-center">
                    <Icon name="ClipboardList" size={32} className="text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-display font-bold uppercase tracking-wide mb-2">Визитов пока нет</h3>
                    <p className="text-sm text-muted-foreground mb-6">Запишитесь на первое обслуживание</p>
                    <button onClick={() => onNavigate("booking")} className="btn-red"><Icon name="CalendarCheck" size={16} />Записаться</button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {visits.map(v => (
                      <div key={v.id} className="card-dark p-5 flex items-center gap-5 flex-wrap">
                        <div className="flex-1 min-w-0">
                          <div className="font-display font-bold text-sm uppercase tracking-wide">{v.service}</div>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="label-tag">{v.visit_date}</span>
                            {v.car && <span className="label-tag">{v.car}</span>}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="font-display font-bold text-sm">{v.cost.toLocaleString("ru-RU")} ₽</div>
                          <div className="label-tag text-primary">+{v.bonus_earned} баллов</div>
                        </div>
                      </div>
                    ))}
                  </div>
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
                  <div className="card-dark p-5">
                    <div className="label-tag mb-4">Прогресс до «{LEVEL_LABELS[nextLevel]}»</div>
                    <div className="flex items-center gap-4">
                      <span className="label-tag shrink-0">{LEVEL_LABELS[level]}</span>
                      <div className="flex-1 h-2 bg-secondary relative">
                        <div className="absolute left-0 top-0 h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
                      </div>
                      <span className="label-tag shrink-0 text-primary">{LEVEL_LABELS[nextLevel]}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* АВТОМОБИЛИ */}
            {activeTab === "cars" && (
              <div>
                <div className="label-tag mb-5">Мои автомобили</div>
                <div className="card-dark p-6">
                  <div className="flex items-start gap-4 mb-5">
                    <div className="w-12 h-12 bg-primary/10 border border-primary/30 flex items-center justify-center shrink-0">
                      <Icon name="Car" size={24} className="text-primary" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="font-display font-bold text-base uppercase tracking-wide">{user.car_model || "Не указан"}</div>
                      {user.car_year && <div className="label-tag">Год: {user.car_year}</div>}
                      {user.car_vin && <div className="label-tag">VIN: {user.car_vin}</div>}
                      {user.car_plate && <div className="label-tag">Гос. номер: {user.car_plate}</div>}
                      {user.full_name_sts && <div className="label-tag">ФИО по СТС: {user.full_name_sts}</div>}
                      {user.car_sts && <div className="label-tag">№ СТС: {user.car_sts}</div>}
                    </div>
                  </div>
                  <button onClick={() => setActiveTab("settings")} className="btn-ghost text-sm">
                    <Icon name="Edit" size={15} />Изменить данные
                  </button>
                </div>
              </div>
            )}

            {/* ПОЧТА — уведомления от компании */}
            {activeTab === "mail" && (
              <div>
                <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
                  <div className="label-tag">Почта {unreadNotif > 0 && <span className="ml-2 bg-primary text-white text-[9px] px-1.5 py-0.5 rounded-full font-bold">{unreadNotif} новых</span>}</div>
                  {unreadNotif > 0 && (
                    <button onClick={() => markNotifRead()} className="text-xs text-muted-foreground hover:text-primary transition-colors font-display uppercase tracking-wide">
                      Прочитать все
                    </button>
                  )}
                </div>
                {notifLoading ? (
                  <div className="card-dark p-10 text-center"><Icon name="Loader2" size={24} className="animate-spin mx-auto text-primary" /></div>
                ) : notifications.length === 0 ? (
                  <div className="card-dark p-10 text-center">
                    <Icon name="Mail" size={32} className="text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-display font-bold uppercase tracking-wide mb-2">Писем нет</h3>
                    <p className="text-sm text-muted-foreground">Здесь будут появляться уведомления от DD MAXI: о готовности автомобиля, акциях и новостях</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {notifications.map(n => {
                      const iconMap: Record<string, string> = { welcome: "PartyPopper", info: "Info", success: "CheckCircle", warning: "AlertTriangle", broadcast: "Megaphone" };
                      const icon = iconMap[n.type] || "Mail";
                      return (
                        <div
                          key={n.id}
                          onClick={() => !n.is_read && markNotifRead(n.id)}
                          className={`card-dark p-4 flex gap-4 cursor-pointer hover:bg-secondary/10 transition-colors ${!n.is_read ? "border-l-2 border-l-primary" : "opacity-70"}`}
                        >
                          <Icon name={icon as "Mail"} size={18} className={n.is_read ? "text-muted-foreground shrink-0 mt-0.5" : "text-primary shrink-0 mt-0.5"} />
                          <div className="flex-1 min-w-0">
                            <div className={`font-display font-bold text-sm tracking-wide ${!n.is_read ? "text-foreground" : "text-muted-foreground"}`}>{n.title}</div>
                            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{n.body}</p>
                            <div className="label-tag mt-2">{new Date(n.created_at).toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}</div>
                          </div>
                          {!n.is_read && <div className="w-2 h-2 bg-primary rounded-full shrink-0 mt-2" />}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ЧАТ */}
            {activeTab === "chat" && (
              <div>
                {!activeChat ? (
                  <div>
                    <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
                      <div className="label-tag">Сообщения</div>
                      <button onClick={() => setShowNewChat(!showNewChat)} className="btn-ghost text-xs py-1.5 px-3">
                        <Icon name="Plus" size={14} />Новый чат
                      </button>
                    </div>

                    {showNewChat && (
                      <div className="card-dark p-4 mb-4">
                        <div className="label-tag mb-3">Выберите пользователя</div>
                        {chatUsers.length === 0 ? (
                          <p className="text-xs text-muted-foreground">Нет доступных пользователей</p>
                        ) : (
                          <div className="space-y-1 max-h-48 overflow-y-auto">
                            {chatUsers.map(cu => (
                              <button key={cu.id} onClick={() => { openChat(cu); setShowNewChat(false); }}
                                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-secondary/30 transition-colors text-left">
                                <div className="w-8 h-8 bg-primary/10 border border-primary/30 flex items-center justify-center text-xs font-bold font-display text-primary">
                                  {cu.name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)}
                                </div>
                                <div>
                                  <div className="text-sm font-medium">{cu.name}</div>
                                  <div className="label-tag">{cu.role === "admin" ? "Администратор" : "Клиент"}</div>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {contacts.length === 0 ? (
                      <div className="card-dark p-10 text-center">
                        <Icon name="MessageCircle" size={32} className="text-muted-foreground mx-auto mb-4" />
                        <h3 className="font-display font-bold uppercase tracking-wide mb-2">Диалогов нет</h3>
                        <p className="text-sm text-muted-foreground">Начните переписку, нажав «Новый чат»</p>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {contacts.map(c => (
                          <button key={c.id} onClick={() => openChat({ id: c.id, name: c.name, role: c.role })}
                            className="w-full card-dark p-4 flex items-center gap-4 hover:bg-secondary/10 transition-colors text-left">
                            <div className="w-10 h-10 bg-primary/10 border border-primary/30 flex items-center justify-center shrink-0 text-sm font-bold font-display text-primary relative">
                              {c.name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)}
                              {c.unread > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-white text-[9px] rounded-full flex items-center justify-center font-bold">{c.unread}</span>}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-display font-bold text-sm tracking-wide">{c.name}</div>
                              {c.last_message && <p className="text-xs text-muted-foreground truncate mt-0.5">{c.last_message}</p>}
                            </div>
                            {c.last_at && <div className="label-tag shrink-0">{new Date(c.last_at).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}</div>}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col h-[70vh]">
                    {/* Chat header */}
                    <div className="flex items-center gap-3 pb-4 border-b border-border mb-4">
                      <button onClick={() => { setActiveChat(null); loadContacts(); }} className="text-muted-foreground hover:text-foreground">
                        <Icon name="ArrowLeft" size={18} />
                      </button>
                      <div className="w-9 h-9 bg-primary/10 border border-primary/30 flex items-center justify-center text-xs font-bold font-display text-primary">
                        {activeChat.name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)}
                      </div>
                      <div>
                        <div className="font-display font-bold text-sm tracking-wide">{activeChat.name}</div>
                        <div className="label-tag">{activeChat.role === "admin" ? "Администратор" : "Клиент"}</div>
                      </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                      {chatLoading ? (
                        <div className="flex justify-center pt-10"><Icon name="Loader2" size={24} className="animate-spin text-primary" /></div>
                      ) : messages.length === 0 ? (
                        <div className="text-center text-muted-foreground text-sm pt-10">Напишите первое сообщение</div>
                      ) : (
                        messages.map(m => (
                          <div key={m.id} className={`flex ${m.mine ? "justify-end" : "justify-start"}`}>
                            <div className={`max-w-[75%] rounded px-3 py-2 text-sm ${m.mine ? "bg-primary text-white" : "bg-card border border-border"}`}>
                              {m.file_url && m.file_type === "image" && (
                                <a href={m.file_url} target="_blank" rel="noreferrer">
                                  <img src={m.file_url} alt={m.file_name || "image"} className="max-w-[220px] max-h-[220px] object-cover rounded mb-1" />
                                </a>
                              )}
                              {m.file_url && m.file_type === "video" && (
                                <video src={m.file_url} controls className="max-w-[220px] rounded mb-1" />
                              )}
                              {m.file_url && m.file_type === "file" && (
                                <a href={m.file_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-xs underline mb-1">
                                  <Icon name="Paperclip" size={13} />{m.file_name || "Файл"}
                                </a>
                              )}
                              {m.body && <p className="leading-relaxed whitespace-pre-wrap break-words">{m.body}</p>}
                              <div className={`text-[10px] mt-1 ${m.mine ? "text-white/60" : "text-muted-foreground"}`}>
                                {new Date(m.created_at).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                      <div ref={messagesEndRef} />
                    </div>

                    {/* Input area */}
                    <div className="pt-4 border-t border-border mt-4">
                      {/* Emoji picker */}
                      {showEmoji && (
                        <div className="mb-2 p-2 bg-card border border-border rounded flex flex-wrap gap-1">
                          {EMOJI_LIST.map(em => (
                            <button key={em} onClick={() => setMsgText(t => t + em)} className="text-lg hover:scale-125 transition-transform p-0.5">{em}</button>
                          ))}
                        </div>
                      )}
                      <div className="flex gap-2 items-end">
                        <button onClick={() => setShowEmoji(s => !s)} className={`p-2 shrink-0 transition-colors ${showEmoji ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}>
                          <Icon name="Smile" size={20} />
                        </button>
                        <button onClick={() => fileInputRef.current?.click()} className="p-2 text-muted-foreground hover:text-foreground transition-colors shrink-0">
                          <Icon name="Paperclip" size={20} />
                        </button>
                        <input ref={fileInputRef} type="file" className="hidden" accept="image/*,video/*,.pdf,.doc,.docx" onChange={handleFileSelect} />
                        <textarea
                          value={msgText}
                          onChange={e => setMsgText(e.target.value)}
                          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                          className="input-dark flex-1 resize-none min-h-[40px] max-h-[120px] py-2 text-sm"
                          placeholder="Сообщение... (Enter — отправить, Shift+Enter — новая строка)"
                          rows={1}
                        />
                        <button
                          onClick={() => sendMessage()}
                          disabled={sendingMsg || (!msgText.trim())}
                          className="btn-red py-2 px-3 shrink-0 disabled:opacity-50"
                        >
                          {sendingMsg ? <Icon name="Loader2" size={16} className="animate-spin" /> : <Icon name="Send" size={16} />}
                        </button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1.5">Поддерживаются изображения, видео и документы до 20 МБ</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* НАСТРОЙКИ */}
            {activeTab === "settings" && (
              <div className="space-y-6">
                <div className="label-tag">Настройки профиля</div>

                {/* Основные данные */}
                <form onSubmit={handleSaveProfile} className="card-dark p-6 space-y-4">
                  <div className="font-display text-xs uppercase tracking-widest text-muted-foreground mb-2">Личные данные</div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="label-tag mb-1.5 block">Имя *</label>
                      <input required type="text" value={profileForm.name} onChange={e => setProfileForm({ ...profileForm, name: e.target.value })} className="input-dark" placeholder="Ваше имя" />
                    </div>
                    <div>
                      <label className="label-tag mb-1.5 block">Email</label>
                      <input type="email" value={profileForm.email} onChange={e => setProfileForm({ ...profileForm, email: e.target.value })} className="input-dark" placeholder="your@email.com" />
                    </div>
                  </div>

                  <div className="pt-2 border-t border-border">
                    <div className="label-tag mb-3">Данные автомобиля</div>
                    <div className="grid sm:grid-cols-3 gap-4">
                      <div className="sm:col-span-1">
                        <label className="label-tag mb-1.5 block">Марка и модель</label>
                        <input type="text" value={profileForm.car_model} onChange={e => setProfileForm({ ...profileForm, car_model: e.target.value })} className="input-dark" placeholder="Toyota Camry" />
                      </div>
                      <div>
                        <label className="label-tag mb-1.5 block">Год выпуска</label>
                        <input type="text" value={profileForm.car_year} onChange={e => setProfileForm({ ...profileForm, car_year: e.target.value })} className="input-dark" placeholder="2020" />
                      </div>
                      <div>
                        <label className="label-tag mb-1.5 block">VIN номер</label>
                        <input type="text" value={profileForm.car_vin} onChange={e => setProfileForm({ ...profileForm, car_vin: e.target.value.toUpperCase() })} className="input-dark" placeholder="XTA21..." />
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-border">
                    <div className="label-tag mb-3">Сменить пароль</div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="label-tag mb-1.5 block">Новый пароль</label>
                        <input type="password" value={profileForm.new_password} onChange={e => setProfileForm({ ...profileForm, new_password: e.target.value })} className="input-dark" placeholder="Минимум 6 символов" />
                      </div>
                      <div>
                        <label className="label-tag mb-1.5 block">Повторите пароль</label>
                        <input type="password" value={profileForm.confirm_password} onChange={e => setProfileForm({ ...profileForm, confirm_password: e.target.value })} className="input-dark" placeholder="Повторите пароль" />
                      </div>
                    </div>
                  </div>

                  {saveMsg && (
                    <div className={`text-xs px-3 py-2 rounded ${saveMsg.includes("сохранен") ? "bg-green-500/10 border border-green-500/30 text-green-500" : "bg-destructive/10 border border-destructive/30 text-destructive"}`}>
                      {saveMsg}
                    </div>
                  )}
                  <button type="submit" disabled={saveLoading} className="btn-red disabled:opacity-60">
                    {saveLoading ? <><Icon name="Loader2" size={15} className="animate-spin" />Сохраняем...</> : <><Icon name="Save" size={15} />Сохранить</>}
                  </button>
                </form>

                {/* Данные СТС — с лимитом */}
                <form onSubmit={handleSaveSts} className="card-dark p-6 space-y-4">
                  <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                    <div className="font-display text-xs uppercase tracking-widest text-muted-foreground">Данные по СТС</div>
                    <div className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium ${stsLocked ? "bg-destructive/10 text-destructive border border-destructive/30" : stsLeft === 1 ? "bg-yellow-500/10 text-yellow-500 border border-yellow-500/30" : "bg-green-500/10 text-green-500 border border-green-500/30"}`}>
                      <Icon name={stsLocked ? "Lock" : "Edit3"} size={11} />
                      {stsLocked ? "Изменения заблокированы" : `Осталось изменений: ${stsLeft} из ${STS_LIMIT}`}
                    </div>
                  </div>

                  {stsLocked ? (
                    <div className="bg-destructive/5 border border-destructive/20 rounded p-4">
                      <div className="flex gap-3">
                        <Icon name="Lock" size={18} className="text-destructive shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-destructive">Лимит изменений исчерпан</p>
                          <p className="text-xs text-muted-foreground mt-1">Данные по СТС (ФИО, гос. номер, № СТС) можно изменить максимум {STS_LIMIT} раза. Для дальнейших изменений обратитесь в поддержку DD MAXI.</p>
                          <a href="https://poehali.dev/help" target="_blank" rel="noreferrer" className="text-xs text-primary underline mt-2 inline-block hover:text-primary/80">Обратиться в поддержку →</a>
                        </div>
                      </div>
                      <div className="mt-4 grid sm:grid-cols-3 gap-3 opacity-60 pointer-events-none">
                        <div><label className="label-tag mb-1.5 block">ФИО по СТС</label><input disabled type="text" value={profileForm.full_name_sts} className="input-dark" /></div>
                        <div><label className="label-tag mb-1.5 block">Гос. номер</label><input disabled type="text" value={profileForm.car_plate} className="input-dark" /></div>
                        <div><label className="label-tag mb-1.5 block">№ СТС</label><input disabled type="text" value={profileForm.car_sts} className="input-dark" /></div>
                      </div>
                    </div>
                  ) : (
                    <>
                      {stsLeft === 1 && (
                        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded p-3 flex gap-3">
                          <Icon name="AlertTriangle" size={16} className="text-yellow-500 shrink-0 mt-0.5" />
                          <p className="text-xs text-yellow-500">Внимание! После этого изменения данные по СТС будут заблокированы. Проверьте правильность перед сохранением.</p>
                        </div>
                      )}
                      <div className="grid sm:grid-cols-3 gap-4">
                        <div className="sm:col-span-3">
                          <label className="label-tag mb-1.5 block">ФИО по СТС</label>
                          <input type="text" value={profileForm.full_name_sts} onChange={e => setProfileForm({ ...profileForm, full_name_sts: e.target.value })} className="input-dark" placeholder="Петров Иван Сергеевич" />
                        </div>
                        <div>
                          <label className="label-tag mb-1.5 block">Гос. номер</label>
                          <input type="text" value={profileForm.car_plate} onChange={e => setProfileForm({ ...profileForm, car_plate: e.target.value.toUpperCase() })} className="input-dark" placeholder="А123БВ777" />
                        </div>
                        <div>
                          <label className="label-tag mb-1.5 block">№ СТС</label>
                          <input type="text" value={profileForm.car_sts} onChange={e => setProfileForm({ ...profileForm, car_sts: e.target.value })} className="input-dark" placeholder="77 АА 123456" />
                        </div>
                      </div>
                      <button type="submit" disabled={saveLoading} className="btn-ghost text-sm disabled:opacity-60">
                        {saveLoading ? <><Icon name="Loader2" size={15} className="animate-spin" />Сохраняем...</> : <><Icon name="Save" size={15} />Сохранить данные СТС</>}
                      </button>
                    </>
                  )}
                </form>

                {/* Выход */}
                <div className="card-dark p-5">
                  <div className="label-tag mb-3 text-muted-foreground">Сессия</div>
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                      <p className="text-sm font-medium">Выйти из аккаунта</p>
                      <p className="text-xs text-muted-foreground">Завершить текущую сессию</p>
                    </div>
                    <button onClick={() => { logout(); onNavigate("home"); }} className="btn-ghost text-sm text-destructive border-destructive/30 hover:bg-destructive/10">
                      <Icon name="LogOut" size={15} />Выйти
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