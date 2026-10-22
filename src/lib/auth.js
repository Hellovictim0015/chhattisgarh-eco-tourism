import jwt from "jsonwebtoken";

// Verifies the Bearer token on a request and returns { id, role }, or null if
// missing/invalid. Callers decide whether a null result means 401 or "treat as guest".
export function getUserFromRequest(req) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  try {
    return jwt.verify(authHeader.split(" ")[1], process.env.JWT_SECRET);
  } catch {
    return null;
  }
}
