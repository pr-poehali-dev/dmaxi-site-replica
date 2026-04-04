import { useState } from "react";
import Icon from "@/components/ui/icon";
import { useSiteSettings } from "@/context/SiteSettingsContext";

interface ContactsPageProps {
  onNavigate: (p: string) => void;
}

export default function ContactsPage({ onNavigate }: ContactsPageProps) {
  const { s } = useSiteSettings();
  const [form, setForm] = useState({ name: "", phone: "", message: "" });
  const [sent, setSent] = useState(false);
  const [activeLocation, setActiveLocation] = useState(0);

  const locations = [
    {
      name:    s("contacts", "location1_name",  "СТО на ул. Верхоленская"),
      address: s("contacts", "location1_addr",  "г. Иркутск, ул. Верхоленская, д. 2"),
      phone:   s("contacts", "location1_phone", "+7 (3952) 00-00-00"),
      hours:   s("contacts", "location1_hours", "Пн–Сб 9:00–21:00"),
      isMain:  true,
    },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <div className="animate-fade-in">
      <div className="border-b border-border">
        <div className="container mx-auto py-3 flex items-center gap-2 text-xs text-muted-foreground">
          <button onClick={() => onNavigate("home")} className="hover:text-foreground transition-colors font-display uppercase tracking-wide">Главная</button>
          <Icon name="ChevronRight" size={12} />
          <span className="text-foreground font-display uppercase tracking-wide">Контакты</span>
        </div>
      </div>

      <div className="bg-card border-b border-border py-12">
        <div className="container mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <div className="red-line" />
            <span className="label-tag">Мы на связи</span>
          </div>
          <h1 className="font-display font-bold text-4xl lg:text-5xl uppercase mb-3">
            {s("contacts", "title", "Контакты")}
          </h1>
          <p className="text-muted-foreground text-sm">
            {s("contacts", "subtitle", "Звоните или приезжайте — будем рады помочь")}
          </p>
        </div>
      </div>

      <div className="container mx-auto section-py">
        <div className="grid lg:grid-cols-3 gap-10">
          {/* Contact info */}
          <div className="lg:col-span-1 space-y-5">
            <div>
              <div className="label-tag mb-4">Наши адреса</div>
              <div className="space-y-3">
                {locations.map((loc, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveLocation(i)}
                    className={`w-full text-left card-dark p-5 transition-all ${activeLocation === i ? "border-primary" : ""}`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="font-display font-bold text-sm uppercase tracking-wide">{loc.name}</div>
                      {loc.isMain && (
                        <span className="bg-primary text-white text-[9px] font-display font-bold tracking-widest uppercase px-2 py-0.5 shrink-0">Основная</span>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-start gap-2 text-xs text-muted-foreground">
                        <Icon name="MapPin" size={12} className="shrink-0 mt-0.5 text-primary" />
                        {loc.address}
                      </div>
                      <div className="flex items-start gap-2 text-xs text-muted-foreground">
                        <Icon name="Phone" size={12} className="shrink-0 mt-0.5 text-primary" />
                        {loc.phone}
                      </div>
                      <div className="flex items-start gap-2 text-xs text-muted-foreground">
                        <Icon name="Clock" size={12} className="shrink-0 mt-0.5 text-primary" />
                        {loc.hours}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Messengers */}
            <div>
              <div className="label-tag mb-4">Мессенджеры</div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { name: "Telegram", icon: "MessageCircle" },
                  { name: "WhatsApp", icon: "Phone" },
                  { name: "ВКонтакте", icon: "Users" },
                ].map((m) => (
                  <button key={m.name} className="card-dark p-3 flex flex-col items-center gap-1.5 hover:border-primary/50 transition-colors">
                    <Icon name={m.icon as "MessageCircle"} size={18} className="text-primary" />
                    <span className="text-[10px] text-muted-foreground">{m.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Quick actions */}
            <div className="space-y-2">
              <button onClick={() => onNavigate("booking")} className="btn-red w-full justify-center">
                <Icon name="CalendarCheck" size={16} />
                Записаться на ремонт
              </button>
              <a href={`tel:${s("contacts","location1_phone","+73952000000").replace(/[^+\d]/g,"")}`} className="btn-ghost w-full justify-center">
                <Icon name="Phone" size={16} />
                Позвонить
              </a>
            </div>
          </div>

          {/* Map placeholder + Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Map placeholder */}
            <div className="aspect-[16/9] bg-secondary border border-border flex items-center justify-center relative overflow-hidden">
              <div className="stripe-bg absolute inset-0 opacity-50" />
              <div className="relative text-center">
                <Icon name="MapPin" size={36} className="text-primary mx-auto mb-3" />
                <div className="font-display font-bold text-sm uppercase tracking-wide mb-1">
                  {locations[activeLocation].address}
                </div>
                <div className="text-xs text-muted-foreground">{locations[activeLocation].hours}</div>
                <a
                  href={`https://yandex.ru/maps/?text=${encodeURIComponent(locations[activeLocation].address)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 mt-4 text-xs text-primary font-display font-semibold uppercase tracking-wide hover:underline"
                >
                  Открыть в Яндекс Картах →
                </a>
              </div>
            </div>

            {/* Contact form */}
            {sent ? (
              <div className="card-dark p-8 text-center">
                <div className="w-12 h-12 bg-primary/10 border border-primary/30 flex items-center justify-center mx-auto mb-4">
                  <Icon name="CheckCircle" size={26} className="text-primary" />
                </div>
                <h3 className="font-display font-bold text-lg uppercase mb-2">Сообщение отправлено!</h3>
                <p className="text-sm text-muted-foreground mb-5">Мы свяжемся с вами в течение 1 часа</p>
                <button onClick={() => setSent(false)} className="btn-ghost text-sm py-2.5 px-6">Отправить ещё</button>
              </div>
            ) : (
              <div className="card-dark p-6">
                <div className="label-tag mb-5">Написать нам</div>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
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
                      <label className="label-tag mb-1.5 block">Телефон *</label>
                      <input
                        required
                        type="tel"
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        className="input-dark"
                        placeholder="+7 (999) 000-00-00"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="label-tag mb-1.5 block">Сообщение</label>
                    <textarea
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      rows={4}
                      className="input-dark resize-none"
                      placeholder="Ваш вопрос или сообщение..."
                    />
                  </div>
                  <button type="submit" className="btn-red">
                    Отправить сообщение
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Regions */}
      <section className="bg-card border-t border-border py-12">
        <div className="container mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <div className="red-line" />
            <h2 className="font-display font-bold text-2xl uppercase">Регионы присутствия</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {["Иркутск", "Ангарск", "Братск", "Усть-Илимск", "Шелехов"].map((city) => (
              <div key={city} className="card-dark p-4 text-center">
                <Icon name="MapPin" size={16} className="text-primary mx-auto mb-2" />
                <div className="font-display font-bold text-xs uppercase tracking-wide">{city}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}