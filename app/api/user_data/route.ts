import { NextResponse } from "next/server";
import { dataDb } from "@/lib/server/db";
import { getAuthUserId } from "@/lib/server/auth";
import { DataCipher, DataCipherSchema } from "@/lib/server/db";
import { ErrorResponses } from "@/lib/server/error";

export function GET(req: Request) {
  const userId = getAuthUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  console.log("Trying to get the data")
  const data = dataDb.getUserData(userId)
  if (data) {
    return NextResponse.json(data)
  }
  return NextResponse.json({})
}

export async function PUT(req: Request) {

  const userId = getAuthUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const json = DataCipherSchema.safeParse(await req.json())
  if (!json.success) return ErrorResponses.BadRequest
  dataDb.saveUserData({ ...json.data, userId });
  return NextResponse.json({ ok: true });

}
