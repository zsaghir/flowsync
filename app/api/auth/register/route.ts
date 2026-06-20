import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { authDb } from "@/lib/server/db";
import { usernameIntoBase64, passwordIntoBase64, generateFamily } from "@/lib/server/auth";
import z from "zod"
import { ErrorResponses } from "@/lib/server/error";

const RequestType = z.object({
    username: z.string(), authKey: z.string(), salt: z.string(),
    wrappedDataKey: z.string(), nonce: z.string()
})

export async function POST(req: Request) {

    const _request = RequestType.safeParse(await req.json())
    if (!_request.success) {
        return ErrorResponses.BadRequest
    }
    const { username, authKey, salt, wrappedDataKey, nonce } = _request.data
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
        secure: true,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30,
        path: "/api/auth"
    });


    return res


}

