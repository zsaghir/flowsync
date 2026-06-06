import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { getAuthUserId } from "@/server/auth";

let taskChanges = {} as { title: String | null, completed: number | null }
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = getAuthUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const patch = await req.json();

  if ("title" in patch && typeof patch.title === 'string') taskChanges.title = patch.title
  if ("completed" in patch && typeof patch.completed === 'boolean') taskChanges.completed = Number(patch.completed)

  const update = db.updateTask(taskChanges, id, userId);
  if (update.changes = 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return new NextResponse(null, { status: 204 });
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = getAuthUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const ok = db.deleteTask(id, userId);
  if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return new NextResponse(null, { status: 204 });
}
