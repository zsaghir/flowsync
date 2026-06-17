import { NextResponse, NextRequest } from "next/server";

import { deleteTokenChain } from "@/lib/server/auth";
import { ErrorResponses } from "@/lib/server/error";

export async function GET(req: NextRequest) {

    try {
        const refreshToken = req.cookies.get("refreshToken")?.value as string | undefined
        if (typeof refreshToken != "string") throw ErrorResponses.BadRequest
        deleteTokenChain(refreshToken)
    } catch (error) {
        console.log(error)
    }

    const res = NextResponse.json({ ok: true }, { status: 200 });
    res.cookies.delete("refreshToken")
    return res


} 