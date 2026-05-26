"use client";

import { useState, useEffect, useRef, useContext } from "react";
import { Break, PauseButton, PlayButton } from "./buttons";
import Pomodoro from "./Pomodoro";
import Stopwatch from "./Stopwatch";
import { SettingsContext, useAuth } from "./Contexts";
import { Card, Button } from "pixel-retroui";

type Mode = "pomodoro" | "break" | "stopwatch";

function Timer() {
  const settingsInfo = useContext(SettingsContext)!;
  const { user, token } = useAuth();

  // ── countdown state ──────────────────────────────────────────────────────
  const [seconds, setSeconds] = useState(25 * 60);
  const [isPaused, setIsPaused] = useState(true);
  const [mode, setMode] = useState<Mode>("stopwatch");
  const secondsRef = useRef(seconds);
  const isPausedRef = useRef(isPaused);
  const modeRef = useRef<Mode>(mode);

  // ── stopwatch state (lifted here so Timer owns all state) ─────────────────
  const [swElapsed, setSwElapsed] = useState(0);
  const [swRunning, setSwRunning] = useState(false);
  const swElapsedRef = useRef(0);
  const swRunningRef = useRef(false);

  // ── audio ─────────────────────────────────────────────────────────────────
  const audioRef = useRef<HTMLAudioElement>(null);
  const bellRef = useRef<HTMLAudioElement>(null);

  // ── refs that always hold latest user/token (no stale closures) ───────────
  const userRef = useRef(user);
  const tokenRef = useRef(token);
  userRef.current = user;
  tokenRef.current = token;

  // ── is any timer actively running right now? ──────────────────────────────
  const isRunning = mode === "stopwatch" ? swRunning : !isPaused;

  // ── persist timer state to server (fire-and-forget) ──────────────────────
  function save() {
    if (!userRef.current || !tokenRef.current) return;
    fetch("/api/timer", {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${tokenRef.current}` },
      body: JSON.stringify({
        mode: modeRef.current,
        seconds: modeRef.current === "stopwatch" ? swElapsedRef.current : secondsRef.current,
        isRunning: modeRef.current === "stopwatch" ? swRunningRef.current : !isPausedRef.current,
        lastSaved: Date.now(),
      }),
    }).catch(() => { });
  }

  // ── load saved timer when user logs in ───────────────────────────────────
  useEffect(() => {
    if (!user || !token) return;

    fetch("/api/timer", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((state) => {
        if (!state?.mode) return;

        const driftSec = (Date.now() - state.lastSaved) / 1000;

        modeRef.current = state.mode;
        setMode(state.mode);

        if (state.mode === "stopwatch") {
          // Advance elapsed by however long it was running while away
          const adj = state.isRunning
            ? Math.floor(state.seconds + driftSec)
            : state.seconds;
          swElapsedRef.current = adj;
          setSwElapsed(adj);
          swRunningRef.current = state.isRunning;
          setSwRunning(state.isRunning);
        } else {
          // Subtract drift from remaining seconds
          const adj = state.isRunning
            ? Math.max(0, Math.floor(state.seconds - driftSec))
            : state.seconds;

          if (adj <= 0 && state.isRunning) {
            // Timer fully expired while away — reset to paused at full time
            const full = state.mode === "pomodoro"
              ? settingsInfo.pomodoroTime * 60
              : settingsInfo.breakTime * 60;
            secondsRef.current = full;
            setSeconds(full);
            isPausedRef.current = true;
            setIsPaused(true);
          } else {
            secondsRef.current = adj;
            setSeconds(adj);
            isPausedRef.current = !state.isRunning;
            setIsPaused(!state.isRunning);
          }
        }
      })
      .catch(() => { });
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── main interval: countdown + stopwatch ticking ─────────────────────────
  useEffect(() => {
    function switchMode() {
      const next = modeRef.current === "pomodoro" ? "break" : "pomodoro";
      const nextSec = next === "pomodoro"
        ? settingsInfo.pomodoroTime * 60
        : settingsInfo.breakTime * 60;
      isPausedRef.current = true;
      setIsPaused(true);
      if (bellRef.current) {
        bellRef.current.currentTime = 0;
        bellRef.current.play().catch(() => { });
      }
      setMode(next);
      modeRef.current = next;
      setSeconds(nextSec);
      secondsRef.current = nextSec;
      save();
    }

    // Sync seconds when settings change (only if paused — don't interrupt running timer)
    if (isPausedRef.current) {
      if (modeRef.current === "pomodoro") { secondsRef.current = settingsInfo.pomodoroTime * 60; setSeconds(secondsRef.current); }
      if (modeRef.current === "break") { secondsRef.current = settingsInfo.breakTime * 60; setSeconds(secondsRef.current); }
    }

    const interval = setInterval(() => {
      if (modeRef.current === "stopwatch") {
        if (!swRunningRef.current) return;
        swElapsedRef.current++;
        setSwElapsed(swElapsedRef.current);
        return;
      }
      if (isPausedRef.current) return;
      if (secondsRef.current === 0) { switchMode(); return; }
      secondsRef.current--;
      setSeconds(secondsRef.current);
    }, 1000);

    return () => clearInterval(interval);
  }, [settingsInfo]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── periodic save every 30 s while running ───────────────────────────────
  useEffect(() => {
    if (!isRunning) return;
    const id = setInterval(save, 300_000);
    return () => clearInterval(id);
  }, [isRunning]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── helpers ───────────────────────────────────────────────────────────────
  function handleMusicChange() {
    if (audioRef.current && settingsInfo.music && settingsInfo.music !== "None") {
      audioRef.current.src = settingsInfo.music;
      audioRef.current.loop = true;
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => { });
    }
  }

  function switchToMode(newMode: Mode, newSeconds?: number) {
    if (isRunning) return; // blocked while any timer is running
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0; }
    setIsPaused(true); isPausedRef.current = true;
    setSwRunning(false); swRunningRef.current = false;
    setMode(newMode); modeRef.current = newMode;
    if (newSeconds !== undefined) { setSeconds(newSeconds); secondsRef.current = newSeconds; }
    save();
  }

  function handleStartBreak(breakMinutes: number) {
    const secs = breakMinutes * 60;
    setMode("break"); modeRef.current = "break";
    setSeconds(secs); secondsRef.current = secs;
    setIsPaused(false); isPausedRef.current = false;
    save();
  }

  // ── tab lock helper ───────────────────────────────────────────────────────
  // Wraps a tab button: dims + blocks clicks when another timer is running
  function TabSlot({ forMode, children }: { forMode: Mode; children: React.ReactNode }) {
    const locked = isRunning && mode !== forMode;
    return (
      <div className={locked ? "opacity-40 cursor-not-allowed pointer-events-none select-none" : ""}>
        {children}
      </div>
    );
  }

  const minutes = Math.floor(seconds / 60);
  const remSec = seconds % 60;
  const formatted = `${String(minutes).padStart(2, "0")}:${String(remSec).padStart(2, "0")}`;

  return (
    <Card bg="#9CAFAA" className="px-10 py-8 items-center flex flex-col">
      <div className="flex flex-col items-center justify-center">
        <audio ref={audioRef} preload="none" className="hidden" />
        <audio ref={bellRef} src="/mixkit-notification-bell-592.wav" preload="none" className="hidden" />

        {/* Mode tabs */}
        <div className="flex space-x-3 mt-2">
          <TabSlot forMode="break">
            <Break onClick={() => switchToMode("break", settingsInfo.breakTime * 60)} />
          </TabSlot>
          <TabSlot forMode="pomodoro">
            <Pomodoro onClick={() => switchToMode("pomodoro", settingsInfo.pomodoroTime * 60)} />
          </TabSlot>
          <TabSlot forMode="stopwatch">
            <Button bg="#D6DAC8" textColor="#30210b" borderColor="#30210b" shadow="#30210b"
              className="transition-transform duration-300 ease-in-out hover:-translate-y-1 hover:scale-110"
              onClick={() => switchToMode("stopwatch")}>
              STOPWATCH
            </Button>
          </TabSlot>
        </div>

        {mode === "stopwatch" ? (
          <Stopwatch
            elapsed={swElapsed}
            running={swRunning}
            onStart={() => {
              swRunningRef.current = true;
              setSwRunning(true);
              handleMusicChange();
              save();
            }}
            onStop={() => {
              swRunningRef.current = false;
              setSwRunning(false);
              if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0; }
              save();
            }}
            onReset={() => {
              swRunningRef.current = false;
              swElapsedRef.current = 0;
              setSwRunning(false);
              setSwElapsed(0);
              if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0; }
              save();
            }}
            onStartBreak={handleStartBreak}
          />
        ) : (
          <>
            <p className="text-9xl font-extrabold my-4 tracking-widest">{formatted}</p>
            {isPaused ? (
              <PlayButton onClick={() => {
                setIsPaused(false);
                isPausedRef.current = false;
                handleMusicChange();
                save();
              }} />
            ) : (
              <PauseButton onClick={() => {
                setIsPaused(true);
                isPausedRef.current = true;
                if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0; }
                save();
              }} />
            )}
          </>
        )}
      </div>
    </Card>
  );
}

export default Timer;
