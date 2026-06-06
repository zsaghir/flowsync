"use client";

import { createContext, useContext, useEffect, useState } from "react";

type AuthUser = { id: string; email: string } | null;

type AuthContextType = {
  user: AuthUser;
  token: string | null;
  loading: boolean;
  setAuth: (user: AuthUser, token: string) => void;
  clearAuth: () => void;
};

type SettingsType = {
  pomodoroTime: number;
  setPomodoroTime: (time: number) => void;
  breakTime: number;
  setBreakTime: (time: number) => void;
  workMusic: string;
  setWorkMusic: (music: string) => void;
  breakMusic: string;
  setBreakMusic: (music: string) => void;
  volume: number;
  setVolume: (volume: number) => void;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  loading: true,
  setAuth: () => {},
  clearAuth: () => {},
});

export const SettingsContext = createContext<SettingsType>({
  pomodoroTime: 25,
  setPomodoroTime: () => {},
  breakTime: 5,
  setBreakTime: () => {},
  workMusic: "None",
  setWorkMusic: () => {},
  breakMusic: "None",
  setBreakMusic: () => {},
  volume: 0.6,
  setVolume: () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AuthUser>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("auth");
      if (raw) {
        const { user, token } = JSON.parse(raw);
        setUser(user);
        setToken(token);
      }
    } catch {}
    setLoading(false);
  }, []);

  const setAuth = (user: AuthUser, token: string) => {
    setUser(user);
    setToken(token);
    localStorage.setItem("auth", JSON.stringify({ user, token }));
  };

  const clearAuth = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("auth");
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, setAuth, clearAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
