import { NextResponse } from "next/server";
import { authDb } from "@/lib/server/db";
import { usernameIntoBase64 } from "@/lib/server/auth"
export async function POST(req: Request) {

    try {
        const { username } = await req.json();
        const hashedUsername = usernameIntoBase64(username)

        const user = authDb.getUserSalt(hashedUsername);
        if (!user) {
            return NextResponse.json({ error: "Username Does not exist" }, { status: 400 });
        }
        return NextResponse.json({ salt: user.salt });
    } catch (error) {
        throw error
    }
}


