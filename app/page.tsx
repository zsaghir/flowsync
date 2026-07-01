"use client";
import { useEffect, useRef, useState } from "react";
import { SettingsContext, StopwatchRulesProvider } from "./components/Contexts";
import UserProfile from "./components/UserProfile";
import BoomBox from "./components/BoomBox";
import UserTasks from "./components/UserTasks";
import Timer from "./components/Timer";
import ThemeButton from "./components/ThemeButton";
import { openFlowsyncDb } from "./components/db";
import { useTheme } from "./components/ThemeContext";
import { Button } from "pixel-retroui";

export default function Page() {
  const { theme } = useTheme();
  const [pomodoroTime, setPomodoroTime] = useState(25);
  const [breakTime, setBreakTime] = useState(5);
  const [autoSwitch, setAutoSwitch] = useState(false);
  const [workMusic, setWorkMusic] = useState("None");
  const [breakMusic, setBreakMusic] = useState("None");
  const [volume, setVolume] = useState(0.6);
  const [menuOpen, setMenuOpen] = useState(false);
  const settingsLoadedRef = useRef(false);

  // Boombox + timer preferences persist in IndexedDB.
  useEffect(() => {
    // Older saves stored arrays of tracks; take the first one.
    const asTrack = (value: unknown) =>
      typeof value === "string" ? value
        : Array.isArray(value) && typeof value[0] === "string" ? value[0]
          : "None";

    openFlowsyncDb()
      .then(async (db) => {
        const boombox = await db.get("settings", "boombox");
        if (boombox) {
          setWorkMusic(asTrack(boombox.workMusic));
          setBreakMusic(asTrack(boombox.breakMusic));
          if (typeof boombox.volume === "number") setVolume(boombox.volume);
        }
        const timer = await db.get("settings", "timer");
        if (timer && typeof timer.autoSwitch === "boolean") setAutoSwitch(timer.autoSwitch);
      })
      .catch((error) => console.log(error))
      .finally(() => { settingsLoadedRef.current = true; });
  }, []);

  useEffect(() => {
    if (!settingsLoadedRef.current) return;
    openFlowsyncDb()
      .then((db) => db.put("settings", { key: "boombox", workMusic, breakMusic, volume }))
      .catch((error) => console.log(error));
  }, [workMusic, breakMusic, volume]);

  useEffect(() => {
    if (!settingsLoadedRef.current) return;
    openFlowsyncDb()
      .then((db) => db.put("settings", { key: "timer", autoSwitch }))
      .catch((error) => console.log(error));
  }, [autoSwitch]);

  const navButtons = (
    <>
      <UserProfile />
      <BoomBox />
      <ThemeButton />
    </>
  );

  const githubButton = (
    <a
      href="https://github.com/zsaghir/flowsync"
      target="_blank"
      rel="noreferrer"
      aria-label="View source on GitHub"
      title="View source on GitHub"
      className="sketch-border-sm w-8 h-8 flex items-center justify-center shrink-0 border-2 border-[color:var(--ink)] bg-[var(--accent)] text-[var(--accent-text)] shadow-[3px_3px_0_var(--ink)] transition-all duration-150 hover:-translate-y-0.5 hover:scale-110 active:translate-y-0.5 active:shadow-none"
    >
      <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true" className="w-5 h-5">
        <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
      </svg>
    </a>
  );

  return (
    <SettingsContext.Provider
      value={{
        pomodoroTime,
        setPomodoroTime,
        breakTime,
        setBreakTime,
        autoSwitch,
        setAutoSwitch,
        workMusic,
        setWorkMusic,
        breakMusic,
        setBreakMusic,
        volume,
        setVolume,
      }}
    >
      <StopwatchRulesProvider>
        {/* Navbar — inline buttons on laptop, dropdown menu on phone */}
        <header className="w-full px-3 sm:px-6 py-2.5 sm:py-4 flex items-center justify-between gap-3 bg-[var(--surface)] [box-shadow:0_3px_0_var(--line-strong),0_6px_16px_rgba(0,0,0,0.15)] sticky top-0 z-50">
          <span className="pixel-font text-[var(--ink)] font-bold tracking-[0.15em] text-lg sm:text-2xl select-none shrink-0">
            FLOWSYNC
          </span>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Laptop: inline buttons */}
            <div className="nav-desktop items-center gap-3">
              {navButtons}
            </div>

            {/* Phone: menu tab reveals the buttons */}
            <div className="nav-phone relative">
              <Button
                bg={theme.accent}
                textColor={theme.accentText}
                borderColor={theme.ink}
                shadow={theme.ink}
                onClick={() => setMenuOpen((o) => !o)}
                aria-label="Menu"
              >
                {menuOpen ? "✕" : "☰"}
              </Button>
              {menuOpen && (
                <div className="absolute right-0 top-full mt-3 z-50 flex flex-col items-stretch gap-3 p-3 bg-[var(--surface)] border-[3px] border-[color:var(--ink)] shadow-[5px_5px_0_var(--ink)]">
                  {navButtons}
                </div>
              )}
            </div>

            {/* GitHub: always visible, always rightmost */}
            {githubButton}
          </div>
        </header>

        {/* Main Content — top-aligned on phones so the timer sits close
            under the navbar; vertically centered on larger screens. */}
        <div className="flex flex-col items-center justify-start sm:justify-center min-h-[calc(100svh-64px)] w-full px-3 sm:px-6 pt-8 pb-6 sm:py-10 gap-4 sm:gap-10 overflow-x-hidden">
          <Timer />
          <UserTasks />
        </div>
      </StopwatchRulesProvider>
    </SettingsContext.Provider>
  );
}
