import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { dataDb } from "@/lib/server/db";
import { getAuthUserId } from "@/lib/server/auth";

export async function GET(req: Request) {
  const userId = getAuthUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json(dataDb.getTasks(userId));
}

export async function POST(req: Request) {
  const userId = getAuthUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, nonce } = await req.json() as { data: Uint8Array, nonce: Uint8Array };
  if (!data || !nonce || !(data instanceof Uint8Array) || !(data instanceof Uint8Array))
    return NextResponse.json({ error: "Bad Request" }, { status: 400 });

  const update = dataDb.createTask({ id: randomUUID(), userId, data, nonce });
  if (update.result.changes) { return NextResponse.json(update.task, { status: 201 }) } else throw Error("Unable to update task")
}
