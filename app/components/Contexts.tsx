"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import { fetchRefresh } from "@/lib/client/api";

//Settings context
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

export const SettingsContext = createContext<SettingsType>({
  pomodoroTime: 25,
  setPomodoroTime: () => { },
  breakTime: 5,
  setBreakTime: () => { },
  workMusic: "None",
  setWorkMusic: () => { },
  breakMusic: "None",
  setBreakMusic: () => { },
  volume: 0.6,
  setVolume: () => { },
});

//

export type AuthUser = { id: string; username: string } | null;

export type AuthContextType = {
  user: AuthUser;
  token: string | null;
  loading: boolean;
  setAuth: (user: AuthUser, token: string) => void;
  clearAuth: () => void;
};


const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  loading: true,
  setAuth: () => { },
  clearAuth: () => { },
});




export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AuthUser>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {

    async function init() {
      try {
        const raw = localStorage.getItem("auth");
        if (raw) {
          let { user, token } = JSON.parse(raw);
          const payload = jwtDecode(token);
          if (!payload.exp) throw Error()
          if (payload.exp * 1000 < Date.now()) {
            const tokens = await fetchRefresh()
            token = tokens.accessToken
            console.log("We are settting items")
            localStorage.setItem("auth", JSON.stringify({ user, token }))
          }

          console.log(`Setting token as ${token}`)
          setUser(user);
          setToken(token);
          setLoading(false);
        }
      } catch (error) { console.log("There was an error"); clearAuth() }

    }
    init()
  }, []);


  const setAuth = (user: AuthUser, accessToken: string) => {
    setUser(user);
    setToken(accessToken);
    localStorage.setItem("auth", JSON.stringify({ user, token: accessToken }));
  };

  const clearAuth = () => {
    console.log("Clear auth was triggered")
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
