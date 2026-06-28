import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { dataDb } from "@/lib/server/db";
import { getAuthUserId } from "@/lib/server/auth";
import { NewTask, CreateTaskSchema } from "@/lib/server/db";

export async function GET(req: Request) {
  const userId = getAuthUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json(dataDb.getTasks(userId));
}

export async function POST(req: Request) {
  const userId = getAuthUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const _json = await req.json() as unknown
  const json = CreateTaskSchema.safeParse(_json)
  if (!json.success) return NextResponse.json({ error: "Bad Request" }, { status: 400 });

  const update = dataDb.createTask({ id: randomUUID(), ...json.data, userId });
  if (update.result.changes) { return NextResponse.json(update.task, { status: 201 }) } else throw Error("Unable to update task")
}
