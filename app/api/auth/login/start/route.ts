import { NextResponse } from "next/server";
import { db } from "@/server/db";
import crypto from "crypto"
export async function POST(req: Request) {

    try {
        const { username } = await req.json();
        const hashedUsername = crypto.createHash('sha256').update(username).digest('base64')

        const user = db.getUser(hashedUsername);
        if (!user) {
            return NextResponse.json({ error: "Username Does not exist" }, { status: 400 });

        }

        return NextResponse.json({ salt: user.salt });
    } catch {
        throw Error
    }
}


