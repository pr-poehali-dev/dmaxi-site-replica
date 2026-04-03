import { useState } from "react";
import Icon from "@/components/ui/icon";
import { useAuth } from "@/context/AuthContext";

interface LoginPageProps {
  onNavigate: (p: string) => void;
}

export default function LoginPage({ onNavigate }: LoginPageProps) {
  const { login, register, user } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [form, setForm] = useState({
    phone: "", password: "", confirm: "",
    name: "", full_name_sts: "",
    car_model: "", car_plate: "", car_year: "", car_vin: "", car_sts: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  if (user) {
    return (
      <div className="animate-fade-in min-h-[70vh] flex items-center justify-center py-12">
        <div className="card-dark p-10 text-center max-w-sm w-full mx-4">
          <div className="w-14 h-14 bg-primary/10 border border-primary/30 flex items-center justify-center mx-auto mb-5">
            <Icon name="CheckCircle" size={30} className="text-primary" />
          </div>
          <h2 className="font-display font-bold text-xl uppercase mb-2">Вы уже вошли</h2>
          <p className="text-sm text-muted-foreground mb-6">Привет, {user.name}!</p>
          <div className="flex gap-3">
            <button onClick={() => onNavigate("account")} className="btn-red flex-1 justify-center">
              Мой кабинет
            </button>
            {user.role === "admin" && (
              <button onClick={() => onNavigate("admin")} className="btn-ghost flex-1 justify-center">
                Админ
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (mode === "register" && form.password !== form.confirm) {
      setError("Пароли не совпадают");
      return;
    }
    if (mode === "register" && form.password.length < 6) {
      setError("Пароль минимум 6 символов");
      return;
    }
    setLoading(true);
    try {
      if (mode === "login") {
        await login(form.phone, form.password);
        onNavigate("account");
      } else {
        await register({
          name: form.name,
          phone: form.phone,
          password: form.password,
          car_model: form.car_model,
          full_name_sts: form.full_name_sts,
          car_plate: form.car_plate,
          car_year: form.car_year,
          car_vin: form.car_vin,
          car_sts: form.car_sts,
        });
        setDone(true);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Ошибка. Попробуйте снова");
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="animate-fade-in min-h-[70vh] flex items-center justify-center py-12">
        <div className="card-dark p-10 text-center max-w-sm w-full mx-4">
          <div className="w-14 h-14 bg-primary/10 border border-primary/30 flex items-center justify-center mx-auto mb-5">
            <Icon name="CheckCircle" size={30} className="text-primary" />
          </div>
          <h2 className="font-display font-bold text-xl uppercase mb-3">Добро пожаловать!</h2>
          <p className="text-sm text-muted-foreground mb-7">
            Ваша клубная карта DD MAXI создана. Скидки и бонусы активны с первого посещения.
          </p>
          <button onClick={() => onNavigate("account")} className="btn-red w-full justify-center">
            Перейти в личный кабинет
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in min-h-[70vh] flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        <div className="card-dark overflow-hidden">
          {/* Header with logo */}
          <div className="bg-primary relative overflow-hidden px-8 py-8 text-center">
            <div className="absolute inset-0 stripe-bg opacity-30" />
            <div className="relative flex flex-col items-center gap-4">
              <img
                src="https://cdn.poehali.dev/files/6b9ce420-e913-421d-9994-f0c56fba7ca1.png"
                alt="DDMaxi StroyRemService"
                className="w-24 h-24 object-contain rounded-md bg-white p-1"
              />
              <div className="text-white/80 text-xs tracking-widest font-display uppercase">
                {mode === "login" ? "Личный кабинет" : "Регистрация в клубе"}
              </div>
            </div>
          </div>

          {/* Toggle */}
          <div className="grid grid-cols-2 border-b border-border">
            <button
              onClick={() => { setMode("login"); setError(""); }}
              className={`py-3.5 font-display text-xs tracking-widest uppercase transition-colors ${
                mode === "login" ? "text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Войти
            </button>
            <button
              onClick={() => { setMode("register"); setError(""); }}
              className={`py-3.5 font-display text-xs tracking-widest uppercase transition-colors ${
                mode === "register" ? "text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Регистрация
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-4">
            {mode === "register" && (
              <>
                <div>
                  <label className="label-tag mb-1.5 block">Имя *</label>
                  <input
                    required
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="input-dark"
                    placeholder="Иван"
                  />
                </div>
                <div>
                  <label className="label-tag mb-1.5 block">ФИО по СТС *</label>
                  <input
                    required
                    type="text"
                    value={form.full_name_sts}
                    onChange={(e) => setForm({ ...form, full_name_sts: e.target.value })}
                    className="input-dark"
                    placeholder="Петров Иван Сергеевич"
                  />
                </div>
                <div>
                  <label className="label-tag mb-1.5 block">Ваш автомобиль *</label>
                  <input
                    required
                    type="text"
                    value={form.car_model}
                    onChange={(e) => setForm({ ...form, car_model: e.target.value })}
                    className="input-dark"
                    placeholder="Toyota Camry"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label-tag mb-1.5 block">Гос. номер *</label>
                    <input
                      required
                      type="text"
                      value={form.car_plate}
                      onChange={(e) => setForm({ ...form, car_plate: e.target.value.toUpperCase() })}
                      className="input-dark"
                      placeholder="А123БВ777"
                    />
                  </div>
                  <div>
                    <label className="label-tag mb-1.5 block">Год выпуска *</label>
                    <input
                      required
                      type="text"
                      value={form.car_year}
                      onChange={(e) => setForm({ ...form, car_year: e.target.value })}
                      className="input-dark"
                      placeholder="2020"
                      maxLength={4}
                    />
                  </div>
                </div>
                <div>
                  <label className="label-tag mb-1.5 block">VIN № *</label>
                  <input
                    required
                    type="text"
                    value={form.car_vin}
                    onChange={(e) => setForm({ ...form, car_vin: e.target.value.toUpperCase() })}
                    className="input-dark"
                    placeholder="XTA210990Y2765382"
                    maxLength={17}
                  />
                </div>
                <div>
                  <label className="label-tag mb-1.5 block">№ СТС *</label>
                  <input
                    required
                    type="text"
                    value={form.car_sts}
                    onChange={(e) => setForm({ ...form, car_sts: e.target.value })}
                    className="input-dark"
                    placeholder="77 АА 123456"
                  />
                </div>
              </>
            )}

            <div>
              <label className="label-tag mb-1.5 block">Номер телефона *</label>
              <input
                required
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="input-dark"
                placeholder="+7 (999) 000-00-00"
              />
            </div>

            <div>
              <label className="label-tag mb-1.5 block">Пароль *</label>
              <input
                required
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="input-dark"
                placeholder="Минимум 6 символов"
              />
            </div>

            {mode === "register" && (
              <div>
                <label className="label-tag mb-1.5 block">Повторите пароль *</label>
                <input
                  required
                  type="password"
                  value={form.confirm}
                  onChange={(e) => setForm({ ...form, confirm: e.target.value })}
                  className="input-dark"
                  placeholder="Повторите пароль"
                />
              </div>
            )}

            {mode === "login" && (
              <div className="text-right">
                <button type="button" className="text-xs text-muted-foreground hover:text-primary transition-colors">
                  Забыли пароль?
                </button>
              </div>
            )}

            {error && (
              <div className="bg-destructive/10 border border-destructive/30 text-destructive text-xs px-3 py-2 rounded">
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-red w-full justify-center mt-2 disabled:opacity-60">
              {loading ? (
                <span className="flex items-center gap-2">
                  <Icon name="Loader2" size={15} className="animate-spin" />
                  {mode === "login" ? "Входим..." : "Регистрируем..."}
                </span>
              ) : (
                mode === "login" ? "Войти" : "Зарегистрироваться"
              )}
            </button>

            {mode === "register" && (
              <p className="text-xs text-muted-foreground text-center">
                Регистрируясь, вы соглашаетесь с{" "}
                <span className="underline cursor-pointer hover:text-primary transition-colors">
                  условиями клуба
                </span>
              </p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}