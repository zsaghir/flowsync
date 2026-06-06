import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { db } from "@/server/db";
import { signToken } from "@/server/auth";
import crypto from "crypto";

export async function POST(req: Request) {
    const { username, authKey, salt, wrappedDataKey, nonce } = await req.json();

    if (!username || !authKey || !salt || !wrappedDataKey)
        return NextResponse.json({ error: "username and password required" }, { status: 400 });

    console.log("They auth key is ", authKey, " type: ", typeof (authKey));
    console.log("The data Key is ", wrappedDataKey)
    const hashedUsername = crypto.createHash('sha256')
        .update(username)
        .digest('base64')
    console.log("The salt is ", salt)
    if (db.getUser(hashedUsername))
        return NextResponse.json({ error: "username already registered" }, { status: 409 });

    const passwordHash = crypto.createHash('sha256')
        .update(authKey)
        .digest('base64');



    const createUser = db.createUser(randomUUID(), hashedUsername, passwordHash, wrappedDataKey, salt, nonce);


    if (createUser.ok) {
        return NextResponse.json({
            token: signToken(createUser.value.id),
            user: { id: createUser.value.id, username: createUser.value.username }
        })
    };
}

