"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import { fetchRefresh, setTokenSink, setAuthLostSink } from "@/lib/client/api";
import { LocalStorageSchema } from "@/lib/client/api";

//Stopwatch break rules context
export type BreakRule = { id: string; minMinutes: number; breakMinutes: number };

export const DEFAULT_BREAK_RULES: BreakRule[] = [
  { id: "r0", minMinutes: 0, breakMinutes: 5 },
  { id: "r25", minMinutes: 25, breakMinutes: 6 },
  { id: "r30", minMinutes: 30, breakMinutes: 10 },
  { id: "r40", minMinutes: 40, breakMinutes: 15 },
  { id: "r60", minMinutes: 60, breakMinutes: 20 },
];

type StopwatchRulesType = {
  rules: BreakRule[];
  setRules: (rules: BreakRule[]) => void;
  getBreakMinutes: (elapsedSeconds: number) => number;
};

export const StopwatchRulesContext = createContext<StopwatchRulesType>({
  rules: DEFAULT_BREAK_RULES,
  setRules: () => { },
  getBreakMinutes: () => 5,
});

export const StopwatchRulesProvider = ({ children }: { children: React.ReactNode }) => {
  const [rules, setRules] = useState<BreakRule[]>(DEFAULT_BREAK_RULES);

  const getBreakMinutes = (elapsedSeconds: number) => {
    const m = elapsedSeconds / 60;
    const sorted = [...rules].sort((a, b) => a.minMinutes - b.minMinutes);
    let result = sorted.length ? sorted[0].breakMinutes : 0;
    for (const r of sorted) if (m >= r.minMinutes) result = r.breakMinutes;
    return result;
  };

  return (
    <StopwatchRulesContext.Provider value={{ rules, setRules, getBreakMinutes }}>
      {children}
    </StopwatchRulesContext.Provider>
  );
};

export const useStopwatchRules = () => useContext(StopwatchRulesContext);

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

//User context

export type AuthUser = { id: string; username: string } | null;

export type AuthContextType = {
  user: AuthUser;
  accessToken: string | null;
  dataKey: Uint8Array | null
  loading: boolean;
  setAuth: (user: AuthUser, token: string, dataKey: Uint8Array) => void;
  clearAuth: (error?: any | null) => void;
};


const AuthContext = createContext<AuthContextType>({
  user: null,
  accessToken: null,
  dataKey: null,
  loading: true,
  setAuth: () => { },
  clearAuth: (error = null) => { },
});




export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AuthUser>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [dataKey, setDataKey] = useState<Uint8Array | null>(null);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    setTokenSink(setAccessToken)
    setAuthLostSink(clearAuth)

    async function init() {
      try {
        const raw = localStorage.getItem("auth");
        if (raw) {
          const localStorageData = JSON.parse(raw)
          if (!localStorageData.dataKey) throw Error("Corrupted Storage")
          localStorageData.dataKey = new Uint8Array(localStorageData.dataKey)
          let { user, accessToken, dataKey } = LocalStorageSchema.parse(localStorageData)

          const payload = jwtDecode(accessToken);
          if (!payload.exp) throw Error()
          if (payload.exp * 1000 < Date.now()) {
            const tokens = await fetchRefresh()
            accessToken = tokens.accessToken
            localStorage.setItem("auth", JSON.stringify({ user, accessToken, dataKey: Array.from(dataKey) }))
          }

          setUser(user);
          setAccessToken(accessToken);
          setDataKey(dataKey);

          setLoading(false);
        }
      } catch (error) { console.log("There was an error", error); clearAuth() }

    }
    init()
  }, []);


  const setAuth = (user: AuthUser, accessToken: string, dataKey: Uint8Array) => {
    setLoading(true)
    const data = LocalStorageSchema.parse({ user, accessToken, dataKey })
    setUser(data.user);
    setAccessToken(data.accessToken);
    setDataKey(data.dataKey)
    localStorage.setItem("auth", JSON.stringify({ ...data, dataKey: Array.from(data.dataKey) }));
    setLoading(false)
  };

  const clearAuth = (error = null as null | any) => {

    console.log(error ?? "Clear auth was triggered ");
    fetch("/api/auth/logout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      }
    });
    setUser(null);
    setAccessToken(null);
    setDataKey(null);
    localStorage.removeItem("auth");
  };

  return (
    <AuthContext.Provider value={{ user, accessToken, dataKey, loading, setAuth, clearAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
