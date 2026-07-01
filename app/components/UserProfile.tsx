"use client";

import { useState } from "react";
import { useAuth, AuthUser } from "@/app/components/Contexts";
import { Button, Popup } from "pixel-retroui";
import { useTheme } from "./ThemeContext";

import { dataApi, sodium, userLogin, userSignup } from "@/lib/client/api";


const inputClass =
  "w-full p-2 border-2 border-[color:var(--ink)] rounded text-[var(--ink)] text-sm font-semibold bg-[var(--bg)] focus:outline-none focus:bg-[var(--surface)]";

type SaltResponse = {
  salt: string
}

type AccountFetch = {
  accessToken: string,
  wrappedDataKey: Uint8Array,
  user: AuthUser
  nonce: Uint8Array
}


const UserProfile = () => {
  const { user, setAuth, clearAuth } = useAuth();
  const { theme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setusername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const reset = () => { setusername(""); setPassword(""); setConfirm(""); setError(""); };



  const handleSubmit = async () => {
    await sodium.ready;
    setError("");
    if (!username || !password) { setError("username and password required"); return; }
    if (mode === "register" && password !== confirm) { setError("Passwords don't match"); return; }



    setBusy(true);
    try {
      const res = mode === "login" ? await userLogin(username, password) : await userSignup(username, password)
      if ("error" in res) {
        setError(res.error ?? "Something Went wrong")
        clearAuth(res.error)
      } else {
        if (res.user || res.accessToken || res.dataKey) {

          setAuth(res.user, res.accessToken, res.dataKey);

          reset();
          setIsOpen(false);

        }
      }

    } catch (error) {
      setError("Network error");
      console.log(error)
      clearAuth(typeof error === "string" ? error : null)
    } finally {
      setBusy(false);
    }
  };

  const initials = (user?.username ?? "?")[0].toUpperCase();

  if (user) {
    return (
      <div className="flex items-center">
        <button onClick={() => setIsOpen(true)} className="cursor-pointer">
          <div className="w-10 h-10 rounded-full bg-[var(--card)] border-2 border-[color:var(--ink)] flex items-center justify-center font-bold text-[var(--ink)] text-lg select-none hover:scale-110 transition-transform">
            {initials}
          </div>
        </button>
        <Popup isOpen={isOpen} onClose={() => setIsOpen(false)}>
          <div className="flex flex-col bg-[var(--bg)] border-[3px] border-[color:var(--ink)] shadow-[6px_6px_0_var(--ink)] w-[min(16rem,88vw)] max-w-full max-h-[calc(100svh-6.5rem)] overflow-hidden rounded-xl">
            <div className="bg-[var(--ink)] px-4 py-2">
              <h2 className="pixel-font text-sm font-bold text-[var(--bg)] tracking-[0.25em] truncate">{user.username.toUpperCase()}</h2>
            </div>
            <div className="p-4 sm:p-5 flex flex-col items-center gap-4">
            <p className="text-[var(--ink)] font-semibold">Log out?</p>
            <div className="flex gap-3">
              <Button bg={theme.accent} textColor={theme.accentText} borderColor={theme.ink} shadow={theme.ink}
                onClick={() => { clearAuth(); setIsOpen(false); }}>Yes</Button>
              <Button bg={theme.surface} textColor={theme.ink} borderColor={theme.ink} shadow={theme.ink}
                onClick={() => setIsOpen(false)}>No</Button>
            </div>
            </div>
          </div>
        </Popup>
      </div>
    );
  }

  return (
    <div className="flex items-center">
      <Button bg={theme.surface} textColor={theme.ink} borderColor={theme.ink} shadow={theme.ink}
        onClick={() => { reset(); setMode("login"); setIsOpen(true); }}>
        Sign In
      </Button>

      <Popup isOpen={isOpen} onClose={() => setIsOpen(false)}>
        <div className="flex flex-col w-[min(18rem,88vw)] bg-[var(--bg)] border-[3px] border-[color:var(--ink)] shadow-[6px_6px_0_var(--ink)] max-w-full max-h-[calc(100svh-6.5rem)] overflow-hidden rounded-xl">
          <div className="bg-[var(--ink)] px-4 py-2 shrink-0">
            <h2 className="pixel-font text-sm font-bold text-[var(--bg)] tracking-[0.25em]">ACCOUNT</h2>
          </div>
          <div className="p-4 sm:p-5 flex flex-col gap-3 min-h-0 overflow-y-auto">
          <div className="flex gap-1">
            {(["login", "register"] as const).map((m) => (
              <button key={m} onClick={() => { setMode(m); setError(""); }}
                className={`flex-1 py-1 text-sm font-bold border-2 border-[color:var(--ink)] rounded capitalize transition-colors ${mode === m ? "bg-[var(--card)] text-[var(--ink)]" : "bg-[var(--bg)] text-[var(--ink)]/40 hover:text-[var(--ink)]/70"
                  } `}>
                {m}
              </button>
            ))}
          </div>

          <input type="username" placeholder="username" value={username} onChange={(e) => setusername(e.target.value)} className={inputClass} />
          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass}
            onKeyDown={(e) => e.key === "Enter" && mode === "login" && handleSubmit()} />
          {mode === "register" && (
            <input type="password" placeholder="Confirm password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className={inputClass}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()} />
          )}

          {error && <p className="text-red-500 text-xs font-semibold">{error}</p>}

          <Button bg={theme.accent} textColor={theme.accentText} borderColor={theme.ink} shadow={theme.ink} onClick={handleSubmit}>
            {busy ? "…" : mode === "login" ? "Login" : "Register"}
          </Button>
          </div>
        </div>
      </Popup>
    </div>
  );
};

export default UserProfile;
