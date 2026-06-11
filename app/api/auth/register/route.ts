import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { authDb } from "@/lib/server/db";
import { usernameIntoBase64, passwordIntoBase64, generateFamily } from "@/lib/server/auth";



export async function POST(req: Request) {
    const { username, authKey, salt, wrappedDataKey, nonce } = await req.json();

    if (!username || !authKey || !salt || !wrappedDataKey || !nonce)
        return NextResponse.json({ error: "username and password required" }, { status: 400 });

    const hashedUsername = usernameIntoBase64(username)



    const passwordHash = passwordIntoBase64(authKey)


    const createUser = authDb.createUser(randomUUID(), hashedUsername, passwordHash, wrappedDataKey, salt, nonce);

    if (!createUser.ok) return NextResponse.json({ error: "username already taken" }, { status: 409 });

    const { accessToken, refreshToken } = generateFamily(createUser.id)
    const res = NextResponse.json({
        accessToken,
        user: { id: createUser.id, username: username.trim().toLowerCase() }
    })

    res.cookies.set("refreshToken", refreshToken, {
        httpOnly: true,
        secure: false, //only during testing: true,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30,
        path: "/api/auth"
    });


    return res


}

