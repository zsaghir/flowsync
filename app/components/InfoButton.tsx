"use client";

import { useState } from "react";
import { Popup, Button } from "pixel-retroui";
import { useTheme } from "./ThemeContext";
import { useStopwatchRules } from "./Contexts";

const InfoButton = () => {
  const { theme } = useTheme();
  const { rules } = useStopwatchRules();
  const [isOpen, setIsOpen] = useState(false);
  const sortedRules = [...rules].sort((a, b) => a.minMinutes - b.minMinutes);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label="How to use"
        title="How to use"
        className="sketch-border-sm w-8 h-8 flex items-center justify-center border-2 border-[color:var(--ink)] bg-[var(--accent)] text-[var(--accent-text)] text-base font-extrabold cursor-pointer shadow-[3px_3px_0_var(--ink)] transition-all duration-100 hover:-translate-y-0.5 hover:scale-110 active:translate-y-0.5 active:shadow-none"
      >
        ?
      </button>

      <Popup isOpen={isOpen} onClose={() => setIsOpen(false)}>
        <div className="flex flex-col bg-[var(--bg)] border-[3px] border-[color:var(--ink)] shadow-[6px_6px_0_var(--ink)] w-[min(26rem,92vw)] max-w-full max-h-[calc(100svh-6.5rem)] overflow-hidden rounded-xl">
          <div className="bg-[var(--ink)] px-4 py-2 shrink-0">
            <h2 className="pixel-font text-sm font-bold text-[var(--bg)] tracking-[0.25em]">? HOW TO USE</h2>
          </div>

          <div className="flex flex-col gap-6 p-5 sm:p-7 min-h-0 overflow-y-auto text-[var(--ink)]">
            <section>
              <h3 className="text-xs font-extrabold tracking-widest border-b-2 border-[color:var(--ink)]/25 pb-1.5 mb-3">
                STOPWATCH — WORK FIRST, EARN A BREAK
              </h3>
              <ol className="text-xs font-semibold leading-relaxed space-y-2.5">
                <li className="flex gap-2.5">
                  <span className="shrink-0 w-5 h-5 flex items-center justify-center bg-[var(--accent)] text-[var(--accent-text)] border border-[color:var(--ink)] font-extrabold">1</span>
                  <span>Press START and work as long as you can.</span>
                </li>
                <li className="flex gap-2.5">
                  <span className="shrink-0 w-5 h-5 flex items-center justify-center bg-[var(--accent)] text-[var(--accent-text)] border border-[color:var(--ink)] font-extrabold">2</span>
                  <span>Press STOP when you're done — you'll see the break you earned.</span>
                </li>
                <li className="flex gap-2.5">
                  <span className="shrink-0 w-5 h-5 flex items-center justify-center bg-[var(--accent)] text-[var(--accent-text)] border border-[color:var(--ink)] font-extrabold">3</span>
                  <span>Press START BREAK to take it. When the break ends, you're back on the stopwatch.</span>
                </li>
                <li className="flex gap-2.5">
                  <span className="shrink-0 w-5 h-5 flex items-center justify-center bg-[var(--accent)] text-[var(--accent-text)] border border-[color:var(--ink)] font-extrabold">4</span>
                  <span>EDIT changes how much break each work stretch earns.</span>
                </li>
              </ol>
            </section>

            <section>
              <h3 className="text-xs font-extrabold tracking-widest border-b-2 border-[color:var(--ink)]/25 pb-1.5 mb-3">
                YOUR BREAK RULES RIGHT NOW
              </h3>
              <div className="border-2 border-[color:var(--ink)]/40">
                {sortedRules.map((rule, i) => (
                  <div
                    key={rule.id}
                    className={`flex justify-between gap-3 px-3 py-2 text-xs font-semibold border-b-2 border-[color:var(--ink)]/20 last:border-none ${
                      i % 2 === 1 ? "bg-[var(--surface)]/50" : ""
                    }`}
                  >
                    <span>Worked ≥ {rule.minMinutes} min</span>
                    <span className="tabular-nums font-extrabold">{rule.breakMinutes} min break</span>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h3 className="text-xs font-extrabold tracking-widest border-b-2 border-[color:var(--ink)]/25 pb-1.5 mb-3">
                POMODORO
              </h3>
              <p className="text-xs font-semibold leading-relaxed">
                Classic fixed focus blocks. EDIT sets the pomodoro and break lengths —
                turn on auto-switch there to roll into the break (and back) automatically.
              </p>
            </section>

            <section>
              <h3 className="text-xs font-extrabold tracking-widest border-b-2 border-[color:var(--ink)]/25 pb-1.5 mb-3">
                SOUND
              </h3>
              <p className="text-xs font-semibold leading-relaxed">
                BoomBox tracks only play while a timer is running.
              </p>
            </section>

            <div className="pt-1">
              <Button
                bg={theme.accent}
                textColor={theme.accentText}
                borderColor={theme.ink}
                shadow={theme.ink}
                onClick={() => setIsOpen(false)}
              >
                Got it
              </Button>
            </div>
          </div>
        </div>
      </Popup>
    </>
  );
};

export default InfoButton;
