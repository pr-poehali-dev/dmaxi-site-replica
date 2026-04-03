import { useState } from "react";
import Icon from "@/components/ui/icon";

interface LoginPageProps {
  onNavigate: (page: string) => void;
}

export default function LoginPage({ onNavigate }: LoginPageProps) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [form, setForm] = useState({ email: "", password: "", name: "", company: "", phone: "", confirmPassword: "" });
  const [done, setDone] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "register") {
      setDone(true);
    } else {
      onNavigate("account");
    }
  };

  return (
    <div className="animate-fade-in min-h-[70vh] bg-secondary/20 flex items-center justify-center py-12">
      <div className="w-full max-w-md px-4">
        {done ? (
          <div className="bg-card border border-border p-10 text-center">
            <div className="w-14 h-14 bg-secondary flex items-center justify-center mx-auto mb-4">
              <Icon name="CheckCircle" size={28} className="text-[hsl(var(--corp-gold))]" />
            </div>
            <h2 className="text-xl font-black mb-2">Регистрация завершена!</h2>
            <p className="text-sm text-muted-foreground mb-6">На вашу почту отправлено письмо с подтверждением</p>
            <button onClick={() => { setDone(false); setMode("login"); }} className="btn-primary">
              Войти в аккаунт
            </button>
          </div>
        ) : (
          <div className="bg-card border border-border">
            {/* Header */}
            <div className="bg-[hsl(var(--primary))] p-6 text-center">
              <div className="w-10 h-10 border border-white/20 flex items-center justify-center mx-auto mb-3">
                <span className="text-white font-black font-mono">К</span>
              </div>
              <h1 className="text-white font-black text-lg tracking-tight">
                {mode === "login" ? "Вход в кабинет" : "Регистрация"}
              </h1>
            </div>

            {/* Toggle */}
            <div className="flex border-b border-border">
              <button
                onClick={() => setMode("login")}
                className={`flex-1 py-3 text-sm font-semibold transition-colors ${
                  mode === "login" ? "bg-background text-foreground border-b-2 border-[hsl(var(--primary))]" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Войти
              </button>
              <button
                onClick={() => setMode("register")}
                className={`flex-1 py-3 text-sm font-semibold transition-colors ${
                  mode === "register" ? "bg-background text-foreground border-b-2 border-[hsl(var(--primary))]" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Регистрация
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {mode === "register" && (
                <>
                  <div>
                    <label className="section-label mb-1 block">Имя и фамилия *</label>
                    <input
                      required
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full border border-border px-4 py-2.5 text-sm bg-background focus:outline-none focus:border-foreground/40"
                      placeholder="Иван Петров"
                    />
                  </div>
                  <div>
                    <label className="section-label mb-1 block">Компания</label>
                    <input
                      type="text"
                      value={form.company}
                      onChange={(e) => setForm({ ...form, company: e.target.value })}
                      className="w-full border border-border px-4 py-2.5 text-sm bg-background focus:outline-none focus:border-foreground/40"
                      placeholder="ООО «Компания»"
                    />
                  </div>
                  <div>
                    <label className="section-label mb-1 block">Телефон *</label>
                    <input
                      required
                      type="tel"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className="w-full border border-border px-4 py-2.5 text-sm bg-background focus:outline-none focus:border-foreground/40"
                      placeholder="+7 (999) 000-00-00"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="section-label mb-1 block">Email *</label>
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full border border-border px-4 py-2.5 text-sm bg-background focus:outline-none focus:border-foreground/40"
                  placeholder="ivan@company.ru"
                />
              </div>

              <div>
                <label className="section-label mb-1 block">Пароль *</label>
                <input
                  required
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full border border-border px-4 py-2.5 text-sm bg-background focus:outline-none focus:border-foreground/40"
                  placeholder="Минимум 8 символов"
                />
              </div>

              {mode === "register" && (
                <div>
                  <label className="section-label mb-1 block">Повторите пароль *</label>
                  <input
                    required
                    type="password"
                    value={form.confirmPassword}
                    onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                    className="w-full border border-border px-4 py-2.5 text-sm bg-background focus:outline-none focus:border-foreground/40"
                    placeholder="Повторите пароль"
                  />
                </div>
              )}

              {mode === "login" && (
                <div className="text-right">
                  <button type="button" className="text-xs text-muted-foreground hover:text-foreground underline">
                    Забыли пароль?
                  </button>
                </div>
              )}

              <button type="submit" className="btn-primary w-full">
                {mode === "login" ? "Войти" : "Создать аккаунт"}
              </button>

              {mode === "register" && (
                <p className="text-xs text-muted-foreground text-center">
                  Регистрируясь, вы соглашаетесь с <span className="underline cursor-pointer">условиями</span>
                </p>
              )}
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
