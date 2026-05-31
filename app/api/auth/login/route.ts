import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/server/db";
import { signToken } from "@/server/auth";

export async function POST(req: Request) {
  const { username, password } = await req.json();

  const user = db.getUser(username);
  const valid = user && (await bcrypt.compare(password, user.passwordHash));

  if (!valid)
    return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });

  return NextResponse.json({
    token: signToken(user.id),
    user: { id: user.id, email: user.username },
  });
}
