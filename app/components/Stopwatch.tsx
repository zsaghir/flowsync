"use client";
import { useState } from "react";
import { Button, Popup } from "pixel-retroui";
import { useStopwatchRules, type BreakRule } from "./Contexts";
import { useTheme } from "./ThemeContext";

function formatElapsed(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0)
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

interface StopwatchProps {
  elapsed: number;
  running: boolean;
  onStart: () => void;
  onStop: () => void;
  onReset: () => void;
  onStartBreak: (minutes: number) => void;
}

export default function Stopwatch({ elapsed, running, onStart, onStop, onReset, onStartBreak }: StopwatchProps) {
  const { theme } = useTheme();
  const { getBreakMinutes } = useStopwatchRules();
  const stopped = elapsed > 0 && !running;
  const breakMinutes = stopped ? getBreakMinutes(elapsed) : null;
  const workedMin = Math.floor(elapsed / 60);
  const workedSec = elapsed % 60;

  return (
    <div className="flex flex-col items-center">
      <p className="text-[clamp(3.25rem,18vw,8rem)] sm:text-9xl font-extrabold my-4 tracking-normal sm:tracking-widest leading-none text-[var(--ink)]">
        {formatElapsed(elapsed)}
      </p>

      <div className="flex flex-wrap justify-center gap-3">
        {!running ? (
          <Button bg={theme.accent} textColor={theme.accentText} borderColor={theme.ink} shadow={theme.ink}
            className="transition-transform duration-300 ease-in-out hover:-translate-y-1 hover:scale-110"
            onClick={onStart}>
            {elapsed === 0 ? "START" : "RESUME"}
          </Button>
        ) : (
          <Button bg={theme.accent} textColor={theme.accentText} borderColor={theme.ink} shadow={theme.ink}
            className="transition-transform duration-300 ease-in-out hover:-translate-y-1 hover:scale-110"
            onClick={onStop}>
            STOP
          </Button>
        )}
        {elapsed > 0 && (
          <Button bg={theme.surface} textColor={theme.ink} borderColor={theme.ink} shadow={theme.ink}
            className="pixel-outline transition-transform duration-300 ease-in-out hover:-translate-y-1 hover:scale-110"
            onClick={onReset}>
            RESET
          </Button>
        )}
        <SetBreakMinutes />
      </div>

      {breakMinutes !== null && (
        <div className="mt-6 flex flex-col items-center gap-3 px-2 text-center">
          <p className="text-sm font-bold text-[var(--ink)] bg-[var(--bg)] border-2 border-[color:var(--ink)] shadow-[3px_3px_0_var(--ink)] px-3 py-1.5">
            Worked {workedMin > 0 ? `${workedMin}m ` : ""}
            {workedSec > 0 || workedMin === 0 ? `${workedSec}s` : ""} — {breakMinutes}m break earned
          </p>
          <Button bg={theme.accent} textColor={theme.accentText} borderColor={theme.ink} shadow={theme.ink}
            className="transition-transform duration-300 ease-in-out hover:-translate-y-1 hover:scale-110"
            onClick={() => onStartBreak(breakMinutes)}>
            START {breakMinutes}m BREAK
          </Button>
        </div>
      )}
    </div>
  );
}

export function SetBreakMinutes() {
  const { theme } = useTheme();
  const { rules, setRules } = useStopwatchRules();
  const [isOpen, setIsOpen] = useState(false);
  const [temp, setTemp] = useState<BreakRule[]>(rules);

  const open = () => {
    setTemp(rules);
    setIsOpen(true);
  };
  const close = () => setIsOpen(false);

  const updateRule = (id: string, field: "minMinutes" | "breakMinutes", value: number) =>
    setTemp((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)));

  const addRule = () =>
    setTemp((prev) => [...prev, { id: crypto.randomUUID(), minMinutes: 0, breakMinutes: 5 }]);

  const removeRule = (id: string) => setTemp((prev) => prev.filter((r) => r.id !== id));

  const save = () => {
    setRules(temp);
    close();
  };

  return (
    <div className="flex items-center">
      <Button bg={theme.surface} textColor={theme.ink} borderColor={theme.ink} shadow={theme.ink}
        className="pixel-outline transition-transform duration-300 ease-in-out hover:-translate-y-1 hover:scale-110"
        onClick={open}>
        EDIT
      </Button>

      <Popup isOpen={isOpen} onClose={close}>
        <div className="flex flex-col bg-[var(--bg)] border-[3px] border-[color:var(--ink)] shadow-[6px_6px_0_var(--ink)] w-[min(24rem,90vw)] max-w-full max-h-[calc(100svh-6.5rem)] overflow-hidden">
          <div className="bg-[var(--ink)] px-4 py-2 shrink-0">
            <h2 className="pixel-font text-sm font-bold text-[var(--bg)] tracking-[0.25em]">☕ BREAK RULES</h2>
          </div>
          <div className="flex flex-col space-y-4 p-4 sm:p-5 min-h-0 overflow-y-auto">
          <p className="text-xs text-[var(--ink)]/70">
            Work at least this many minutes to earn the matching break. The lowest threshold applies below all others.
          </p>

          <div className="max-h-72 overflow-y-auto flex flex-col gap-3 pr-1">
            {temp.map((rule) => (
              <div key={rule.id} className="flex items-end gap-2 bg-[var(--surface)]/60 border-2 border-[color:var(--ink)]/20 p-2">
                <label className="flex-1 text-xs font-bold text-[var(--ink)]">
                  Worked ≥ (min)
                  <input
                    type="number"
                    min={0}
                    value={rule.minMinutes}
                    onChange={(e) => updateRule(rule.id, "minMinutes", Number(e.target.value))}
                    className="mt-1 w-full p-2 bg-[var(--bg)] border-2 border-[color:var(--ink)] text-[var(--ink)] font-semibold focus:outline-none focus:bg-[var(--surface)]"
                  />
                </label>
                <label className="flex-1 text-xs font-bold text-[var(--ink)]">
                  Break (min)
                  <input
                    type="number"
                    min={0}
                    value={rule.breakMinutes}
                    onChange={(e) => updateRule(rule.id, "breakMinutes", Number(e.target.value))}
                    className="mt-1 w-full p-2 bg-[var(--bg)] border-2 border-[color:var(--ink)] text-[var(--ink)] font-semibold focus:outline-none focus:bg-[var(--surface)]"
                  />
                </label>
                <button
                  onClick={() => removeRule(rule.id)}
                  className="p-2 hover:scale-110 transition"
                  aria-label="Remove rule"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                  </svg>
                </button>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button bg={theme.surface} textColor={theme.ink} borderColor={theme.ink} shadow={theme.ink} onClick={addRule}>
              Add Rule
            </Button>
            <Button bg={theme.accent} textColor={theme.accentText} borderColor={theme.ink} shadow={theme.ink} onClick={save}>
              Save
            </Button>
            <Button bg={theme.surface} textColor={theme.ink} borderColor={theme.ink} shadow={theme.ink} onClick={close}>
              Cancel
            </Button>
          </div>
          </div>
        </div>
      </Popup>
    </div>
  );
}
