import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";

const SETTINGS_URL = "https://functions.poehali.dev/011e6885-a0f3-4de0-8320-e49a02f82a7c";
const CACHE_KEY    = "site_settings_cache";

type Settings = Record<string, Record<string, string>>;

interface SiteSettingsContextValue {
  s: (section: string, key: string, fallback?: string) => string;
  settings: Settings;
  loading: boolean;
  reload: () => void;
}

function readCache(): Settings {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeCache(data: Settings) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch { /* ignore quota errors */ }
}

const SiteSettingsContext = createContext<SiteSettingsContextValue>({
  s: (_sec, _key, fallback = "") => fallback,
  settings: {},
  loading: true,
  reload: () => {},
});

export function SiteSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(() => readCache());
  const [loading, setLoading]   = useState(true);

  const load = useCallback(async () => {
    try {
      const r = await fetch(`${SETTINGS_URL}?action=all`);
      const d = await r.json();
      const fresh = d.settings || {};
      setSettings(fresh);
      writeCache(fresh);
    } catch {
      // используем кеш если сеть недоступна
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const handler = () => load();
    window.addEventListener("site-settings-updated", handler);
    return () => window.removeEventListener("site-settings-updated", handler);
  }, [load]);

  const s = useCallback((section: string, key: string, fallback = "") => {
    return settings[section]?.[key] ?? fallback;
  }, [settings]);

  return (
    <SiteSettingsContext.Provider value={{ s, settings, loading, reload: load }}>
      {children}
    </SiteSettingsContext.Provider>
  );
}

export function useSiteSettings() {
  return useContext(SiteSettingsContext);
}