import jwt from "jsonwebtoken";
import crypto from "crypto";

const SECRET = process.env.JWT_SECRET ?? "dev-secret-change-in-production";

export const signToken = (userId: string) =>
  jwt.sign({ sub: userId }, SECRET, { expiresIn: "30d" });

export const verifyToken = (token: string): string | null => {
  try {
    const payload = jwt.verify(token, SECRET) as { sub: string };
    return payload.sub;
  } catch {
    return null;
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