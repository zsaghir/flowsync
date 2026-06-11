import jwt from "jsonwebtoken";
import crypto from "crypto";
import { authSql, database } from "./SQLite.ts";
import { NotFoundError, ExpiredError, RevokedError } from "./error.ts";

if (!process.env.JWT_SECRET) throw Error("Set your server secret key")
const SECRET = process.env.JWT_SECRET;
const DeleteFamily = (id: number) => {
  return authSql.deletFamily.run(id)
}



export const verifyToken = (token: string): string | null => {
  try {
    const payload = jwt.verify(token, SECRET) as { sub: string };
    return payload.sub;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new ExpiredError
    }
    throw error;
  }
};

export const getAuthUserId = (req: Request): string | null => {
  const header = req.headers.get("authorization") ?? "";
  if (!header.startsWith("Bearer ")) return null;
  return verifyToken(header.slice(7));
};

export const passwordIntoBase64 = (value: any) => crypto.createHash('sha256')
  .update(value)
  .digest('base64')

export const usernameIntoBase64 = (value: string) => crypto.createHash('sha256')
  .update(value.trim().toLowerCase())
  .digest('base64')

export const verifyPassword = (authKey: string, passwordHash: string) => {

  const candidate = crypto.createHash('sha256')
    .update(authKey).digest('base64');

  const a = Buffer.from(candidate, "utf8");
  const b = Buffer.from(passwordHash, "utf8");
  return a.length === b.length && crypto.timingSafeEqual(a, b); //This makes sure the time to compare is same
}


export const generateFamily = (userId: string) => {
  try {
    database.exec(`BEGIN TRANSACTION`)
    const expDate = Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60)
    const familyGen = authSql.generateFamily.run(expDate, userId)
    const refreshToken = crypto.randomBytes(32).toString('base64url');
    const hash = crypto.createHash('sha256').update(refreshToken).digest('hex')
    if (!familyGen.changes) throw Error("Failed to generate token")
    const tokenGen = authSql.generateToken.run(hash, 0, familyGen.lastInsertRowid)

    if (!tokenGen.changes) throw Error("Failed to generate token")
    database.exec('COMMIT')
    const accessToken = jwt.sign({ sub: userId }, SECRET, { expiresIn: "5" });

    return { refreshToken, accessToken }


  } catch (error) {
    database.exec(`ROLLBACK`)
    throw error
  }

}

export const newRefreshToken = (tokenId: string) => {

  const tokenHash = crypto.createHash('sha256').update(tokenId).digest('hex')
  const tokenInformation = authSql.getToken.
    get(tokenHash) as { isRevoked: number, familyId: number, familyExp: number, userId: string } | undefined


  if (!tokenInformation) throw new NotFoundError("Token not found")


  const CurrentDate = Math.floor(Date.now() / 1000)

  if (tokenInformation.isRevoked) {
    DeleteFamily(tokenInformation.familyId)
    throw new RevokedError("Token is revoked")
  }

  //Checking if token expired
  if (tokenInformation.familyExp < CurrentDate) {
    DeleteFamily(tokenInformation.familyId)
    throw new ExpiredError("Family Expired")
  }

  try {
    database.exec('BEGIN TRANSACTION')

    const revoke = authSql.revokeToken.run(tokenHash)
    if (!revoke.changes) throw Error("Couldn't revoke token")
    const refreshToken = crypto.randomBytes(32).toString('base64url');
    const hash = crypto.createHash('sha256').update(refreshToken).digest('hex')
    const tokenGen = authSql.generateToken.run(hash, 0, tokenInformation.familyId)
    if (!tokenGen.changes) throw Error("Couldn't make a new token")

    const accessToken = jwt.sign({ sub: tokenInformation.userId }, SECRET, { expiresIn: "1m" }); //1m for debugging purpose

    database.exec('COMMIT')

    return { refreshToken, accessToken }
  } catch (error) {
    database.exec('ROLLBACK')
    throw error
  }

}

