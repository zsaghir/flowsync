"use client";

import { useState, useEffect, useRef, useContext, type ReactNode } from "react";
import { Break, PauseButton, PlayButton } from "./buttons";
import Pomodoro from "./Pomodoro";
import Stopwatch from "./Stopwatch";
import { SettingsContext, useAuth } from "./Contexts";
import { Card, Button } from "pixel-retroui";

type Mode = "pomodoro" | "break" | "stopwatch";

const START_MESSAGES = [
  "You got this!",
  "One focus block!",
  "Keep going!",
  "Tiny steps!",
  "Stay with it!",
];

function Timer() {
  const settingsInfo = useContext(SettingsContext)!;
  const { user, token } = useAuth();

  // References of all the start times
  const startRef = useRef(0);
  const pauseRef = useRef(0);
  const pauseElapsedRef = useRef(0);

  // ── countdown state ──────────────────────────────────────────────────────
  const [seconds, setSeconds] = useState(25 * 60);
  const [isPaused, setIsPaused] = useState(true);
  const [mode, setMode] = useState<Mode>("stopwatch");
  const [countdownTotalSeconds, setCountdownTotalSeconds] = useState(25 * 60);
  const [completedPulse, setCompletedPulse] = useState(false);
  const [motivationPulse, setMotivationPulse] = useState(false);
  const [speechBubble, setSpeechBubble] = useState("");
  const secondsRef = useRef(seconds);
  const countdownStartSecondsRef = useRef(25 * 60);
  const isPausedRef = useRef(isPaused);
  const modeRef = useRef<Mode>(mode);

  // ── stopwatch state (lifted here so Timer owns all state) ─────────────────
  const [swElapsed, setSwElapsed] = useState(0);
  const [swRunning, setSwRunning] = useState(false);
  const swElapsedRef = useRef(0); //we are using ref to make calculation without resetting
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
  const hourglassState = completedPulse
    ? "completed"
    : isRunning
      ? "running"
      : "paused";
  const bunnySrc = completedPulse
    ? "/assets/sprites/bunny-complete.png"
    : motivationPulse
      ? "/assets/sprites/bunny-motivation.png"
      : mode === "break"
        ? "/assets/sprites/bunny-break.png"
        : "/assets/sprites/bunny-pomodoro.png";

  function musicForMode(m: Mode) {
    return m === "break" ? settingsInfo.breakMusic : settingsInfo.workMusic;
  }

  function shouldPlayMusic() {
    const choice = musicForMode(mode);
    return isRunning && Boolean(choice) && choice !== "None";
  }

  function stopMusic() {
    if (!audioRef.current) return;
    audioRef.current.pause();
    audioRef.current.currentTime = 0;
  }

  function playSavedMusic() {
    if (!audioRef.current) return;
    const choice = musicForMode(mode);
    if (!choice || choice === "None") return;
    audioRef.current.src = choice;
    audioRef.current.loop = true;
    audioRef.current.volume = settingsInfo.volume;
    audioRef.current.currentTime = 0;
    audioRef.current.play().catch(() => { });
  }

  function showSpeech(message: string, useMotivationBunny = false) {
    setSpeechBubble(message);
    if (useMotivationBunny) {
      setMotivationPulse(true);
    }
  }

  function showRandomStartSpeech() {
    const message = START_MESSAGES[Math.floor(Math.random() * START_MESSAGES.length)];
    showSpeech(message, true);
  }

  useEffect(() => {
    if (!speechBubble) return;
    const id = window.setTimeout(() => setSpeechBubble(""), 4000);
    return () => window.clearTimeout(id);
  }, [speechBubble]);

  useEffect(() => {
    if (!motivationPulse) return;
    const id = window.setTimeout(() => setMotivationPulse(false), 4000);
    return () => window.clearTimeout(id);
  }, [motivationPulse]);

  useEffect(() => {
    if (!completedPulse) return;
    const id = window.setTimeout(() => setCompletedPulse(false), 4000);
    return () => window.clearTimeout(id);
  }, [completedPulse]);

  useEffect(() => {
    function handleTasksComplete() {
      setCompletedPulse(true);
      showSpeech("All done!");
    }

    window.addEventListener("flowsync:tasks-complete", handleTasksComplete);
    return () => window.removeEventListener("flowsync:tasks-complete", handleTasksComplete);
  }, []);

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

  function resetClockRefs() {
    startRef.current = 0;
    pauseRef.current = 0;
    pauseElapsedRef.current = 0;
  }

  function setCountdownTime(totalSeconds: number, remainingSeconds = totalSeconds) {
    countdownStartSecondsRef.current = remainingSeconds;
    secondsRef.current = remainingSeconds;
    setSeconds(remainingSeconds);
    setCountdownTotalSeconds(totalSeconds);
  }

  function elapsedWithDrift() {
    if (startRef.current === 0) return 0;

    const driftSec = (Date.now() - startRef.current + pauseElapsedRef.current) / 1000;
    if (modeRef.current === "pomodoro" || modeRef.current === "break") {
      return Math.max(0, Math.ceil(countdownStartSecondsRef.current - driftSec));
    }

    return Math.max(0, Math.floor(driftSec));
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
          const adj = Math.max(0, Math.floor(
            state.isRunning ? state.seconds + driftSec : state.seconds,
          ));
          swElapsedRef.current = adj;
          setSwElapsed(adj);
          swRunningRef.current = state.isRunning;
          setSwRunning(state.isRunning);
          if (adj > 0 || state.isRunning) {
            startRef.current = Date.now() - adj * 1000;
            pauseRef.current = state.isRunning ? 0 : Date.now();
            pauseElapsedRef.current = 0;
          } else {
            resetClockRefs();
          }
        } else {
          const full = state.mode === "pomodoro"
            ? settingsInfo.pomodoroTime * 60
            : settingsInfo.breakTime * 60;

          // Subtract drift from remaining seconds
          const adj = Math.max(0, Math.ceil(
            state.isRunning ? state.seconds - driftSec : state.seconds,
          ));
          const total = Math.max(full, adj);

          if (adj <= 0 && state.isRunning) {
            // Timer fully expired while away — reset to paused at full time
            setCountdownTime(full);
            isPausedRef.current = true;
            setIsPaused(true);
            resetClockRefs();
          } else {
            setCountdownTime(total, adj);
            isPausedRef.current = !state.isRunning;
            setIsPaused(!state.isRunning);
            if (state.isRunning) {
              startRef.current = Date.now();
              pauseRef.current = 0;
              pauseElapsedRef.current = 0;
            } else {
              resetClockRefs();
            }
          }
        }
      })
      .catch(() => { });
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── main interval: countdown + stopwatch ticking ─────────────────────────
  useEffect(() => {
    function switchMode() {
      const finishedMode = modeRef.current;
      const next = modeRef.current === "pomodoro" ? "break" : "pomodoro";
      const nextSec = next === "pomodoro"
        ? settingsInfo.pomodoroTime * 60
        : settingsInfo.breakTime * 60;
      isPausedRef.current = true;
      setIsPaused(true);
      stopMusic();
      if (bellRef.current) {
        bellRef.current.currentTime = 0;
        bellRef.current.play().catch(() => { });
      }
      setMode(next);
      modeRef.current = next;
      resetClockRefs();
      setCountdownTime(nextSec);
      setCompletedPulse(true);
      showSpeech(finishedMode === "pomodoro" ? "Nice work!" : "You got this!");
      save();
    }

    // Sync seconds when settings change (only if paused — don't interrupt running timer)
    if (isPausedRef.current) {
      if (modeRef.current === "pomodoro") {
        resetClockRefs();
        setCountdownTime(settingsInfo.pomodoroTime * 60);
      }
      if (modeRef.current === "break") {
        resetClockRefs();
        setCountdownTime(settingsInfo.breakTime * 60);
      }
    }

    const interval = setInterval(() => {
      if (modeRef.current === "stopwatch") {
        if (!swRunningRef.current) return;
        swElapsedRef.current = elapsedWithDrift();
        setSwElapsed(swElapsedRef.current);
        return;
      }
      if (isPausedRef.current) return;
      const nextSeconds = elapsedWithDrift();
      if (nextSeconds <= 0) {
        secondsRef.current = 0;
        setSeconds(0);
        switchMode();
        return;
      }
      secondsRef.current = nextSeconds;

      setSeconds(secondsRef.current);
    }, 1000);

    return () => clearInterval(interval);
  }, [settingsInfo.pomodoroTime, settingsInfo.breakTime]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── periodic save every 30 s while running ───────────────────────────────
  useEffect(() => {
    if (!isRunning) return;
    const id = setInterval(save, 30_000);
    return () => clearInterval(id);
  }, [isRunning]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!shouldPlayMusic()) {
      stopMusic();
      return;
    }

    playSavedMusic();
    return stopMusic;
  }, [isRunning, mode, settingsInfo.workMusic, settingsInfo.breakMusic]); // eslint-disable-line react-hooks/exhaustive-deps

  // Apply volume changes live without restarting playback.
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = settingsInfo.volume;
    if (bellRef.current) bellRef.current.volume = settingsInfo.volume;
  }, [settingsInfo.volume]);

  // ── helpers ───────────────────────────────────────────────────────────────
  function switchToMode(newMode: Mode, newSeconds?: number) {
    if (isRunning) return; // blocked while any timer is running
    stopMusic();
    setIsPaused(true); isPausedRef.current = true;
    setSwRunning(false); swRunningRef.current = false;
    setMode(newMode); modeRef.current = newMode;
    resetClockRefs();
    if (newSeconds !== undefined) {
      setCountdownTime(newSeconds);
    }
    save();
  }

  function handleStartBreak(breakMinutes: number) {
    const secs = breakMinutes * 60;
    setMode("break"); modeRef.current = "break";
    setCountdownTime(secs);
    startRef.current = Date.now();
    pauseRef.current = 0;
    pauseElapsedRef.current = 0;
    setIsPaused(false); isPausedRef.current = false;
    showSpeech("Break time!");
    save();
  }

  // ── tab lock helper ───────────────────────────────────────────────────────
  // Wraps a tab button: dims + blocks clicks when another timer is running
  function TabSlot({ forMode, children }: { forMode: Mode; children: ReactNode }) {
    const locked = isRunning && mode !== forMode;
    return (
      <div className={locked ? "opacity-40 cursor-not-allowed pointer-events-none select-none" : ""}>
        {children}
      </div>
    );
  }
  //Changing the tab title when needed
  const minutes = (modeRef.current === "stopwatch") ? Math.floor(swElapsed / 60) : Math.floor(seconds / 60);
  const remSec = (modeRef.current === "stopwatch") ? Math.floor(swElapsed % 60) : Math.floor(seconds % 60);
  const formatted = `${String(minutes).padStart(2, "0")}:${String(remSec).padStart(2, "0")}`;
  useEffect(() => {
    document.title = `${formatted} - FlowSync`;
  }, [formatted]);


  return (
    <Card bg="#9CAFAA" className="timer-card-with-mascot w-[min(92vw,620px)] px-4 sm:px-10 py-6 sm:py-8 items-center flex flex-col">
      <BunnyMascot src={bunnySrc} message={speechBubble} />
      <div className="flex flex-col items-center justify-center w-full">
        <audio ref={audioRef} preload="none" className="hidden" />
        <audio ref={bellRef} src="/mixkit-notification-bell-592.wav" preload="none" className="hidden" />

        {/* Mode tabs */}
        <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mt-2 w-full">
          <TabSlot forMode="stopwatch">
            <Button bg="#D6DAC8" textColor="#30210b" borderColor="#30210b" shadow="#30210b"
              className="transition-transform duration-300 ease-in-out hover:-translate-y-1 hover:scale-110"
              onClick={() => switchToMode("stopwatch")}>
              STOPWATCH
            </Button>
          </TabSlot>
          <TabSlot forMode="break">
            <Break onClick={() => switchToMode("break", settingsInfo.breakTime * 60)} />
          </TabSlot>
          <TabSlot forMode="pomodoro">
            <Pomodoro onClick={() => switchToMode("pomodoro", settingsInfo.pomodoroTime * 60)} />
          </TabSlot>

          <PixelHourglass mode={mode} state={hourglassState} totalDurationSeconds={countdownTotalSeconds} />
        </div>

        {mode === "stopwatch" ? (
          <Stopwatch
            elapsed={swElapsed}
            running={swRunning}
            onStart={() => {
              if (startRef.current === 0) {
                startRef.current = Date.now() - swElapsedRef.current * 1000;
              } else if (pauseRef.current > 0) {
                pauseElapsedRef.current -= (Date.now() - pauseRef.current);
                pauseRef.current = 0;
              }
              swRunningRef.current = true;
              setSwRunning(true);
              showRandomStartSpeech();
              save();
            }}
            onStop={() => {
              swElapsedRef.current = elapsedWithDrift();
              setSwElapsed(swElapsedRef.current);
              pauseRef.current = Date.now();
              swRunningRef.current = false;
              setSwRunning(false);
              if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0; }
              save();
            }}
            onReset={() => {
              swRunningRef.current = false;
              resetClockRefs();
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
            <p className="text-[clamp(3.25rem,18vw,8rem)] sm:text-9xl font-extrabold my-4 tracking-normal sm:tracking-widest leading-none">{formatted}</p>
            {isPaused ? (
              <PlayButton onClick={() => {
                if (startRef.current === 0) {
                  countdownStartSecondsRef.current = secondsRef.current;
                  startRef.current = Date.now();
                } else if (pauseRef.current > 0) {
                  pauseElapsedRef.current -= (Date.now() - pauseRef.current);
                  pauseRef.current = 0;
                }
                setIsPaused(false);
                isPausedRef.current = false;
                if (mode === "break") {
                  showSpeech("Break time!");
                } else {
                  showRandomStartSpeech();
                }
                save();
              }} />
            ) : (
              <PauseButton onClick={() => {
                secondsRef.current = elapsedWithDrift();
                setSeconds(secondsRef.current);
                pauseRef.current = Date.now();
                setIsPaused(true);
                isPausedRef.current = true;
                save();
              }} />
            )}
          </>
        )}
      </div>
    </Card>
  );
}

