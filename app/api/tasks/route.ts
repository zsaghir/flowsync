import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { db } from "@/lib/db";
import { getAuthUserId } from "@/lib/auth";

export async function GET(req: Request) {
  const userId = getAuthUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json(db.getTasks(userId));
}

export async function POST(req: Request) {
  const userId = getAuthUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { title } = await req.json();
  if (!title?.trim()) return NextResponse.json({ error: "Title required" }, { status: 400 });

  const update = db.createTask({ id: randomUUID(), title: title.trim(), completed: false, userId });
  if (update.result.changes) { return NextResponse.json(update.task, { status: 201 }) } else throw Error("Unable to update task")
}
