import { NextResponse } from "next/server";
import { db } from "@/server/db";

export async function POST(req: Request) {

    try {
        const { username } = await req.json();

        const user = db.getUser(username);
        if (!user) {
            return NextResponse.json({ error: "Username Does not exist" }, { status: 400 });

        }

        return NextResponse.json({ salt: user.salt });
    } catch {
        throw Error
    }
}


