"use client";

import { useState, useEffect, useRef, useContext, type ReactNode } from "react";
import { Break, PauseButton, PlayButton } from "./buttons";
import Pomodoro from "./Pomodoro";
import Stopwatch from "./Stopwatch";
import Setting from "./Setting";
import InfoButton from "./InfoButton";
import { setTimerStatus } from "./timerStatus";
import { SettingsContext, useAuth } from "./Contexts";
import { Card, Button } from "pixel-retroui";
import { dataApi } from "@/lib/client/api";
import { useTheme } from "./ThemeContext";
import z from "zod"

type Mode = "pomodoro" | "break" | "stopwatch";

const TimerSchema = z.object({
  mode: z.enum(["pomodoro", "break", "stopwatch"]),
  isRunning: z.union([z.literal(0), z.literal(1)]),
  seconds: z.number(),
  lastSaved: z.number()

})

const START_MESSAGES = [
  "You got this!",
  "One focus block!",
  "Keep going!",
  "Tiny steps!",
  "Stay with it!",
];

function Timer() {
  const settingsInfo = useContext(SettingsContext)!;
  const { theme } = useTheme();


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
  const preBreakModeRef = useRef<Mode>("pomodoro"); // mode to return to after a break ends

  // ── stopwatch state (lifted here so Timer owns all state) ─────────────────
  const [swElapsed, setSwElapsed] = useState(0);
  const [swRunning, setSwRunning] = useState(false);
  const swElapsedRef = useRef(0); //we are using ref to make calculation without resetting
  const swRunningRef = useRef(false);


  // ── audio ─────────────────────────────────────────────────────────────────
  // Multiple tracks can play at once (layered soundscape), so we keep a pool
  // of Audio objects instead of a single element.
  const audioPoolRef = useRef<HTMLAudioElement[]>([]);
  const bellRef = useRef<HTMLAudioElement>(null);

  // ── refs that always hold latest user/token (no stale closures) ───────────
  const { user, accessToken, dataKey } = useAuth();
  const userRef = useRef(user);
  const tokenRef = useRef(accessToken);
  const dataKeyRef = useRef(dataKey)
  dataKeyRef.current = dataKey
  userRef.current = user;
  tokenRef.current = accessToken;
  const autoSwitchRef = useRef(settingsInfo.autoSwitch);
  autoSwitchRef.current = settingsInfo.autoSwitch;

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
    for (const audio of audioPoolRef.current) {
      audio.pause();
      audio.src = "";
    }
    audioPoolRef.current = [];
  }

  function playSavedMusic() {
    stopMusic();
    const url = musicForMode(mode);
    if (!url || url === "None") return;
    const audio = new Audio(url);
    audio.loop = true;
    audio.volume = settingsInfo.volume;
    audio.play().catch(() => { });
    audioPoolRef.current.push(audio);
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
    if (!userRef.current || !tokenRef.current || !dataKeyRef.current) {
      return
    };
    dataApi.sendData(dataKeyRef.current, tokenRef.current, "/api/user_data",
      {
        body: JSON.stringify(TimerSchema.parse({
          mode: modeRef.current,
          seconds: modeRef.current === "stopwatch" ? swElapsedRef.current : secondsRef.current,
          isRunning: modeRef.current === "stopwatch" ? Number(swRunningRef.current) : Number(!isPausedRef.current),
          lastSaved: Date.now()
        })),
        method: "PUT"
      }).catch((error) => { console.log(error) });

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
    if (!user || !accessToken || !dataKey) {

      return;
    }
    dataApi.fetchData(dataKey, accessToken, "/api/user_data")
      .then((_state) => {
        const state = TimerSchema.parse(_state)
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
          swRunningRef.current = Boolean(state.isRunning);
          setSwRunning(swRunningRef.current);
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
      .catch((error) => { });
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── main interval: countdown + stopwatch ticking ─────────────────────────
  useEffect(() => {
    function switchMode() {
      const finishedMode = modeRef.current;
      const next = finishedMode === "pomodoro" ? "break" : preBreakModeRef.current;
      if (next === "break") preBreakModeRef.current = finishedMode;
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
      if (next === "stopwatch") {
        swRunningRef.current = false;
        setSwRunning(false);
        swElapsedRef.current = 0;
        setSwElapsed(0);
      } else {
        const nextSec = next === "pomodoro"
          ? settingsInfo.pomodoroTime * 60
          : settingsInfo.breakTime * 60;
        setCountdownTime(nextSec);
        // Auto-switch: start the next session immediately instead of
        // waiting for a manual START.
        if (autoSwitchRef.current) {
          startRef.current = Date.now();
          pauseRef.current = 0;
          pauseElapsedRef.current = 0;
          isPausedRef.current = false;
          setIsPaused(false);
        }
      }
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

  // Publish live state so BoomBox can show playing/muted status.
  useEffect(() => {
    setTimerStatus({ mode, isRunning });
  }, [mode, isRunning]);

  // Apply volume changes live without restarting playback.
  useEffect(() => {
    for (const audio of audioPoolRef.current) audio.volume = settingsInfo.volume;
    if (bellRef.current) bellRef.current.volume = settingsInfo.volume;
  }, [settingsInfo.volume]);

  // ── helpers ───────────────────────────────────────────────────────────────
  function switchToMode(newMode: Mode, newSeconds?: number) {
    if (isRunning) return; // blocked while any timer is running
    if (newMode === "break" && modeRef.current !== "break") {
      preBreakModeRef.current = modeRef.current;
    }
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
    if (modeRef.current !== "break") preBreakModeRef.current = modeRef.current;
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
    <Card bg={theme.card} className="timer-card-with-mascot w-[min(92vw,620px)] px-4 sm:px-10 py-6 sm:py-8 items-center flex flex-col">
      <BunnyMascot src={bunnySrc} message={speechBubble} />
      <div className="absolute top-2 right-2 z-10">
        <InfoButton />
      </div>
      <div className="flex flex-col items-center justify-center w-full">
        <audio ref={bellRef} src="/mixkit-notification-bell-592.wav" preload="none" className="hidden" />

        {/* Mode tabs */}
        <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mt-2 w-full">
          <TabSlot forMode="stopwatch">
            <Button bg={theme.surface} textColor={theme.ink} borderColor={theme.ink} shadow={theme.ink}
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

          <PixelHourglass mode={mode} state={hourglassState} totalDurationSeconds={countdownTotalSeconds} remainingSeconds={seconds} />
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
              stopMusic();
              save();
            }}
            onReset={() => {
              swRunningRef.current = false;
              resetClockRefs();
              swElapsedRef.current = 0;
              setSwRunning(false);
              setSwElapsed(0);
              stopMusic();
              save();
            }}
            onStartBreak={handleStartBreak}
          />
        ) : (
          <>
            <p className="text-[clamp(3.25rem,18vw,8rem)] sm:text-9xl font-extrabold my-4 tracking-normal sm:tracking-widest leading-none text-[var(--ink)]">{formatted}</p>
            <div className="flex flex-wrap justify-center items-center gap-3">
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
            <Setting />
            </div>
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
  remainingSeconds,
}: {
  mode: Mode;
  state: "running" | "paused" | "completed";
  totalDurationSeconds: number;
  remainingSeconds: number;
}) {
  const [loopFrame, setLoopFrame] = useState(1);
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

  // Stopwatch has no fixed end, so it keeps a short continuous loop.
  useEffect(() => {
    if (mode !== "stopwatch" || state !== "running" || reducedMotion) return;

    const id = window.setInterval(() => {
      setLoopFrame((current) => (current === 6 ? 1 : current + 1));
    }, 250);

    return () => window.clearInterval(id);
  }, [mode, reducedMotion, state]);

  // Countdown modes map elapsed fraction directly onto the 6 sand frames,
  // so the hourglass always shows how much time is left.
  let frame: number;
  if (state === "completed") {
    frame = 6;
  } else if (mode === "stopwatch") {
    frame = loopFrame;
  } else {
    const progress = totalDurationSeconds > 0
      ? 1 - remainingSeconds / totalDurationSeconds
      : 0;
    frame = Math.min(6, Math.max(1, Math.floor(progress * 6) + 1));
  }

  const src = `/assets/sprites/hourglass-frame-${frame}.png`;
  return <img className={className} src={src} alt="" aria-hidden="true" draggable="false" />;
}

function BunnyMascot({ src, message }: { src: string; message: string }) {
  return (
    <div className="bunny-mascot-wrap" aria-hidden="true">
      <div className={`bunny-speech-bubble ${message ? "show" : ""}`}>
        {message}
      </div>
      <img className="bunny-mascot" src={src} alt="" draggable="false" decoding="sync" />
    </div>
  );
}

export default Timer;
