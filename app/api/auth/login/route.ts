import { NextResponse } from "next/server";
import { authDb } from "@/lib/server/db";
import { ErrorResponses } from "@/lib/server/error";
import { verifyPassword, usernameIntoBase64, generateFamily } from "@/lib/server/auth";
import z from "zod"


const GetUserType = z.object({
  username: z.string(), passwordHash: z.string(), salt: z.string(),
  wrappedDataKey: z.string(), nonce: z.string(), id: z.string()
})

const RequestType = z.object({
  username: z.string(),
  authKey: z.string()

})


export async function POST(req: Request) {

  const _request = await req.json() as unknown
  if (!_request) return ErrorResponses.BadRequest


  const request = RequestType.safeParse(_request)
  if (!request.success) {
    console.log(request.error)
    return ErrorResponses.BadRequest

  }
  const { username, authKey } = request.data


  const hashedUsername = usernameIntoBase64(username)
  const _user = authDb.getUser(hashedUsername);

  if (!_user) {
    return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });

  }
  const user = GetUserType.parse(_user)


  const valid = verifyPassword(authKey, user.passwordHash)

  if (!valid) return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });

  const { accessToken, refreshToken } = generateFamily(user.id)

  const res = NextResponse.json({
    accessToken,
    wrappedDataKey: user.wrappedDataKey,
    nonce: user.nonce,
    user: { id: user.id, username: username.trim().toLowerCase() },
  });

  res.cookies.set("refreshToken", refreshToken, {
    httpOnly: true,
    secure: false, //only during testing: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30,
    path: "/api/auth"
  });

  return res
}
