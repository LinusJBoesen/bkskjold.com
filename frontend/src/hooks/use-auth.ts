import { useState, useEffect, useCallback } from "react";
import { api, ApiError } from "@/lib/api";

interface AuthState {
  isAuthenticated: boolean;
  email: string | null;
  name: string | null;
  role: 'admin' | 'spiller' | 'fan' | null;
  karingerAccess: boolean;
  loading: boolean;
}

type MeResponse = { email: string; name: string; role: 'admin' | 'spiller' | 'fan'; karingerAccess?: boolean };

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    email: null,
    name: null,
    role: null,
    karingerAccess: false,
    loading: true,
  });

  const checkAuth = useCallback(async () => {
    try {
      const data = await api.get<MeResponse>("/auth/me");
      setState({ isAuthenticated: true, email: data.email, name: data.name, role: data.role, karingerAccess: !!data.karingerAccess, loading: false });
    } catch {
      setState({ isAuthenticated: false, email: null, name: null, role: null, karingerAccess: false, loading: false });
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (email: string, password: string) => {
    try {
      await api.post("/auth/login", { email, password });
      const data = await api.get<MeResponse>("/auth/me");
      setState({ isAuthenticated: true, email: data.email, name: data.name, role: data.role, karingerAccess: !!data.karingerAccess, loading: false });
      return { success: true };
    } catch (err) {
      if (err instanceof ApiError) {
        return { success: false, error: err.message };
      }
      return { success: false, error: "Ukendt fejl" };
    }
  };

  const logout = async () => {
    await api.post("/auth/logout");
    setState({ isAuthenticated: false, email: null, name: null, role: null, karingerAccess: false, loading: false });
  };

  return { ...state, login, logout };
}
