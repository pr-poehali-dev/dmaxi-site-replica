import { useState } from "react";
import Icon from "@/components/ui/icon";
import { useAuth } from "@/context/AuthContext";
import { useSiteSettings } from "@/context/SiteSettingsContext";

const NAV = [
  { id: "home",      label: "Главная" },
  { id: "services",  label: "Услуги" },
  { id: "prices",    label: "Стоимость" },
  { id: "booking",   label: "Запись" },
  { id: "shop",      label: "Магазин" },
  { id: "club",      label: "Клуб DD" },
  { id: "portfolio", label: "Портфолио" },
  { id: "contacts",  label: "Контакты" },
];

interface HeaderProps {
  currentPage: string;
  onNavigate: (p: string) => void;
}

export default function Header({ currentPage, onNavigate }: HeaderProps) {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const { s } = useSiteSettings();

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
      {/* Top bar */}
      <div className="bg-primary">
        <div className="container mx-auto flex items-center h-8 gap-6">
          <span className="text-white/70 font-display tracking-widest text-[10px] hidden sm:block">
            {s("general", "slogan", "DD MAXI — СЕТЬ АВТОСЕРВИСОВ")}
          </span>
          <div className="flex items-center gap-5 ml-auto">
            <a href={`tel:${s("general","phone","+73952000000").replace(/[^+\d]/g,"")}`} className="flex items-center gap-1.5 text-white font-display font-semibold tracking-wide hover:text-white/80 transition-colors text-[11px]">
              <Icon name="Phone" size={11} />
              {s("general", "phone", "+7 (3952) 00-00-00")}
            </a>
            <span className="text-white/50 text-[10px] hidden md:block">{s("general", "hours", "Пн–Сб 9:00–21:00")}</span>
          </div>
        </div>
      </div>

      {/* Main header */}
      <div className="container mx-auto flex items-center gap-6 h-16">
        {/* Logo */}
        <button onClick={() => onNavigate("home")} className="flex items-center gap-3 shrink-0">
          {s("general", "logo_url") ? (
            <img src={s("general","logo_url")} alt={s("general","company_name","DD MAXI")} className="h-10 w-auto object-contain" />
          ) : (
            <div className="relative">
              <div className="w-10 h-10 bg-primary flex items-center justify-center">
                <span className="text-white font-display font-black text-lg leading-none">DD</span>
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-background border border-primary" />
            </div>
          )}
          <div>
            <div className="font-display font-bold text-xl text-foreground tracking-widest leading-tight">{s("general","company_name","DD MAXI").replace("DD ","")}</div>
            <div className="label-tag text-[9px]">{s("general","tagline","автосервис")}</div>
          </div>
        </button>

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-5 flex-1">
          {NAV.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`nav-item ${currentPage === item.id ? "active" : ""}`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* CTA */}
        <div className="ml-auto flex items-center gap-3">
          <button onClick={() => onNavigate("booking")} className="btn-red hidden sm:flex text-xs py-2.5 px-5">
            Записаться
          </button>
          {user ? (
            <button
              onClick={() => onNavigate(user.role === "admin" ? "admin" : "account")}
              className="btn-ghost hidden md:flex text-xs py-2.5 px-4 items-center gap-2"
            >
              <div className="w-5 h-5 bg-primary flex items-center justify-center text-white text-[9px] font-display font-black">
                {user.name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)}
              </div>
              {user.role === "admin" ? "Админ" : "Кабинет"}
            </button>
          ) : (
            <button onClick={() => onNavigate("login")} className="btn-ghost hidden md:flex text-xs py-2.5 px-5 items-center gap-1.5">
              <Icon name="User" size={13} />
              Войти / Регистрация
            </button>
          )}
          <button
            className="lg:hidden p-2 text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => setOpen(!open)}
          >
            <Icon name={open ? "X" : "Menu"} size={22} />
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      {open && (
        <div className="lg:hidden border-t border-border bg-card animate-slide-down">
          <nav className="container mx-auto py-4 flex flex-col gap-1">
            {NAV.map((item) => (
              <button
                key={item.id}
                onClick={() => { onNavigate(item.id); setOpen(false); }}
                className={`text-left px-3 py-3 font-display text-sm tracking-widest uppercase transition-colors ${
                  currentPage === item.id ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {item.label}
              </button>
            ))}
            {user ? (
              <button
                onClick={() => { onNavigate(user.role === "admin" ? "admin" : "account"); setOpen(false); }}
                className="btn-ghost mt-2 mx-3 justify-center flex items-center gap-2"
              >
                <Icon name="User" size={14} />
                {user.role === "admin" ? "Панель администратора" : "Личный кабинет"}
              </button>
            ) : (
              <button
                onClick={() => { onNavigate("login"); setOpen(false); }}
                className="btn-ghost mt-2 mx-3 justify-center"
              >
                Войти / Регистрация
              </button>
            )}
            <button
              onClick={() => { onNavigate("booking"); setOpen(false); }}
              className="btn-red mt-2 mx-3 justify-center"
            >
              Записаться на ремонт
            </button>
          </nav>
        </div>
      )}
    </header>
  );
}