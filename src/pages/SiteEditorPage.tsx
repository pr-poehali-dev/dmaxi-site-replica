import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

const SETTINGS_URL = "https://functions.poehali.dev/011e6885-a0f3-4de0-8320-e49a02f82a7c";

interface SettingItem {
  id: number;
  key: string;
  value: string;
  label: string;
  type: "text" | "textarea" | "image";
  updated_at: string;
}

type Sections = Record<string, SettingItem[]>;

const SECTION_META: Record<string, { label: string; icon: string; desc: string }> = {
  general:  { label: "Общие настройки",    icon: "Settings",    desc: "Название, телефон, адрес, логотип, соцсети" },
  home:     { label: "Главная страница",    icon: "Home",        desc: "Hero-блок, статистика, CTA, блок клуба" },
  about:    { label: "О компании",          icon: "Building2",   desc: "Заголовки, описание, статистика, история" },
  contacts: { label: "Контакты",            icon: "MapPin",      desc: "Адреса, телефоны, часы работы, карта" },
  footer:   { label: "Подвал сайта",        icon: "LayoutList",  desc: "Описание, соцсети, копирайт" },
};

interface Props {
  onNavigate: (p: string) => void;
}

export default function SiteEditorPage({ onNavigate }: Props) {
  const { token } = useAuth();
  const [sections, setSections]     = useState<Sections>({});
  const [loading, setLoading]       = useState(true);
  const [activeSection, setActiveSection] = useState("general");
  const [edited, setEdited]         = useState<Record<string, Record<string, string>>>({});
  const [saving, setSaving]         = useState(false);
  const [imgPreview, setImgPreview] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const r = await fetch(`${SETTINGS_URL}?action=admin_all`, {
        headers: { "X-Auth-Token": token },
      });
      const d = await r.json();
      setSections(d.sections || {});
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const getValue = (section: string, key: string) => {
    return edited[section]?.[key] ?? sections[section]?.find(s => s.key === key)?.value ?? "";
  };

  const handleChange = (section: string, key: string, value: string) => {
    setEdited(prev => ({
      ...prev,
      [section]: { ...(prev[section] || {}), [key]: value },
    }));
  };

  const handleImageUpload = (section: string, key: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const url = ev.target?.result as string;
      setImgPreview(p => ({ ...p, [`${section}.${key}`]: url }));
      handleChange(section, key, url);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!token) return;
    const updates: { section: string; key: string; value: string }[] = [];
    for (const [section, keys] of Object.entries(edited)) {
      for (const [key, value] of Object.entries(keys)) {
        updates.push({ section, key, value });
      }
    }
    if (updates.length === 0) {
      toast.info("Нет изменений для сохранения");
      return;
    }
    setSaving(true);
    try {
      const r = await fetch(`${SETTINGS_URL}?action=save`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Auth-Token": token },
        body: JSON.stringify({ updates }),
      });
      const d = await r.json();
      if (d.ok) {
        toast.success(`Сохранено ${d.saved} изменений`, {
          description: "Обновления вступят в силу после перезагрузки страницы",
        });
        setEdited({});
        setImgPreview({});
        await load();
        // Сигнализируем другим компонентам об обновлении настроек
        window.dispatchEvent(new CustomEvent("site-settings-updated"));
      } else {
        toast.error(d.error || "Ошибка сохранения");
      }
    } finally {
      setSaving(false);
    }
  };

  const hasChanges = Object.keys(edited).some(s => Object.keys(edited[s]).length > 0);
  const sectionItems = sections[activeSection] || [];
  const meta = SECTION_META[activeSection];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Шапка редактора */}
      <div className="bg-gray-900 border-b border-gray-700 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4">
          <button
            onClick={() => onNavigate("admin")}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
          >
            <Icon name="ArrowLeft" size={18} />
          </button>
          <div className="flex items-center gap-2">
            <Icon name="Pencil" size={18} className="text-red-500" />
            <span className="text-white font-bold text-sm uppercase tracking-wide">Редактор сайта</span>
          </div>
          <div className="flex-1" />
          {hasChanges && (
            <span className="text-yellow-400 text-xs font-semibold animate-pulse">
              Есть несохранённые изменения
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={saving || !hasChanges}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white text-sm font-bold px-5 py-2 rounded-lg transition-colors"
          >
            {saving ? (
              <><Icon name="Loader2" size={15} className="animate-spin" />Сохраняю...</>
            ) : (
              <><Icon name="Save" size={15} />Сохранить изменения</>
            )}
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto flex min-h-[calc(100vh-57px)]">
        {/* Боковое меню — разделы */}
        <aside className="w-64 shrink-0 bg-white border-r border-gray-200 py-4">
          <div className="px-4 mb-3">
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Разделы сайта</p>
          </div>
          <nav className="space-y-0.5 px-2">
            {Object.entries(SECTION_META).map(([key, m]) => {
              const hasEdit = edited[key] && Object.keys(edited[key]).length > 0;
              return (
                <button
                  key={key}
                  onClick={() => setActiveSection(key)}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all ${
                    activeSection === key
                      ? "bg-gray-900 text-white"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <Icon name={m.icon as "Settings"} size={16} className={activeSection === key ? "text-red-400" : "text-gray-400"} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate">{m.label}</div>
                  </div>
                  {hasEdit && (
                    <span className="w-2 h-2 rounded-full bg-yellow-400 shrink-0" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Быстрые ссылки */}
          <div className="px-4 mt-6">
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-2">Посмотреть страницы</p>
            <div className="space-y-1">
              {[
                { page: "home",     label: "Главная" },
                { page: "about",    label: "О компании" },
                { page: "contacts", label: "Контакты" },
                { page: "services", label: "Услуги" },
              ].map(l => (
                <button
                  key={l.page}
                  onClick={() => onNavigate(l.page)}
                  className="w-full flex items-center gap-2 text-xs text-gray-500 hover:text-gray-900 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Icon name="ExternalLink" size={12} />{l.label}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Область редактирования */}
        <main className="flex-1 p-6 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-64 text-gray-400">
              <Icon name="Loader2" size={32} className="animate-spin mr-3" />
              <span>Загружаю настройки...</span>
            </div>
          ) : (
            <>
              {/* Заголовок раздела */}
              {meta && (
                <div className="mb-6">
                  <div className="flex items-center gap-3 mb-1">
                    <div className="w-9 h-9 bg-gray-900 rounded-xl flex items-center justify-center">
                      <Icon name={meta.icon as "Settings"} size={18} className="text-red-400" />
                    </div>
                    <h1 className="text-xl font-black text-gray-900">{meta.label}</h1>
                  </div>
                  <p className="text-sm text-gray-500 ml-12">{meta.desc}</p>
                </div>
              )}

              {/* Поля редактирования */}
              {sectionItems.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                  <Icon name="FileText" size={40} className="mx-auto mb-3 opacity-30" />
                  <p>Нет настроек для этого раздела</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {sectionItems.map(item => {
                    const val = getValue(activeSection, item.key);
                    const previewKey = `${activeSection}.${item.key}`;
                    const isChanged = edited[activeSection]?.[item.key] !== undefined;

                    return (
                      <div
                        key={item.key}
                        className={`bg-white rounded-2xl border p-5 transition-all ${
                          isChanged ? "border-yellow-300 shadow-md shadow-yellow-50" : "border-gray-100 shadow-sm"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div>
                            <label className="block text-sm font-bold text-gray-900">{item.label}</label>
                            <span className="text-xs text-gray-400 font-mono">{activeSection}.{item.key}</span>
                          </div>
                          {isChanged && (
                            <span className="shrink-0 bg-yellow-100 text-yellow-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
                              изменено
                            </span>
                          )}
                        </div>

                        {item.type === "textarea" ? (
                          <textarea
                            value={val}
                            onChange={e => handleChange(activeSection, item.key, e.target.value)}
                            rows={4}
                            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none"
                          />
                        ) : item.type === "image" ? (
                          <div className="space-y-3">
                            {(imgPreview[previewKey] || val) && (
                              <div className="relative inline-block">
                                <img
                                  src={imgPreview[previewKey] || val}
                                  alt={item.label}
                                  className="h-32 w-auto rounded-xl object-contain border border-gray-200 bg-gray-50"
                                />
                              </div>
                            )}
                            <div className="flex gap-3 flex-wrap">
                              <label className="flex items-center gap-2 bg-gray-900 text-white text-sm font-semibold px-4 py-2 rounded-xl cursor-pointer hover:bg-gray-700 transition-colors">
                                <Icon name="Upload" size={14} />
                                Загрузить файл
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={e => handleImageUpload(activeSection, item.key, e)}
                                />
                              </label>
                              <span className="text-gray-400 text-sm self-center">или</span>
                              <input
                                type="text"
                                value={val}
                                onChange={e => handleChange(activeSection, item.key, e.target.value)}
                                placeholder="Вставьте URL картинки"
                                className="flex-1 min-w-48 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                              />
                            </div>
                          </div>
                        ) : (
                          <input
                            type="text"
                            value={val}
                            onChange={e => handleChange(activeSection, item.key, e.target.value)}
                            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Кнопка сохранить снизу */}
              {sectionItems.length > 0 && (
                <div className="mt-8 flex justify-end">
                  <button
                    onClick={handleSave}
                    disabled={saving || !hasChanges}
                    className="flex items-center gap-2 bg-gray-900 hover:bg-gray-700 disabled:opacity-40 text-white font-bold px-8 py-3 rounded-xl transition-colors text-sm"
                  >
                    {saving ? (
                      <><Icon name="Loader2" size={16} className="animate-spin" />Сохраняю...</>
                    ) : (
                      <><Icon name="Save" size={16} />Сохранить изменения</>
                    )}
                  </button>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
