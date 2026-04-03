import { useState } from "react";
import Icon from "@/components/ui/icon";

export default function ContactsPage() {
  const [form, setForm] = useState({ name: "", company: "", phone: "", email: "", message: "", type: "question" });
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <div className="animate-fade-in">
      {/* Breadcrumb */}
      <div className="border-b border-border bg-secondary/30">
        <div className="container mx-auto px-4 py-3 flex items-center gap-2 text-xs text-muted-foreground font-mono">
          <span className="hover:text-foreground cursor-pointer">Главная</span>
          <Icon name="ChevronRight" size={12} />
          <span className="text-foreground">Контакты</span>
        </div>
      </div>

      {/* Header */}
      <section className="bg-[hsl(var(--primary))] py-14 text-center">
        <div className="container mx-auto px-4">
          <div className="section-label text-white/40 mb-3">Мы на связи</div>
          <h1 className="text-4xl font-black text-white tracking-tight mb-4">Контакты</h1>
          <p className="text-white/60 max-w-md mx-auto text-sm leading-relaxed">
            Свяжитесь с нами любым удобным способом — ответим в течение 1 часа
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4 py-14">
        <div className="grid lg:grid-cols-3 gap-10">
          {/* Contact Info */}
          <div className="space-y-6">
            <div>
              <div className="section-label mb-4">Реквизиты</div>
              <div className="space-y-4">
                {[
                  { icon: "Phone", label: "Телефон", val: "+7 (800) 123-45-67", sub: "Бесплатно по России" },
                  { icon: "Mail", label: "Email", val: "info@korpus.ru", sub: "Ответим за 1 час" },
                  { icon: "MapPin", label: "Адрес", val: "Москва, ул. Деловая, 15", sub: "БЦ «Премиум», офис 401" },
                  { icon: "Clock", label: "Часы работы", val: "Пн–Пт 9:00–18:00", sub: "Сб–Вс выходной" },
                ].map((item) => (
                  <div key={item.label} className="flex gap-3 p-4 border border-border bg-secondary/20">
                    <Icon name={item.icon as "Phone"} size={18} className="text-[hsl(var(--corp-gold))] shrink-0 mt-0.5" />
                    <div>
                      <div className="section-label mb-0.5">{item.label}</div>
                      <div className="text-sm font-semibold">{item.val}</div>
                      <div className="text-xs text-muted-foreground">{item.sub}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Messengers */}
            <div>
              <div className="section-label mb-3">Мессенджеры</div>
              <div className="flex gap-2">
                {["Telegram", "WhatsApp", "ВКонтакте"].map((m) => (
                  <button key={m} className="flex-1 py-2 border border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors">
                    {m}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="lg:col-span-2">
            <div className="section-label mb-4">Написать нам</div>
            {sent ? (
              <div className="border border-border p-10 text-center">
                <div className="w-14 h-14 bg-secondary flex items-center justify-center mx-auto mb-4">
                  <Icon name="CheckCircle" size={28} className="text-[hsl(var(--corp-gold))]" />
                </div>
                <h3 className="text-xl font-black mb-2">Заявка отправлена!</h3>
                <p className="text-sm text-muted-foreground mb-6">Ваш менеджер свяжется с вами в течение 1 рабочего часа</p>
                <button onClick={() => setSent(false)} className="btn-outline">Отправить ещё</button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Type */}
                <div>
                  <div className="section-label mb-2">Тема обращения</div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { val: "question", label: "Вопрос" },
                      { val: "order", label: "Заказ" },
                      { val: "partnership", label: "Партнёрство" },
                    ].map((t) => (
                      <button
                        key={t.val}
                        type="button"
                        onClick={() => setForm({ ...form, type: t.val })}
                        className={`py-2 text-sm font-medium border transition-colors ${
                          form.type === t.val
                            ? "bg-[hsl(var(--primary))] text-white border-[hsl(var(--primary))]"
                            : "border-border text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="section-label mb-1 block">Ваше имя *</label>
                    <input
                      required
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full border border-border px-4 py-2.5 text-sm bg-background focus:outline-none focus:border-foreground/40 transition-colors"
                      placeholder="Иван Петров"
                    />
                  </div>
                  <div>
                    <label className="section-label mb-1 block">Компания</label>
                    <input
                      type="text"
                      value={form.company}
                      onChange={(e) => setForm({ ...form, company: e.target.value })}
                      className="w-full border border-border px-4 py-2.5 text-sm bg-background focus:outline-none focus:border-foreground/40 transition-colors"
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
                      className="w-full border border-border px-4 py-2.5 text-sm bg-background focus:outline-none focus:border-foreground/40 transition-colors"
                      placeholder="+7 (999) 000-00-00"
                    />
                  </div>
                  <div>
                    <label className="section-label mb-1 block">Email</label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="w-full border border-border px-4 py-2.5 text-sm bg-background focus:outline-none focus:border-foreground/40 transition-colors"
                      placeholder="ivan@company.ru"
                    />
                  </div>
                </div>

                <div>
                  <label className="section-label mb-1 block">Сообщение</label>
                  <textarea
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    rows={4}
                    className="w-full border border-border px-4 py-2.5 text-sm bg-background focus:outline-none focus:border-foreground/40 transition-colors resize-none"
                    placeholder="Опишите ваш запрос..."
                  />
                </div>

                <div className="flex items-start gap-3 pt-1">
                  <div className="w-4 h-4 border border-border flex items-center justify-center mt-0.5 shrink-0 bg-[hsl(var(--primary))]">
                    <Icon name="Check" size={10} className="text-white" />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Нажимая «Отправить», вы соглашаетесь с <span className="underline cursor-pointer">политикой конфиденциальности</span>
                  </p>
                </div>

                <button type="submit" className="btn-primary w-full sm:w-auto">
                  Отправить заявку
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
