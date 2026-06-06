import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { db } from "@/lib/db";
import { signToken, usernameIntoBase64, passwordIntoBase64 } from "@/lib/auth";


export async function POST(req: Request) {
    const { username, authKey, salt, wrappedDataKey, nonce } = await req.json();

    if (!username || !authKey || !salt || !wrappedDataKey || !nonce)
        return NextResponse.json({ error: "username and password required" }, { status: 400 });

    const hashedUsername = usernameIntoBase64(username)



    const passwordHash = passwordIntoBase64(authKey)


    const createUser = db.createUser(randomUUID(), hashedUsername, passwordHash, wrappedDataKey, salt, nonce);


    if (createUser.ok) {
        return NextResponse.json({
            token: signToken(createUser.value.id),
            user: { id: createUser.value.id, username: createUser.value.username }
        })
    } else {
        return NextResponse.json({ error: "username already registered" }, { status: 409 });
    }
}

