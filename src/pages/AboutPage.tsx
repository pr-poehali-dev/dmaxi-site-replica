import Icon from "@/components/ui/icon";

const OFFICE_IMAGE = "https://cdn.poehali.dev/projects/6ac06d75-10c8-4905-8743-acae4c622e9a/files/bc1b03f6-c2e4-4b4c-8f3d-7b6a7e74c8ce.jpg";

const team = [
  { name: "Александр Петров", role: "Генеральный директор", exp: "20 лет в отрасли" },
  { name: "Марина Соколова", role: "Коммерческий директор", exp: "15 лет в B2B" },
  { name: "Дмитрий Козлов", role: "Руководитель логистики", exp: "12 лет опыта" },
  { name: "Елена Новикова", role: "Руководитель сервиса", exp: "10 лет опыта" },
];

const milestones = [
  { year: "2010", event: "Основание компании. Первый офис в Москве, 5 сотрудников." },
  { year: "2013", event: "Открытие собственного сервисного центра и склада 2000 м²." },
  { year: "2016", event: "Региональное расширение. Представительства в 12 городах России." },
  { year: "2019", event: "Запуск корпоративного портала. 5000 клиентов B2B." },
  { year: "2022", event: "Дистрибьюторские соглашения с 40 ведущими производителями." },
  { year: "2024", event: "Онлайн-магазин нового поколения. 15 000 клиентов, 8200+ позиций." },
];

export default function AboutPage() {
  return (
    <div className="animate-fade-in">
      {/* Breadcrumb */}
      <div className="border-b border-border bg-secondary/30">
        <div className="container mx-auto px-4 py-3 flex items-center gap-2 text-xs text-muted-foreground font-mono">
          <span className="hover:text-foreground cursor-pointer transition-colors">Главная</span>
          <Icon name="ChevronRight" size={12} />
          <span className="text-foreground">О компании</span>
        </div>
      </div>

      {/* Hero */}
      <section className="relative bg-[hsl(var(--primary))] py-16 overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center opacity-10" style={{ backgroundImage: `url(${OFFICE_IMAGE})` }} />
        <div className="relative container mx-auto px-4 text-center">
          <div className="section-label text-white/40 mb-3">Кто мы</div>
          <h1 className="text-4xl font-black text-white tracking-tight mb-4">О компании «Корпус»</h1>
          <p className="text-white/60 max-w-xl mx-auto text-sm leading-relaxed">
            Надёжный поставщик профессионального оборудования и решений для бизнеса с 2010 года
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="container mx-auto px-4 py-14">
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          <div>
            <div className="section-label mb-3">Миссия</div>
            <h2 className="text-3xl font-black tracking-tight mb-6 leading-tight">
              Мы оснащаем бизнес<br/>всем необходимым
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-6">
              «Корпус» — это команда профессионалов, которая помогает компаниям создавать эффективные рабочие пространства. Мы не просто продаём оборудование — мы предлагаем комплексные решения: от подбора до монтажа и обслуживания.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-8">
              За 14 лет работы мы поставили оборудование в более чем 15 000 компаний по всей России — от стартапов до федеральных корпораций.
            </p>
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: "Award", text: "Официальный дистрибьютор" },
                { icon: "Truck", text: "Доставка за 1–3 дня" },
                { icon: "Wrench", text: "Гарантийный сервис" },
                { icon: "Users", text: "Персональный менеджер" },
              ].map((f) => (
                <div key={f.text} className="flex items-center gap-3 p-3 bg-secondary/50 border border-border">
                  <Icon name={f.icon as "Award"} size={18} className="text-[hsl(var(--corp-gold))] shrink-0" />
                  <span className="text-sm font-medium">{f.text}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="aspect-[4/3] overflow-hidden">
            <img src={OFFICE_IMAGE} alt="Наш офис" className="w-full h-full object-cover" />
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="bg-secondary/30 border-y border-border py-14">
        <div className="container mx-auto px-4">
          <div className="section-label mb-2 text-center">История</div>
          <h2 className="text-2xl font-black tracking-tight text-center mb-10">Путь компании</h2>
          <div className="max-w-3xl mx-auto">
            <div className="relative">
              <div className="absolute left-16 top-0 bottom-0 w-px bg-border" />
              <div className="space-y-0">
                {milestones.map((m, i) => (
                  <div key={m.year} className="flex gap-6 items-start" style={{ animationDelay: `${i * 0.1}s` }}>
                    <div className="w-16 shrink-0 text-right">
                      <span className="font-mono font-black text-sm text-[hsl(var(--corp-gold))]">{m.year}</span>
                    </div>
                    <div className="relative pl-6 pb-8">
                      <div className="absolute left-0 top-1 w-3 h-3 border-2 border-[hsl(var(--primary))] bg-white rounded-full" />
                      <p className="text-sm text-muted-foreground leading-relaxed">{m.event}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="container mx-auto px-4 py-14">
        <div className="section-label mb-2 text-center">Команда</div>
        <h2 className="text-2xl font-black tracking-tight text-center mb-10">Руководство компании</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {team.map((member) => (
            <div key={member.name} className="text-center">
              <div className="w-20 h-20 bg-secondary border border-border flex items-center justify-center mx-auto mb-4">
                <Icon name="User" size={32} className="text-muted-foreground/40" />
              </div>
              <div className="text-sm font-semibold">{member.name}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{member.role}</div>
              <div className="section-label mt-2">{member.exp}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Certificates */}
      <section className="bg-secondary/30 border-t border-border py-10">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <div className="section-label mb-2">Документы</div>
            <h2 className="text-xl font-black tracking-tight">Сертификаты и лицензии</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto">
            {["ISO 9001:2015", "ГОСТ Р 55799", "ФСБ Лицензия", "ЭЦП Аккредитация"].map((cert) => (
              <div key={cert} className="border border-border bg-white p-4 text-center">
                <Icon name="FileCheck" size={28} className="text-muted-foreground/40 mx-auto mb-2" />
                <div className="text-xs font-semibold font-mono">{cert}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
