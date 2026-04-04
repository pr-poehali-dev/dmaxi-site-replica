import { useState } from "react";
import Icon from "@/components/ui/icon";
import { useAuth } from "@/context/AuthContext";
import { useSiteSettings } from "@/context/SiteSettingsContext";

interface HeaderProps {
  currentPage: string;
  onNavigate: (p: string) => void;
}

export default function Header({ currentPage, onNavigate }: HeaderProps) {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const { s } = useSiteSettings();

  const nav = [
    { id: "home",      label: s("header","nav_home","Главная") },
    { id: "services",  label: s("header","nav_services","Услуги") },
    { id: "prices",    label: s("header","nav_prices","Стоимость") },
    { id: "booking",   label: s("header","nav_booking","Запись") },
    { id: "shop",      label: s("header","nav_shop","Магазин") },
    { id: "club",      label: s("header","nav_club","Клуб DD") },
    { id: "portfolio", label: s("header","nav_portfolio","Портфолио") },
    { id: "contacts",  label: s("header","nav_contacts","Контакты") },
  ];

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
      <div className="container mx-auto flex items-center gap-3 sm:gap-6 py-3 sm:py-0 sm:h-16">
        {/* Logo */}
        <button onClick={() => onNavigate("home")} className="flex items-center gap-2 sm:gap-3 shrink-0">
          {s("general", "logo_url") ? (
            <img src={s("general","logo_url")} alt={s("general","company_name","DD MAXI")} className="h-8 sm:h-10 w-auto object-contain" />
          ) : (
            <div className="relative">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary flex items-center justify-center">
                <span className="text-white font-display font-black text-base sm:text-lg leading-none">DD</span>
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 sm:w-2.5 sm:h-2.5 bg-background border border-primary" />
            </div>
          )}
          <div>
            <div className="font-display font-bold text-base sm:text-xl text-foreground tracking-widest leading-tight">
              {s("general","company_name","DD MAXI").replace("DD ","")}
            </div>
            <div className="label-tag text-[8px] sm:text-[9px]">{s("general","tagline","автосервис")}</div>
          </div>
        </button>

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-2 xl:gap-5 flex-1 overflow-hidden">
          {nav.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`nav-item text-[11px] xl:text-xs whitespace-nowrap ${currentPage === item.id ? "active" : ""}`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* CTA */}
        <div className="ml-auto flex items-center gap-2 sm:gap-3 shrink-0">
          <button onClick={() => onNavigate("booking")} className="btn-red hidden sm:flex text-[11px] xl:text-xs py-2 xl:py-2.5 px-3 xl:px-5 whitespace-nowrap">
            {s("header","btn_book","Записаться")}
          </button>
          {user ? (
            <button
              onClick={() => onNavigate(user.role === "admin" ? "admin" : "account")}
              className="btn-ghost hidden md:flex text-[11px] xl:text-xs py-2 xl:py-2.5 px-3 xl:px-4 items-center gap-1.5 whitespace-nowrap"
            >
              <div className="w-5 h-5 bg-primary flex items-center justify-center text-white text-[9px] font-display font-black shrink-0">
                {user.name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)}
              </div>
              {user.role === "admin" ? s("header","btn_admin","Админ") : s("header","btn_cabinet","Кабинет")}
            </button>
          ) : (
            <button onClick={() => onNavigate("login")} className="btn-ghost hidden md:flex text-[11px] xl:text-xs py-2 xl:py-2.5 px-3 xl:px-5 items-center gap-1.5 whitespace-nowrap">
              <Icon name="User" size={13} />
              <span className="hidden xl:inline">{s("header","btn_login","Войти / Регистрация")}</span>
              <span className="xl:hidden">{s("header","btn_login_short","Войти")}</span>
            </button>
          )}
          <button
            className="lg:hidden p-1.5 sm:p-2 text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => setOpen(!open)}
          >
            <Icon name={open ? "X" : "Menu"} size={20} />
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      {open && (
        <div className="lg:hidden border-t border-border bg-card animate-slide-down">
          <nav className="container mx-auto py-3 flex flex-col gap-0.5">
            {nav.map((item) => (
              <button
                key={item.id}
                onClick={() => { onNavigate(item.id); setOpen(false); }}
                className={`text-left px-3 py-2.5 font-display text-xs tracking-widest uppercase transition-colors rounded ${
                  currentPage === item.id ? "text-primary bg-primary/5" : "text-muted-foreground hover:text-foreground hover:bg-secondary/30"
                }`}
              >
                {item.label}
              </button>
            ))}
            <div className="flex gap-2 mt-3 px-3">
              {user ? (
                <button
                  onClick={() => { onNavigate(user.role === "admin" ? "admin" : "account"); setOpen(false); }}
                  className="btn-ghost flex-1 justify-center flex items-center gap-2 text-xs py-2.5"
                >
                  <Icon name="User" size={14} />
                  {user.role === "admin" ? s("header","btn_admin","Админ") : s("header","btn_cabinet","Кабинет")}
                </button>
              ) : (
                <button
                  onClick={() => { onNavigate("login"); setOpen(false); }}
                  className="btn-ghost flex-1 justify-center text-xs py-2.5"
                >
                  {s("header","btn_login","Войти / Регистрация")}
                </button>
              )}
              <button
                onClick={() => { onNavigate("booking"); setOpen(false); }}
                className="btn-red flex-1 justify-center text-xs py-2.5"
              >
                {s("header","btn_book_mobile","Записаться на ремонт")}
              </button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}