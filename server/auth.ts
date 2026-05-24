import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET ?? "dev-secret-change-in-production";

export const signToken  = (userId: string) =>
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
