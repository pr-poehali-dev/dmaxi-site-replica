import { useState } from "react";
import Icon from "@/components/ui/icon";

// Личный кабинет / Вход
interface LoginPageProps {
  onNavigate: (p: string) => void;
}

export default function LoginPage({ onNavigate }: LoginPageProps) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [form, setForm] = useState({ phone: "", password: "", name: "", car: "", confirm: "" });
  const [done, setDone] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "register") setDone(true);
    else onNavigate("account");
  };

  return (
    <div className="animate-fade-in min-h-[70vh] flex items-center justify-center py-12">
      <div className="w-full max-w-md px-4">
        {done ? (
          <div className="card-dark p-10 text-center">
            <div className="w-14 h-14 bg-primary/10 border border-primary/30 flex items-center justify-center mx-auto mb-5">
              <Icon name="CheckCircle" size={30} className="text-primary" />
            </div>
            <h2 className="font-display font-bold text-xl uppercase mb-3">Карта оформлена!</h2>
            <p className="text-sm text-muted-foreground mb-7">
              Ваша клубная карта DD MAXI создана. Скидки и бонусы активны с первого посещения.
            </p>
            <button onClick={() => { setDone(false); setMode("login"); }} className="btn-red w-full justify-center">
              Войти в кабинет
            </button>
          </div>
        ) : (
          <div className="card-dark overflow-hidden">
            {/* Header */}
            <div className="bg-primary relative overflow-hidden px-8 py-8 text-center">
              <div className="absolute inset-0 stripe-bg opacity-30" />
              <div className="relative">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-white/10 border border-white/20 flex items-center justify-center">
                    <span className="text-white font-display font-black text-sm">DD</span>
                  </div>
                  <span className="text-white font-display font-bold text-lg tracking-widest">MAXI</span>
                </div>
                <div className="text-white/70 text-xs tracking-widest font-display uppercase">
                  {mode === "login" ? "Личный кабинет" : "Получить клубную карту"}
                </div>
              </div>
            </div>

            {/* Toggle */}
            <div className="grid grid-cols-2 border-b border-border">
              <button
                onClick={() => setMode("login")}
                className={`py-3.5 font-display text-xs tracking-widest uppercase transition-colors ${
                  mode === "login" ? "text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Войти
              </button>
              <button
                onClick={() => setMode("register")}
                className={`py-3.5 font-display text-xs tracking-widest uppercase transition-colors ${
                  mode === "register" ? "text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Получить карту
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-4">
              {mode === "register" && (
                <>
                  <div>
                    <label className="label-tag mb-1.5 block">Ваше имя *</label>
                    <input required type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-dark" placeholder="Иван Петров" />
                  </div>
                  <div>
                    <label className="label-tag mb-1.5 block">Ваш автомобиль</label>
                    <input type="text" value={form.car} onChange={(e) => setForm({ ...form, car: e.target.value })} className="input-dark" placeholder="Toyota Camry 2020" />
                  </div>
                </>
              )}

              <div>
                <label className="label-tag mb-1.5 block">Номер телефона *</label>
                <input required type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="input-dark" placeholder="+7 (999) 000-00-00" />
              </div>

              <div>
                <label className="label-tag mb-1.5 block">Пароль *</label>
                <input required type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="input-dark" placeholder="Минимум 6 символов" />
              </div>

              {mode === "register" && (
                <div>
                  <label className="label-tag mb-1.5 block">Повторите пароль *</label>
                  <input required type="password" value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} className="input-dark" placeholder="Повторите пароль" />
                </div>
              )}

              {mode === "login" && (
                <div className="text-right">
                  <button type="button" className="text-xs text-muted-foreground hover:text-primary transition-colors">Забыли пароль?</button>
                </div>
              )}

              <button type="submit" className="btn-red w-full justify-center mt-2">
                {mode === "login" ? "Войти" : "Оформить клубную карту"}
              </button>

              {mode === "register" && (
                <p className="text-xs text-muted-foreground text-center">
                  Регистрируясь, вы соглашаетесь с <span className="underline cursor-pointer">условиями клуба</span>
                </p>
              )}
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
