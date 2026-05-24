import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/server/db";
import { signToken } from "@/server/auth";

export async function POST(req: Request) {
  const { email, password } = await req.json();

  const user = db.getUser(email);
  const valid = user && (await bcrypt.compare(password, user.passwordHash));

  if (!valid)
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });

  return NextResponse.json({
    token: signToken(user.id),
    user: { id: user.id, email: user.email },
  });
}
