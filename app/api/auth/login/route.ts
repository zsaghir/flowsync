import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/server/db";
import { signToken } from "@/server/auth";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const { username, authKey } = await req.json();

    const user = db.getUser(username);
    if (!user) {
      return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });

    }
    const candidate = crypto.createHash('sha256')
      .update(authKey).digest('base64');

    const a = Buffer.from(candidate, "utf8");
    const b = Buffer.from(user.passwordHash, "utf8");
    const valid = a.length === b.length && crypto.timingSafeEqual(a, b); //This makes sure the time to compare is same

    if (!valid)
      return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });

    return NextResponse.json({
      token: signToken(user.id),
      user: { id: user.id, username: user.username },
    });
  } catch {
    return NextResponse.json({ error: "Servver Error" }, { status: 500 })
  }
}
