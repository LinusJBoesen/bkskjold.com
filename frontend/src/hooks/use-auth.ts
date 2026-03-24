import { useState, useEffect, useCallback } from "react";
import { api, ApiError } from "@/lib/api";

interface AuthState {
  isAuthenticated: boolean;
  email: string | null;
  loading: boolean;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    email: null,
    loading: true,
  });

  const checkAuth = useCallback(async () => {
    try {
      const data = await api.get<{ email: string }>("/auth/me");
      setState({ isAuthenticated: true, email: data.email, loading: false });
    } catch {
      setState({ isAuthenticated: false, email: null, loading: false });
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (email: string, password: string) => {
    try {
      await api.post("/auth/login", { email, password });
      setState({ isAuthenticated: true, email, loading: false });
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
    setState({ isAuthenticated: false, email: null, loading: false });
  };

  return { ...state, login, logout };
}
