import Icon from "@/components/ui/icon";
import { useSiteSettings } from "@/context/SiteSettingsContext";

interface FooterProps {
  onNavigate: (p: string) => void;
}

export default function Footer({ onNavigate }: FooterProps) {
  const { s } = useSiteSettings();
  return (
    <footer className="bg-card border-t border-border mt-auto">
      <div className="container mx-auto py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3 mb-5">
              {s("footer", "logo_url") || s("general", "logo_url") ? (
                <img
                  src={s("footer","logo_url") || s("general","logo_url")}
                  alt={s("general","company_name","DD MAXI")}
                  className="h-10 w-auto object-contain"
                />
              ) : (
                <div className="w-10 h-10 bg-primary flex items-center justify-center">
                  <span className="text-white font-display font-black text-lg">DD</span>
                </div>
              )}
              <div>
                <div className="font-display font-bold text-xl tracking-widest">{s("general","company_name","DD MAXI")}</div>
                <div className="label-tag text-[9px]">{s("footer","logo_tagline") || s("general","tagline","автосервис")}</div>
              </div>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed mb-5">
              {s("footer","description","Профессиональный ремонт и обслуживание автомобилей. Клубная система скидок для постоянных клиентов.")}
            </p>
            <div className="flex gap-2">
              {[
                { label: "VK", key: "vk_url" },
                { label: "TG", key: "tg_url" },
                { label: "YT", key: "yt_url" },
              ].map((sn) => (
                <a key={sn.key} href={s("footer", sn.key, "#")} target="_blank" rel="noopener noreferrer"
                   className="w-8 h-8 border border-border text-muted-foreground hover:border-primary hover:text-primary transition-colors text-[10px] font-display font-bold tracking-wide flex items-center justify-center">
                  {sn.label}
                </a>
              ))}
            </div>
          </div>

          {/* Services */}
          <div>
            <div className="label-tag mb-4">Услуги</div>
            <ul className="space-y-2.5">
              {["Диагностика", "Ремонт двигателя", "Замена масла", "Шиномонтаж", "Кузовной ремонт", "ТО по регламенту"].map((s) => (
                <li key={s}>
                  <button
                    onClick={() => onNavigate("services")}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-2"
                  >
                    <span className="w-1 h-1 bg-primary inline-block shrink-0" />
                    {s}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Links */}
          <div>
            <div className="label-tag mb-4">Информация</div>
            <ul className="space-y-2.5">
              {[
                { id: "about", label: "О компании" },
                { id: "prices", label: "Стоимость услуг" },
                { id: "portfolio", label: "Портфолио работ" },
                { id: "club", label: "Клуб DD MAXI" },
                { id: "contacts", label: "Регионы работы" },
                { id: "contacts", label: "График работы" },
              ].map((item, i) => (
                <li key={i}>
                  <button
                    onClick={() => onNavigate(item.id)}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-2"
                  >
                    <span className="w-1 h-1 bg-border inline-block shrink-0" />
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Contacts */}
          <div>
            <div className="label-tag mb-4">Контакты</div>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <Icon name="Phone" size={14} className="text-primary shrink-0 mt-0.5" />
                <div>
                  <div className="text-sm font-semibold">{s("general","phone","+7 (3952) 00-00-00")}</div>
                  <div className="label-tag mt-0.5">Основной номер</div>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Icon name="MapPin" size={14} className="text-primary shrink-0 mt-0.5" />
                <div>
                  <div className="text-sm">{s("general","address","Иркутск, ул. Верхоленская")}</div>
                  <div className="label-tag mt-0.5">СТО Верхоленская</div>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Icon name="Clock" size={14} className="text-primary shrink-0 mt-0.5" />
                <div>
                  <div className="text-sm">{s("general","hours","Пн–Сб 9:00–21:00")}</div>
                  <div className="label-tag mt-0.5">{s("general","hours_note","Воскресенье — выходной")}</div>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Icon name="Mail" size={14} className="text-primary shrink-0 mt-0.5" />
                <div className="text-sm">{s("general","email","info@d-d-maxi.ru")}</div>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-xs text-muted-foreground">{s("footer","copyright","© 2024 DD MAXI. Все права защищены.")}</span>
          <div className="flex gap-4 text-xs text-muted-foreground">
            <button className="hover:text-foreground transition-colors">Политика конфиденциальности</button>
            <button className="hover:text-foreground transition-colors">Пользовательское соглашение</button>
          </div>
        </div>
      </div>
    </footer>
  );
}