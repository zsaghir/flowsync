import fs from "fs";
import path from "path";

const DB_PATH = path.join(process.cwd(), "data", "db.json");

export type User       = { id: string; email: string; passwordHash: string };
export type Task       = { id: string; title: string; completed: boolean; userId: string };
export type TimerState = {
  userId:    string;
  mode:      "pomodoro" | "break" | "stopwatch";
  seconds:   number;   // remaining for countdown; elapsed for stopwatch
  isRunning: boolean;
  lastSaved: number;   // Date.now() ms — used to recalculate on resume
};

type DB = { users: User[]; tasks: Task[]; timers: TimerState[] };

function read(): DB {
  try {
    return JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));
  } catch {
    return { users: [], tasks: [], timers: [] };
  }
}

function write(data: DB) {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

export const db = {
  getUser:     (email: string) => read().users.find((u) => u.email === email) ?? null,
  getUserById: (id: string)    => read().users.find((u) => u.id === id) ?? null,
  createUser:  (user: User)    => { const d = read(); d.users.push(user); write(d); },

  getTasks:   (userId: string) => read().tasks.filter((t) => t.userId === userId),
  createTask: (task: Task)     => { const d = read(); d.tasks.push(task); write(d); return task; },

  updateTask: (id: string, userId: string, patch: Partial<Task>) => {
    const d = read();
    const i = d.tasks.findIndex((t) => t.id === id && t.userId === userId);
    if (i === -1) return null;
    d.tasks[i] = { ...d.tasks[i], ...patch };
    write(d);
    return d.tasks[i];
  },

  deleteTask: (id: string, userId: string) => {
    const d = read();
    const i = d.tasks.findIndex((t) => t.id === id && t.userId === userId);
    if (i === -1) return false;
    d.tasks.splice(i, 1);
    write(d);
    return true;
  },

  getTimer: (userId: string): TimerState | null =>
    read().timers?.find((t) => t.userId === userId) ?? null,

  saveTimer: (state: TimerState) => {
    const d = read();
    if (!d.timers) d.timers = [];
    const i = d.timers.findIndex((t) => t.userId === state.userId);
    if (i >= 0) d.timers[i] = state; else d.timers.push(state);
    write(d);
  },
};
