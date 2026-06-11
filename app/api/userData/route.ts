import { NextResponse } from "next/server";
import { dataDb } from "@/lib/server/db";
import { getAuthUserId } from "@/lib/server/auth";

export function GET(req: Request) {
  const userId = getAuthUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const TimerState = dataDb.getUserData(userId)
  if (TimerState) {
    return NextResponse.json(TimerState)
  }
  return NextResponse.json({})
}

export async function PUT(req: Request) {
  const userId = getAuthUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data, nonce } = await req.json() as { data: Uint8Array, nonce: Uint8Array }
  dataDb.saveUserData(data, nonce, userId);
  return NextResponse.json({ ok: true });
}
