"use client";

import { useContext, useState, useSyncExternalStore } from "react";
import { SettingsContext } from "./Contexts";
import { Popup, Button } from "pixel-retroui";
import { useTheme } from "./ThemeContext";
import { getTimerStatus, subscribeTimerStatus } from "./timerStatus";

// Noise and nature loops are self-hosted mp3s (Safari friendly) that the
// player loops. Radio entries are endless SomaFM live streams (also mp3).
const TRACKS = {
  brown: { label: "Brown-Noise", value: "/sounds/brown-noise.mp3" },
  white: { label: "White-Noise", value: "/sounds/white-noise.mp3" },
  pink: { label: "Pink-Noise", value: "/sounds/pink-noise.mp3" },
  rain: { label: "Rain", value: "/sounds/rain.mp3" },
  thunder: { label: "Thunderstorm", value: "/sounds/thunderstorm.mp3" },
  ocean: { label: "Ocean-Waves", value: "/sounds/ocean.mp3" },
  cafe: { label: "Café-Chatter", value: "/sounds/cafe.mp3" },
  fire: { label: "Fireplace", value: "/sounds/fireplace.mp3" },
  groove: { label: "Groove-Salad", value: "https://ice1.somafm.com/groovesalad-128-mp3" },
  fluid: { label: "Fluid-Beats", value: "https://ice1.somafm.com/fluid-128-mp3" },
  drone: { label: "Drone-Zone", value: "https://ice1.somafm.com/dronezone-128-mp3" },
  space: { label: "Deep-Space-One", value: "https://ice1.somafm.com/deepspaceone-128-mp3" },
  lush: { label: "Lush", value: "https://ice1.somafm.com/lush-128-mp3" },
  defcon: { label: "DEF-CON", value: "https://ice1.somafm.com/defcon-128-mp3" },
};

// Same tracks in both columns, ordered by what suits each mode best.
const WORK_SUGGESTED = [
  TRACKS.brown, TRACKS.fluid, TRACKS.groove, TRACKS.drone, TRACKS.space,
  TRACKS.defcon, TRACKS.white, TRACKS.pink,
  TRACKS.rain, TRACKS.cafe, TRACKS.lush, TRACKS.fire, TRACKS.ocean, TRACKS.thunder,
];

const BREAK_SUGGESTED = [
  TRACKS.rain, TRACKS.ocean, TRACKS.fire, TRACKS.cafe, TRACKS.lush,
  TRACKS.thunder, TRACKS.groove, TRACKS.fluid, TRACKS.space, TRACKS.drone,
  TRACKS.brown, TRACKS.pink, TRACKS.white, TRACKS.defcon,
];

function TrackRow({
  index,
  label,
  selected,
  onToggle,
}: {
  index: number;
  label: string;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`w-full flex items-center gap-2 whitespace-nowrap border-2 border-[color:var(--ink)] px-2 py-1.5 text-xs font-bold cursor-pointer select-none transition-all duration-100 active:translate-y-0.5 ${
        selected
          ? "bg-[var(--accent)] text-[var(--accent-text)] shadow-[2px_2px_0_var(--ink)]"
          : "bg-[var(--bg)] text-[var(--ink)] hover:bg-[var(--surface)]"
      }`}
    >
      <span className="opacity-60 tabular-nums w-5 text-right shrink-0">{index}.</span>
      <span className="truncate">{label}</span>
      {selected && <span className="ml-auto shrink-0">✓</span>}
    </button>
  );
}

