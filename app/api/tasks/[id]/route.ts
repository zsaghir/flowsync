import { NextResponse } from "next/server";
import { dataDb } from "@/lib/server/db";
import { getAuthUserId } from "@/lib/server/auth";
import z from "zod"

const PatchTaskSchema = z.object({
  data: z.string(),
  nonce: z.string()
})

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = getAuthUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });


  const { id } = await params;
  const json = PatchTaskSchema.safeParse(await req.json())
  if (!json.success) return NextResponse.json({ error: "Bad Request" }, { status: 400 });

  const update = dataDb.updateTask({ id, userId, ...json.data });
  if (!update.changes) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return new NextResponse(null, { status: 204 });
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = getAuthUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const ok = dataDb.deleteTask(id, userId);
  if (!ok.changes) return NextResponse.json({ error: "Not found" }, { status: 400 });
  return new NextResponse(null, { status: 204 });
}
