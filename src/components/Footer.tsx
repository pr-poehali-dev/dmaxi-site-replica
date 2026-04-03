import Icon from "@/components/ui/icon";

interface FooterProps {
  onNavigate: (page: string) => void;
}

export default function Footer({ onNavigate }: FooterProps) {
  return (
    <footer className="bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] mt-auto">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-white/10 border border-white/20 flex items-center justify-center">
                <span className="text-white font-black text-sm font-mono">К</span>
              </div>
              <div>
                <div className="text-lg font-black tracking-tight">КОРПУС</div>
                <div className="text-[10px] tracking-widest opacity-50 font-mono uppercase">Деловой магазин</div>
              </div>
            </div>
            <p className="text-sm opacity-60 leading-relaxed">
              Профессиональные товары и услуги для бизнеса. Работаем с 2010 года.
            </p>
            <div className="flex gap-3 mt-5">
              {["vk", "telegram", "youtube"].map((s) => (
                <button key={s} className="w-8 h-8 border border-white/20 flex items-center justify-center text-white/60 hover:text-white hover:border-white/50 transition-colors text-xs font-mono uppercase">
                  {s[0]}
                </button>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div>
            <div className="section-label text-white/40 mb-4">Навигация</div>
            <ul className="space-y-2.5">
              {[
                { id: "catalog", label: "Каталог товаров" },
                { id: "services", label: "Услуги" },
                { id: "blog", label: "Блог" },
                { id: "about", label: "О компании" },
                { id: "delivery", label: "Доставка" },
              ].map((item) => (
                <li key={item.id}>
                  <button
                    onClick={() => onNavigate(item.id)}
                    className="text-sm text-white/60 hover:text-white transition-colors"
                  >
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <div className="section-label text-white/40 mb-4">Информация</div>
            <ul className="space-y-2.5">
              {["Политика конфиденциальности", "Пользовательское соглашение", "Публичная оферта", "Реквизиты компании", "Отзывы покупателей"].map((item) => (
                <li key={item}>
                  <button className="text-sm text-white/60 hover:text-white transition-colors text-left">{item}</button>
                </li>
              ))}
            </ul>
          </div>

          {/* Contacts */}
          <div>
            <div className="section-label text-white/40 mb-4">Контакты</div>
            <ul className="space-y-3">
              <li className="flex items-start gap-2.5 text-sm text-white/60">
                <Icon name="Phone" size={14} className="mt-0.5 shrink-0 opacity-60" />
                <span>+7 (800) 123-45-67</span>
              </li>
              <li className="flex items-start gap-2.5 text-sm text-white/60">
                <Icon name="Mail" size={14} className="mt-0.5 shrink-0 opacity-60" />
                <span>info@korpus.ru</span>
              </li>
              <li className="flex items-start gap-2.5 text-sm text-white/60">
                <Icon name="MapPin" size={14} className="mt-0.5 shrink-0 opacity-60" />
                <span>Москва, ул. Деловая, д. 15</span>
              </li>
              <li className="flex items-start gap-2.5 text-sm text-white/60">
                <Icon name="Clock" size={14} className="mt-0.5 shrink-0 opacity-60" />
                <span>Пн–Пт 9:00–18:00</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="divider-rule border-white/10 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-xs text-white/40 font-mono">© 2024 КОРПУС. Все права защищены.</span>
          <div className="flex items-center gap-4">
            <span className="text-xs text-white/30 font-mono">ИНН 7700000000</span>
            <div className="flex gap-2">
              {["visa", "mc", "mir"].map((c) => (
                <div key={c} className="px-2 py-0.5 border border-white/20 text-[9px] font-mono text-white/40 uppercase tracking-widest">{c}</div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