function PixelHourglass({
  mode,
  state,
  totalDurationSeconds,
}: {
  mode: Mode;
  state: "running" | "paused" | "completed";
  totalDurationSeconds: number;
}) {
  const [frame, setFrame] = useState(1);
  const [reducedMotion, setReducedMotion] = useState(false);
  const className = [
    "pixel-hourglass",
    state,
    mode === "break" ? "break-mode" : "",
    mode === "stopwatch" ? "stopwatch-mode" : "",
  ].filter(Boolean).join(" ");

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    function updateReducedMotion() {
      setReducedMotion(media.matches);
    }

    updateReducedMotion();
    media.addEventListener("change", updateReducedMotion);
    return () => media.removeEventListener("change", updateReducedMotion);
  }, []);

  useEffect(() => {
    if (state === "completed") {
      setFrame(6);
      return;
    }

    if (state !== "running" || reducedMotion) {
      return;
    }

    const countdownFrameDelayMs = ((totalDurationSeconds / 4) * 1000) / 6;
    const intervalMs = mode === "stopwatch" ? 250 : Math.max(250, countdownFrameDelayMs);
    const id = window.setInterval(() => {
      setFrame((current) => (current === 6 ? 1 : current + 1));
    }, intervalMs);

    return () => window.clearInterval(id);
  }, [mode, reducedMotion, state, totalDurationSeconds]);

  const src = `/assets/sprites/hourglass-frame-${frame}.png`;
  return <img className={className} src={src} alt="" aria-hidden="true" draggable="false" />;
}

function BunnyMascot({ src, message }: { src: string; message: string }) {
  return (
    <div className="bunny-mascot-wrap" aria-hidden="true">
      <div className={`bunny-speech-bubble ${message ? "show" : ""}`}>
        {message}
      </div>
      <img className="bunny-mascot" src={src} alt="" draggable="false" />
    </div>
  );
}

export default Timer;
