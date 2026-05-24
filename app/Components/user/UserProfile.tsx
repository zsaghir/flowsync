"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button, Popup } from "pixel-retroui";

const inputClass =
  "w-full p-2 border border-black rounded text-black text-sm bg-white focus:outline-none focus:ring-1 focus:ring-[#9CAFAA]";

const UserProfile = () => {
  const { user, setAuth, clearAuth } = useAuth();
  const [isOpen, setIsOpen]     = useState(false);
  const [mode, setMode]         = useState<"login" | "register">("login");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm]   = useState("");
  const [error, setError]       = useState("");
  const [busy, setBusy]         = useState(false);

  const reset = () => { setEmail(""); setPassword(""); setConfirm(""); setError(""); };

  const handleSubmit = async () => {
    setError("");
    if (!email || !password) { setError("Email and password required"); return; }
    if (mode === "register" && password !== confirm) { setError("Passwords don't match"); return; }

    setBusy(true);
    try {
      const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register";
      const res  = await fetch(endpoint, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Something went wrong"); return; }
      setAuth(data.user, data.token);
      reset();
      setIsOpen(false);
    } catch {
      setError("Network error");
    } finally {
      setBusy(false);
    }
  };

  const initials = (user?.email ?? "?")[0].toUpperCase();

  if (user) {
    return (
      <div className="flex items-center">
        <button onClick={() => setIsOpen(true)} className="cursor-pointer">
          <div className="w-10 h-10 rounded-full bg-[#9CAFAA] border-2 border-[#30210b] flex items-center justify-center font-bold text-[#30210b] text-lg select-none">
            {initials}
          </div>
        </button>
        <Popup isOpen={isOpen} onClose={() => setIsOpen(false)}>
          <div className="p-4 flex flex-col items-center gap-4">
            <p className="text-black text-sm font-medium truncate max-w-[200px]">{user.email}</p>
            <p className="text-black">Log out?</p>
            <div className="flex gap-3">
              <Button bg="white" textColor="black" borderColor="black"
                onClick={() => { clearAuth(); setIsOpen(false); }}>Yes</Button>
              <Button bg="white" textColor="black" borderColor="black"
                onClick={() => setIsOpen(false)}>No</Button>
            </div>
          </div>
        </Popup>
      </div>
    );
  }

  return (
    <div className="flex items-center">
      <Button bg="#D6DAC8" textColor="black" borderColor="black"
        onClick={() => { reset(); setMode("login"); setIsOpen(true); }}>
        Sign In
      </Button>

      <Popup isOpen={isOpen} onClose={() => setIsOpen(false)}>
        <div className="p-4 flex flex-col gap-3 w-72">
          <div className="flex gap-1">
            {(["login", "register"] as const).map((m) => (
              <button key={m} onClick={() => { setMode(m); setError(""); }}
                className={`flex-1 py-1 text-sm font-bold border border-black rounded capitalize transition-colors ${
                  mode === m ? "bg-[#9CAFAA] text-[#30210b]" : "bg-white text-gray-400"
                }`}>
                {m}
              </button>
            ))}
          </div>

          <input type="email"     placeholder="Email"    value={email}    onChange={(e) => setEmail(e.target.value)}    className={inputClass} />
          <input type="password"  placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass}
            onKeyDown={(e) => e.key === "Enter" && mode === "login" && handleSubmit()} />
          {mode === "register" && (
            <input type="password" placeholder="Confirm password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className={inputClass}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()} />
          )}

          {error && <p className="text-red-500 text-xs">{error}</p>}

          <Button bg="#D6A99D" textColor="#30210b" borderColor="#30210b" shadow="#30210b" onClick={handleSubmit}>
            {busy ? "…" : mode === "login" ? "Login" : "Register"}
          </Button>
        </div>
      </Popup>
    </div>
  );
};

export default UserProfile;
