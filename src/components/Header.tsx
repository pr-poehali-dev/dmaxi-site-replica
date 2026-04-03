import { useState } from "react";
import Icon from "@/components/ui/icon";

interface HeaderProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  cartCount: number;
  notifCount: number;
  searchQuery: string;
  onSearchChange: (v: string) => void;
}

const navItems = [
  { id: "home", label: "Главная" },
  { id: "catalog", label: "Каталог" },
  { id: "services", label: "Услуги" },
  { id: "blog", label: "Блог" },
  { id: "about", label: "О компании" },
  { id: "delivery", label: "Доставка" },
  { id: "contacts", label: "Контакты" },
];

export default function Header({ currentPage, onNavigate, cartCount, notifCount, searchQuery, onSearchChange }: HeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-border shadow-sm">
      {/* Top Bar */}
      <div className="bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]">
        <div className="container mx-auto px-4 flex items-center justify-between h-8 text-xs">
          <span className="font-mono text-[10px] tracking-widest opacity-70">КОРПУС — ДЕЛОВЫЕ РЕШЕНИЯ</span>
          <div className="flex items-center gap-4 opacity-80">
            <span>+7 (800) 123-45-67</span>
            <span className="hidden sm:inline">Пн–Пт 9:00–18:00</span>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo */}
          <button
            onClick={() => onNavigate("home")}
            className="flex items-center gap-3 shrink-0 group"
          >
            <div className="w-8 h-8 bg-[hsl(var(--primary))] flex items-center justify-center">
              <span className="text-white font-black text-sm font-mono">К</span>
            </div>
            <div className="hidden sm:block">
              <div className="text-lg font-black tracking-tight leading-none">КОРПУС</div>
              <div className="section-label text-[9px]">Деловой магазин</div>
            </div>
          </button>

          {/* Search Bar */}
          <div className={`flex-1 max-w-xl ${searchOpen ? "flex" : "hidden md:flex"}`}>
            <div className="relative w-full">
              <Icon name="Search" size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Поиск товаров и услуг..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm border border-border bg-background focus:outline-none focus:border-foreground/40 transition-colors"
              />
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              className="md:hidden p-2 text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setSearchOpen(!searchOpen)}
            >
              <Icon name="Search" size={18} />
            </button>

            {/* Notifications */}
            <button
              className="relative p-2 text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => onNavigate("account")}
            >
              <Icon name="Bell" size={18} />
              {notifCount > 0 && <span className="cart-badge">{notifCount}</span>}
            </button>

            {/* Cart */}
            <button
              className="relative p-2 text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => onNavigate("cart")}
            >
              <Icon name="ShoppingCart" size={18} />
              {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
            </button>

            {/* Account */}
            <button
              className="hidden sm:flex items-center gap-2 ml-1 px-3 py-1.5 border border-border text-sm font-medium hover:bg-secondary transition-colors"
              onClick={() => onNavigate("login")}
            >
              <Icon name="User" size={15} />
              <span className="hidden lg:inline">Войти</span>
            </button>

            {/* Mobile Menu */}
            <button
              className="md:hidden p-2 text-muted-foreground hover:text-foreground transition-colors ml-1"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              <Icon name={mobileOpen ? "X" : "Menu"} size={20} />
            </button>
          </div>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-6 border-t border-border h-11">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`nav-link pb-1 ${currentPage === item.id ? "active" : ""}`}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Mobile Nav */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-white animate-slide-down">
          <nav className="container mx-auto px-4 py-3 flex flex-col gap-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => { onNavigate(item.id); setMobileOpen(false); }}
                className={`text-left px-3 py-2.5 text-sm font-medium transition-colors rounded ${
                  currentPage === item.id ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                }`}
              >
                {item.label}
              </button>
            ))}
            <div className="divider-rule my-2" />
            <button
              onClick={() => { onNavigate("login"); setMobileOpen(false); }}
              className="text-left px-3 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              Войти / Регистрация
            </button>
          </nav>
        </div>
      )}
    </header>
  );
}
