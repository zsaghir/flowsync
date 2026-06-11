import { NextResponse } from "next/server";
import { dataDb } from "@/lib/server/db";
import { getAuthUserId } from "@/lib/server/auth";


export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = getAuthUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });


  const { id } = await params;
  const { data, nonce } = await req.json() as { data: Uint8Array | undefined, nonce: Uint8Array | undefined }

  if (!data || !nonce || !(data instanceof Uint8Array) || !(data instanceof Uint8Array))
    return NextResponse.json({ error: "Bad Request" }, { status: 400 });

  const update = dataDb.updateTask({ data, nonce, id, userId });
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
  if (!ok) return NextResponse.json({ error: "Not found" }, { status: 400 });
  return new NextResponse(null, { status: 204 });
}
