"use client";
import { Button } from "pixel-retroui";

function getBreakMinutes(elapsedSeconds: number): number {
  const m = elapsedSeconds / 60;
  if (m < 25) return 5;
  if (m < 30) return 6;
  if (m < 40) return 10;
  if (m < 60) return 15;
  return 20;
}

function formatElapsed(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0)
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

interface StopwatchProps {
  elapsed:      number;
  running:      boolean;
  onStart:      () => void;
  onStop:       () => void;
  onReset:      () => void;
  onStartBreak: (minutes: number) => void;
}

export default function Stopwatch({ elapsed, running, onStart, onStop, onReset, onStartBreak }: StopwatchProps) {
  const stopped      = elapsed > 0 && !running;
  const breakMinutes = stopped ? getBreakMinutes(elapsed) : null;
  const workedMin    = Math.floor(elapsed / 60);
  const workedSec    = elapsed % 60;

  return (
    <div className="flex flex-col items-center">
      <p className="text-[clamp(3.25rem,18vw,8rem)] sm:text-9xl font-extrabold my-4 tracking-normal sm:tracking-widest leading-none">
        {formatElapsed(elapsed)}
      </p>

      <div className="flex flex-wrap justify-center gap-3">
        {!running ? (
          <Button bg="#D6A99D" textColor="#30210b" borderColor="#30210b" shadow="#30210b"
            className="transition-transform duration-300 ease-in-out hover:-translate-y-1 hover:scale-110"
            onClick={onStart}>
            {elapsed === 0 ? "START" : "RESUME"}
          </Button>
        ) : (
          <Button bg="#D6A99D" textColor="#30210b" borderColor="#30210b" shadow="#30210b"
            className="transition-transform duration-300 ease-in-out hover:-translate-y-1 hover:scale-110"
            onClick={onStop}>
            STOP
          </Button>
        )}
        {elapsed > 0 && (
          <Button bg="#D6DAC8" textColor="#30210b" borderColor="#30210b" shadow="#30210b"
            className="transition-transform duration-300 ease-in-out hover:-translate-y-1 hover:scale-110"
            onClick={onReset}>
            RESET
          </Button>
        )}
      </div>

      {breakMinutes !== null && (
        <div className="mt-6 flex flex-col items-center gap-3 px-2 text-center">
          <p className="text-sm font-semibold text-[#30210b]">
            Worked {workedMin > 0 ? `${workedMin}m ` : ""}
            {workedSec > 0 || workedMin === 0 ? `${workedSec}s` : ""} — {breakMinutes}m break earned
          </p>
          <Button bg="#9CAFAA" textColor="#30210b" borderColor="#30210b" shadow="#30210b"
            className="transition-transform duration-300 ease-in-out hover:-translate-y-1 hover:scale-110"
            onClick={() => onStartBreak(breakMinutes)}>
            START {breakMinutes}m BREAK
          </Button>
        </div>
      )}
    </div>
  );
}
