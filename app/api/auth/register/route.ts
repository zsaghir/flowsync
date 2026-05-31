import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { db } from "@/server/db";
import { signToken } from "@/server/auth";

export async function POST(req: Request) {
  const { username, password } = await req.json();

  if (!username || !password)
    return NextResponse.json({ error: "username and password required" }, { status: 400 });

  if (db.getUser(username))
    return NextResponse.json({ error: "username already registered" }, { status: 409 });

  const passwordHash = await bcrypt.hash(password, 10);
  const user = { id: randomUUID(), username, passwordHash };
  db.createUser(user);

  return NextResponse.json({
    token: signToken(user.id),
    user: { id: user.id, username: user.username },
  });
}