function TrackPicker({
  title,
  hint,
  active,
  options,
  selection,
  onChange,
}: {
  title: string;
  hint: string;
  active: boolean;
  options: { label: string; value: string }[];
  selection: string;
  onChange: (next: string) => void;
}) {
  const hasTrack = selection !== "None" && Boolean(selection);

  return (
    <section className="flex flex-col gap-2 border-2 border-[color:var(--ink)]/30 p-3 bg-[var(--bg)]/40">
      <div className="flex justify-between items-baseline gap-2">
        <h3 className="text-sm font-extrabold tracking-widest text-[var(--ink)]">{title}</h3>
        {hasTrack && (
          <button
            type="button"
            onClick={() => onChange("None")}
            className="text-[10px] font-bold underline text-[var(--ink)]/70 hover:text-[var(--ink)]"
          >
            Clear
          </button>
        )}
      </div>
      <p className="text-[10px] text-[var(--ink)]/60 -mt-1">{hint} · one track at a time, sorted by our suggestion</p>

      {!hasTrack ? (
        <p className="self-start text-[10px] font-extrabold tracking-widest px-2 py-1 border-2 border-[color:var(--ink)]/40 text-[var(--ink)]/60">
          SILENT — NOTHING SELECTED
        </p>
      ) : active ? (
        <p className="self-start text-[10px] font-extrabold tracking-widest px-2 py-1 bg-[var(--accent)] text-[var(--accent-text)] border-2 border-[color:var(--ink)]">
          ▶ PLAYING NOW
        </p>
      ) : (
        <p className="self-start text-[10px] font-extrabold tracking-widest px-2 py-1 bg-[var(--surface)] text-[var(--ink)]/80 border-2 border-[color:var(--ink)]/40">
          ⏸ MUTED — PLAYS WHEN TIMER RUNS
        </p>
      )}

      <ol className="flex flex-col gap-1.5 max-h-52 overflow-y-auto pr-1">
        {options.map((opt, i) => (
          <li key={opt.value}>
            <TrackRow
              index={i + 1}
              label={opt.label}
              selected={selection === opt.value}
              onToggle={() => onChange(selection === opt.value ? "None" : opt.value)}
            />
          </li>
        ))}
      </ol>
    </section>
  );
}

const BoomBox = () => {
  const settings = useContext(SettingsContext)!;
  const { theme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const timerStatus = useSyncExternalStore(subscribeTimerStatus, getTimerStatus, getTimerStatus);
  const workActive = timerStatus.isRunning && timerStatus.mode !== "break";
  const breakActive = timerStatus.isRunning && timerStatus.mode === "break";

  return (
    <div className="flex items-center">
      <Button
        bg={theme.accent}
        textColor={theme.accentText}
        borderColor={theme.ink}
        shadow={theme.ink}
        onClick={() => setIsOpen(true)}
        className="transition-transform duration-300 ease-in-out hover:-translate-y-1 hover:scale-110 tracking-widest"
      >
        BOOMBOX
      </Button>

      <Popup isOpen={isOpen} onClose={() => setIsOpen(false)}>
        <div className="flex flex-col bg-[var(--card)] border-[3px] border-[color:var(--ink)] shadow-[6px_6px_0_var(--ink)] w-[min(44rem,94vw)] max-w-full max-h-[calc(100svh-6.5rem)] overflow-hidden rounded-xl">
          <div className="bg-[var(--ink)] px-4 py-2 shrink-0">
            <h2 className="pixel-font text-sm font-bold text-[var(--bg)] tracking-[0.25em]">♪ BOOMBOX</h2>
          </div>

          <div className="flex flex-col gap-4 p-4 sm:p-5 min-h-0 overflow-y-auto">
            <p className="text-xs text-[var(--ink)]/80 -mt-1">
              Changes apply instantly. Audio only plays while the timer is running.
            </p>

            <div className="grid sm:grid-cols-2 gap-4">
              <TrackPicker
                title="WORK"
                hint="Plays during pomodoro & stopwatch"
                active={workActive}
                options={WORK_SUGGESTED}
                selection={settings.workMusic}
                onChange={settings.setWorkMusic}
              />
              <TrackPicker
                title="BREAK"
                hint="Plays during breaks"
                active={breakActive}
                options={BREAK_SUGGESTED}
                selection={settings.breakMusic}
                onChange={settings.setBreakMusic}
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-sm font-bold text-[var(--ink)]">Volume</label>
                <span className="text-sm text-[var(--ink)] font-semibold tabular-nums">
                  {Math.round(settings.volume * 100)}%
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={Math.round(settings.volume * 100)}
                onChange={(e) => settings.setVolume(Number(e.target.value) / 100)}
                className="w-full accent-[var(--accent)]"
              />
            </div>

            <div className="flex items-end justify-between gap-2">
              <Button
                bg={theme.accent}
                textColor={theme.accentText}
                borderColor={theme.ink}
                shadow={theme.ink}
                onClick={() => setIsOpen(false)}
              >
                Done
              </Button>
              <p className="text-[10px] text-[var(--ink)]/60">
                Radio streams by{" "}
                <a href="https://somafm.com" target="_blank" rel="noreferrer" className="underline">
                  SomaFM.com
                </a>
              </p>
            </div>
          </div>
        </div>
      </Popup>
    </div>
  );
};

export default BoomBox;
