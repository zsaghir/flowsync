// Tiny external store so other components (BoomBox) can show live
// timer state without lifting Timer's internals into a context.
export type TimerStatus = {
  mode: "pomodoro" | "break" | "stopwatch";
  isRunning: boolean;
};

let current: TimerStatus = { mode: "stopwatch", isRunning: false };
const listeners = new Set<() => void>();

export function setTimerStatus(next: TimerStatus) {
  current = next;
  listeners.forEach((listener) => listener());
}

export function getTimerStatus() {
  return current;
}

export function subscribeTimerStatus(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
