import { NextResponse } from "next/server";
import { authDb } from "@/lib/server/db";
import { verifyPassword, usernameIntoBase64, generateFamily } from "@/lib/server/auth";

export async function POST(req: Request) {

  const { username, authKey } = await req.json();
  const hashedUsername = usernameIntoBase64(username)
  const user = authDb.getUser(hashedUsername);
  if (!user) {
    return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });

  }
  const valid = verifyPassword(authKey, user.passwordHash)

  if (!valid) return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });

  const { accessToken, refreshToken } = generateFamily(user.id)

  const res = NextResponse.json({
    accessToken,
    user: { id: user.id, username: username.trim().toLowerCase() },
  });

  res.cookies.set("refreshToken", refreshToken, {
    httpOnly: true,
    secure: false, //only during testing: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30,
    path: "/api/auth"
  });

  return res
}
