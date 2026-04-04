import { useState } from "react";
import Icon from "@/components/ui/icon";

const MAILER_URL = "https://functions.poehali.dev/093c15a5-d14e-4c9e-8c01-38296645286f";

// Страница онлайн-записи на ремонт (Booking)
const timeSlots = ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00"];

const serviceOptions = [
  "Диагностика", "Замена масла и фильтров", "Ремонт двигателя",
  "Ремонт ходовой части", "Шиномонтаж", "Кузовной ремонт",
  "Электрика", "ТО по регламенту", "Другое",
];

const locations = [
  "СТО на ул. Верхоленская",
];

interface BookingPageProps {
  onNavigate: (p: string) => void;
}

export default function CartPage({ onNavigate }: BookingPageProps) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    service: "", car: "", name: "", phone: "", date: "", time: "", location: locations[0], comment: "",
  });
  const [done, setDone] = useState(false);
  const [sending, setSending] = useState(false);

  const handleNext = async () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      setSending(true);
      try {
        await fetch(`${MAILER_URL}?action=notify_admin`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            subject: `Запись на ремонт — ${form.name} (${form.phone})`,
            rows: [
              { label: "Клиент", value: form.name },
              { label: "Телефон", value: form.phone },
              { label: "Услуга", value: form.service },
              { label: "Автомобиль", value: form.car },
              { label: "Дата и время", value: `${form.date} в ${form.time}` },
              { label: "СТО", value: form.location },
              { label: "Комментарий", value: form.comment || "—" },
            ],
          }),
        });
      } catch {
        // не блокируем UI при ошибке сети
      } finally {
        setSending(false);
        setDone(true);
      }
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="border-b border-border">
        <div className="container mx-auto py-3 flex items-center gap-2 text-xs text-muted-foreground">
          <button onClick={() => onNavigate("home")} className="hover:text-foreground transition-colors font-display uppercase tracking-wide">Главная</button>
          <Icon name="ChevronRight" size={12} />
          <span className="text-foreground font-display uppercase tracking-wide">Запись на ремонт</span>
        </div>
      </div>

      <div className="bg-card border-b border-border py-12">
        <div className="container mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <div className="red-line" />
            <span className="label-tag">Онлайн-запись</span>
          </div>
          <h1 className="font-display font-bold text-4xl lg:text-5xl uppercase mb-3">Запись на ремонт</h1>
          <p className="text-muted-foreground text-sm">Заполните форму — мы перезвоним в течение 15 минут</p>
        </div>
      </div>

      <div className="container mx-auto section-py">
        {done ? (
          <div className="max-w-lg mx-auto text-center">
            <div className="card-dark p-12">
              <div className="w-16 h-16 bg-primary/10 border border-primary/30 flex items-center justify-center mx-auto mb-6">
                <Icon name="CheckCircle" size={36} className="text-primary" />
              </div>
              <h2 className="font-display font-bold text-2xl uppercase mb-3">Заявка принята!</h2>
              <p className="text-muted-foreground text-sm leading-relaxed mb-8">
                Наш менеджер свяжется с вами по номеру <strong>{form.phone}</strong> в течение 15 минут для подтверждения записи.
              </p>
              <div className="card-dark p-4 mb-8 text-left space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Услуга:</span>
                  <span className="font-semibold">{form.service || "—"}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Дата и время:</span>
                  <span className="font-semibold">{form.date} в {form.time}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">СТО:</span>
                  <span className="font-semibold">{form.location}</span>
                </div>
              </div>
              <button onClick={() => onNavigate("home")} className="btn-red w-full justify-center">
                На главную
              </button>
            </div>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto">
            {/* Steps */}
            <div className="flex items-center gap-0 mb-10">
              {[
                { n: 1, label: "Услуга и авто" },
                { n: 2, label: "Дата и время" },
                { n: 3, label: "Контакты" },
              ].map((s, i) => (
                <div key={s.n} className="flex items-center flex-1">
                  <div className="flex flex-col items-center gap-1.5">
                    <div className={`w-8 h-8 flex items-center justify-center font-display font-bold text-sm transition-colors ${
                      step >= s.n ? "bg-primary text-white" : "border border-border text-muted-foreground"
                    }`}>
                      {step > s.n ? <Icon name="Check" size={14} /> : s.n}
                    </div>
                    <span className={`label-tag text-center ${step >= s.n ? "text-foreground" : ""}`}>{s.label}</span>
                  </div>
                  {i < 2 && <div className={`flex-1 h-px mx-3 mb-5 ${step > s.n ? "bg-primary" : "bg-border"}`} />}
                </div>
              ))}
            </div>

            <div className="card-dark p-8">
              {/* Step 1 */}
              {step === 1 && (
                <div className="space-y-5">
                  <h2 className="font-display font-bold text-xl uppercase mb-6">Выберите услугу</h2>
                  <div>
                    <label className="label-tag mb-2 block">Вид работ *</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {serviceOptions.map((s) => (
                        <button
                          key={s}
                          onClick={() => setForm({ ...form, service: s })}
                          className={`px-3 py-2.5 text-xs text-left font-display tracking-wide uppercase border transition-colors ${
                            form.service === s
                              ? "bg-primary border-primary text-white"
                              : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="label-tag mb-2 block">Марка и модель автомобиля *</label>
                    <input
                      type="text"
                      value={form.car}
                      onChange={(e) => setForm({ ...form, car: e.target.value })}
                      className="input-dark"
                      placeholder="Например: Toyota Camry 2019"
                    />
                  </div>
                  <div>
                    <label className="label-tag mb-2 block">Комментарий (необязательно)</label>
                    <textarea
                      value={form.comment}
                      onChange={(e) => setForm({ ...form, comment: e.target.value })}
                      rows={3}
                      className="input-dark resize-none"
                      placeholder="Опишите проблему подробнее..."
                    />
                  </div>
                </div>
              )}

              {/* Step 2 */}
              {step === 2 && (
                <div className="space-y-5">
                  <h2 className="font-display font-bold text-xl uppercase mb-6">Выберите дату и время</h2>
                  <div>
                    <label className="label-tag mb-2 block">СТО</label>
                    <select
                      value={form.location}
                      onChange={(e) => setForm({ ...form, location: e.target.value })}
                      className="input-dark"
                    >
                      {locations.map((l) => <option key={l}>{l}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label-tag mb-2 block">Дата *</label>
                    <input
                      type="date"
                      value={form.date}
                      onChange={(e) => setForm({ ...form, date: e.target.value })}
                      className="input-dark"
                      min={new Date().toISOString().split("T")[0]}
                    />
                  </div>
                  <div>
                    <label className="label-tag mb-2 block">Время *</label>
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                      {timeSlots.map((t) => (
                        <button
                          key={t}
                          onClick={() => setForm({ ...form, time: t })}
                          className={`py-2.5 text-xs font-display tracking-wide border transition-colors ${
                            form.time === t
                              ? "bg-primary border-primary text-white"
                              : "border-border text-muted-foreground hover:border-primary/50"
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3 */}
              {step === 3 && (
                <div className="space-y-5">
                  <h2 className="font-display font-bold text-xl uppercase mb-6">Ваши контакты</h2>
                  <div>
                    <label className="label-tag mb-2 block">Имя *</label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="input-dark"
                      placeholder="Как к вам обращаться"
                    />
                  </div>
                  <div>
                    <label className="label-tag mb-2 block">Телефон *</label>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className="input-dark"
                      placeholder="+7 (999) 000-00-00"
                    />
                  </div>
                  <div className="card-dark p-4 space-y-2">
                    <div className="label-tag mb-3">Ваша запись</div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Услуга:</span>
                      <span>{form.service}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Автомобиль:</span>
                      <span>{form.car}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Дата:</span>
                      <span>{form.date} в {form.time}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">СТО:</span>
                      <span>{form.location}</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Нажимая «Записаться», вы соглашаетесь с <span className="underline cursor-pointer">политикой конфиденциальности</span>
                  </p>
                </div>
              )}

              {/* Navigation */}
              <div className="flex justify-between mt-8 pt-6 border-t border-border">
                {step > 1 ? (
                  <button onClick={() => setStep(step - 1)} className="btn-ghost text-sm py-2.5 px-5">
                    ← Назад
                  </button>
                ) : (
                  <div />
                )}
                <button onClick={handleNext} disabled={sending} className="btn-red disabled:opacity-60 flex items-center gap-2">
                  {sending ? <><Icon name="Loader2" size={14} className="animate-spin" />Отправляю...</> : step === 3 ? "Записаться" : "Далее →"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}