import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";

const CLUB_CARDS_URL = "https://functions.poehali.dev/4cc0091e-cb30-4837-926f-54eb05b99c99";

const LEVEL_COLORS: Record<string, string> = {
  bronze: "from-amber-800 to-amber-600",
  silver: "from-gray-500 to-gray-300",
  gold:   "from-yellow-600 to-yellow-400",
  platinum: "from-purple-700 to-purple-400",
};
const LEVEL_TEXT: Record<string, string> = {
  bronze: "text-amber-100", silver: "text-gray-900",
  gold: "text-yellow-900", platinum: "text-purple-100",
};

interface CardInfo {
  id: number; name: string; phone: string;
  club_level: string; club_level_label: string;
  bonus_points: number; club_card_number: string;
  car_model?: string; member_since: string;
  wallet_balance: number; discount_percent: number;
}

interface Props { token: string; onNavigate: (p: string) => void; }

export default function ClubCardPage({ token, onNavigate }: Props) {
  const [info,    setInfo]    = useState<CardInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const cardToken = params.get("card") || "";
    window.history.replaceState({}, "", window.location.pathname);

    if (!cardToken) { setError("Карта не найдена"); setLoading(false); return; }

    fetch(`${CLUB_CARDS_URL}?action=card_info&token=${encodeURIComponent(cardToken)}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) setError(d.error);
        else setInfo(d);
      })
      .catch(() => setError("Ошибка соединения"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Icon name="Loader2" size={40} className="animate-spin text-primary" />
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="text-center">
        <Icon name="XCircle" size={48} className="text-destructive mx-auto mb-4" />
        <h2 className="font-display font-bold text-xl uppercase mb-2">Карта не найдена</h2>
        <p className="text-muted-foreground text-sm mb-6">{error}</p>
        <button onClick={() => onNavigate("home")} className="btn-red">
          <Icon name="Home" size={15}/>На главную
        </button>
      </div>
    </div>
  );

  if (!info) return null;

  const lvl = info.club_level;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">

        {/* Карточка */}
        <div className={`relative rounded-2xl bg-gradient-to-br ${LEVEL_COLORS[lvl] || LEVEL_COLORS.bronze} p-6 mb-6 shadow-2xl overflow-hidden`}>
          <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-white/10 -translate-y-10 translate-x-10" />
          <div className="relative z-10">
            <div className={`text-2xl font-black tracking-wide uppercase mb-1 ${LEVEL_TEXT[lvl] || "text-white"}`}>
              DD MAXI SRS
            </div>
            <div className={`text-xs opacity-70 mb-5 ${LEVEL_TEXT[lvl] || "text-white"}`}>Клубная карта</div>
            <div className={`font-mono text-lg font-bold mb-1 tracking-widest ${LEVEL_TEXT[lvl] || "text-white"}`}>
              {info.club_card_number}
            </div>
            <div className={`text-xl font-bold mb-0.5 ${LEVEL_TEXT[lvl] || "text-white"}`}>{info.name}</div>
            <div className={`text-xs opacity-70 ${LEVEL_TEXT[lvl] || "text-white"}`}>
              Член клуба с {new Date(info.member_since).toLocaleDateString("ru-RU", {month:"long", year:"numeric"})}
            </div>
            <div className="flex items-center justify-between mt-5">
              <span className={`px-3 py-1 rounded-full text-xs font-bold bg-white/20 ${LEVEL_TEXT[lvl] || "text-white"}`}>
                {info.club_level_label}
              </span>
              <span className={`text-xs font-bold ${LEVEL_TEXT[lvl] || "text-white"}`}>
                Скидка {info.discount_percent}%
              </span>
            </div>
          </div>
        </div>

        {/* Статистика */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="card-dark p-4 text-center">
            <div className="font-display font-black text-2xl text-primary">{info.bonus_points.toLocaleString("ru-RU")}</div>
            <div className="label-tag mt-1">бонусных баллов</div>
            <div className="text-xs text-muted-foreground mt-0.5">1 балл = 1 ₽</div>
          </div>
          <div className="card-dark p-4 text-center">
            <div className="font-display font-black text-2xl text-green-400">{info.wallet_balance.toLocaleString("ru-RU")} ₽</div>
            <div className="label-tag mt-1">на кошельке</div>
            <div className="text-xs text-muted-foreground mt-0.5">доступно к оплате</div>
          </div>
        </div>

        {info.car_model && (
          <div className="card-dark p-4 mb-4 flex items-center gap-3">
            <Icon name="Car" size={20} className="text-primary shrink-0" />
            <div>
              <div className="text-sm font-medium">{info.car_model}</div>
              <div className="label-tag">автомобиль</div>
            </div>
          </div>
        )}

        <div className="text-center">
          <p className="text-xs text-muted-foreground mb-4">
            Покажите эту страницу администратору для получения скидки или оплаты
          </p>
          <button onClick={() => onNavigate("home")} className="btn-ghost text-sm">
            <Icon name="Home" size={14}/>На главную
          </button>
        </div>
      </div>
    </div>
  );
}
