"use client";

import { useState } from "react";
import { useAuth, AuthUser } from "@/app/components/Contexts";
import { Button, Popup } from "pixel-retroui";

import { dataApi, sodium } from "@/lib/client/api";

const inputClass =
  "w-full p-2 border border-black rounded text-black text-sm bg-white focus:outline-none focus:ring-1 focus:ring-[#9CAFAA]";

type SaltResponse = {
  salt: string
}

type LoginFetch = {
  accessToken: string,
  refreshToken: string,
  user: AuthUser
}

function encryptPassword(password: string, salt: Uint8Array): [Uint8Array, Uint8Array] {
  const derived = sodium.crypto_pwhash(
    64, password, salt,
    sodium.crypto_pwhash_OPSLIMIT_MODERATE,
    sodium.crypto_pwhash_MEMLIMIT_MODERATE,
    sodium.crypto_pwhash_ALG_ARGON2ID13
  );
  return [derived.slice(0, 32), derived.slice(32, 64)]

}
const UserProfile = () => {
  const { user, setAuth, clearAuth } = useAuth();
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
      //first fetch the salt
      let res: Response
      if (mode === "login") {
        const saltFetch = await fetch("/api/auth/login/start", {
          method: "Post",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username

          })
        })

        const saltResponse = (await saltFetch.json()) as SaltResponse
        if (!saltFetch.ok) {
          const saltError = saltResponse as any
          setError(saltError.error ?? "Something went wrong");
          return;
        }
        const salt = sodium.from_base64(saltResponse.salt);
        const [authKey, encryptionKey] = encryptPassword(password, salt)
        res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username,
            authKey: sodium.to_base64(authKey)
          })

        })

      }
      else {
        const salt = sodium.randombytes_buf(sodium.crypto_pwhash_argon2id_SALTBYTES) //Used for encryption password
        const nonce = sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES);
        const dataKey = sodium.randombytes_buf(32);
        const [authKey, encryptionKey] = encryptPassword(password, salt)

        const wrappedDataKey = sodium.crypto_secretbox_easy(dataKey, nonce, encryptionKey)

        res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            {
              username
              , authKey: sodium.to_base64(authKey)
              , wrappedDataKey: sodium.to_base64(wrappedDataKey)
              , salt: sodium.to_base64(salt)
              , nonce: sodium.to_base64(nonce)
            }),
        });

      }

      if (!res.ok) {
        const data = await res.json() as { error: string }
        setError(data.error ?? "Something went wrong"); return;
      }
      const data = await res.json() as LoginFetch

      setAuth(data.user, data.accessToken);
      reset();
      setIsOpen(false);
    } catch {
      setError("Network error");
    } finally {
      setBusy(false);
    }
  };

  const initials = (user?.username ?? "?")[0].toUpperCase();

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
            <p className="text-black text-sm font-medium truncate max-w-[200px]">{user.username}</p>
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
        <div className="p-4 flex flex-col gap-3 w-[min(18rem,88vw)]">
          <div className="flex gap-1">
            {(["login", "register"] as const).map((m) => (
              <button key={m} onClick={() => { setMode(m); setError(""); }}
                className={`flex-1 py-1 text-sm font-bold border border-black rounded capitalize transition-colors ${mode === m ? "bg-[#9CAFAA] text-[#30210b]" : "bg-white text-gray-400"
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
