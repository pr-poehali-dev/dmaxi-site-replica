import { createContext, useContext, useState, useEffect, ReactNode } from "react";

const AUTH_URL = "https://functions.poehali.dev/3e75355e-bbd8-4e2b-b8cd-aa607ff82304";

const MAILER_URL = "https://functions.poehali.dev/093c15a5-d14e-4c9e-8c01-38296645286f";

export interface User {
  id: number;
  name: string;
  phone: string;
  email?: string;
  role: "user" | "admin";
  bonus_points: number;
  club_level: "bronze" | "silver" | "gold" | "platinum";
  car_model?: string;
  car_year?: string;
  car_vin?: string;
  full_name_sts?: string;
  car_plate?: string;
  car_sts?: string;
  sts_edit_count?: number;
  sts_edit_limit?: number;
  is_active?: boolean;
  created_at?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (phone: string, password: string) => Promise<void>;
  register: (data: { name: string; phone: string; email?: string; password: string; car_model?: string; full_name_sts?: string; car_plate?: string; car_year?: string; car_vin?: string; car_sts?: string }) => Promise<void>;
  logout: () => void;
  updateProfile: (data: Partial<User> & { new_password?: string }) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("ddmaxi_token"));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      fetchProfile(token).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const fetchProfile = async (t: string) => {
    try {
      const res = await fetch(`${AUTH_URL}?action=profile`, {
        headers: { "X-Auth-Token": t },
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data);
      } else {
        localStorage.removeItem("ddmaxi_token");
        setToken(null);
        setUser(null);
      }
    } catch {
      setUser(null);
    }
  };

  const login = async (phone: string, password: string) => {
    const res = await fetch(`${AUTH_URL}?action=login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Ошибка входа");
    localStorage.setItem("ddmaxi_token", data.token);
    setToken(data.token);
    setUser(data.user);
  };

  const register = async (form: { name: string; phone: string; email?: string; password: string; car_model?: string; full_name_sts?: string; car_plate?: string; car_year?: string; car_vin?: string; car_sts?: string }) => {
    const res = await fetch(`${AUTH_URL}?action=register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Ошибка регистрации");
    localStorage.setItem("ddmaxi_token", data.token);
    setToken(data.token);
    setUser(data.user);
    // Отправляем приветственное письмо
    if (form.email) {
      fetch(`${MAILER_URL}?action=welcome`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name, email: form.email }),
      }).catch(() => {});
    }
  };

  const logout = async () => {
    if (token) {
      await fetch(`${AUTH_URL}?action=logout`, {
        method: "POST",
        headers: { "X-Auth-Token": token },
      }).catch(() => {});
    }
    localStorage.removeItem("ddmaxi_token");
    setToken(null);
    setUser(null);
  };

  const updateProfile = async (formData: Partial<User> & { new_password?: string }) => {
    if (!token) throw new Error("Не авторизован");
    const res = await fetch(`${AUTH_URL}?action=profile`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", "X-Auth-Token": token },
      body: JSON.stringify(formData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Ошибка обновления");
    await fetchProfile(token);
  };

  const refreshProfile = async () => {
    if (token) await fetchProfile(token);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, updateProfile, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}