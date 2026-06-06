import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { getAuthUserId } from "@/server/auth";

export async function GET(req: Request) {
  const userId = getAuthUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const TimerState = db.getTimer(userId)
  if (TimerState) {
    TimerState.isRunning = TimerState.is_running
    TimerState.lastSaved = TimerState.last_saved
    return NextResponse.json(TimerState)
  }
  return NextResponse.json({})
}

export async function PUT(req: Request) {
  const userId = getAuthUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { mode, seconds, isRunning, lastSaved } = await req.json() as { mode: "pomodoro" | "break" | "stopwatch", seconds: number, isRunning: number, lastSaved: number }
  db.saveTimer({ mode, seconds, isRunning, lastSaved }, userId);
  return NextResponse.json({ ok: true });
}
