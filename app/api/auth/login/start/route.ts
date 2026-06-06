import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { usernameIntoBase64 } from "@/lib/auth"
export async function POST(req: Request) {

    try {
        const { username } = await req.json();
        const hashedUsername = usernameIntoBase64(username)

        const user = db.getUserSalt(hashedUsername);
        if (!user) {
            return NextResponse.json({ error: "Username Does not exist" }, { status: 400 });
        }
        return NextResponse.json({ salt: user.salt });
    } catch (error) {
        throw error
    }
}


