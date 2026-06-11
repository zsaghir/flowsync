import { NextResponse, NextRequest } from "next/server";

import { newRefreshToken } from "@/lib/server/auth";
import { AppError, ErrorResponses } from "@/lib/server/error";

export async function GET(req: NextRequest) {
    const oldRefreshToken = req.cookies.get("refreshToken")?.value as string | undefined
    console.log(oldRefreshToken)
    if (!oldRefreshToken || oldRefreshToken && typeof oldRefreshToken != "string") throw ErrorResponses.BadRequest
    try {
        console.log("Starting to do refresh")
        const data = newRefreshToken(oldRefreshToken)

        const res = NextResponse.json({ accessToken: data.accessToken })

        res.cookies.set("refreshToken", data.refreshToken, {
            httpOnly: true,
            secure: false, //only during testing: true,
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 30,
            path: "/api/auth"
        });

        return res


    } catch (error) {
        if (error instanceof AppError) {
            if (error.statusCode === 403) return ErrorResponses.Forbidden
            if (error.statusCode === 404) return ErrorResponses.NotFound("Token")
            if (error.statusCode === 401) return ErrorResponses.Unauthorized

        }

        throw error
    }




}