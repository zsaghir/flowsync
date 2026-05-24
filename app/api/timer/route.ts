import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { getAuthUserId } from "@/server/auth";

export async function GET(req: Request) {
  const userId = getAuthUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json(db.getTimer(userId));
}

export async function PUT(req: Request) {
  const userId = getAuthUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { mode, seconds, isRunning, lastSaved } = await req.json();
  db.saveTimer({ userId, mode, seconds, isRunning, lastSaved });
  return NextResponse.json({ ok: true });
}
