import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { signToken, passwordIntoBase64, verifyPassword, usernameIntoBase64 } from "@/lib/auth";

export async function POST(req: Request) {

  const { username, authKey } = await req.json();
  const hashedUsername = usernameIntoBase64(username)
  const user = db.getUser(hashedUsername);
  if (!user) {
    return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });

  }
  const valid = verifyPassword(authKey, user.passwordHash)

  if (!valid)
    return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });

  return NextResponse.json({
    token: signToken(user.id),
    user: { id: user.id, username: user.username },
  });

}
