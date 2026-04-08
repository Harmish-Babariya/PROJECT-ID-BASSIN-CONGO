import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "default-secret-change-in-production"

export type JWTPayload = {
  userId: string
  email: string
}

export function signToken(payload: JWTPayload, rememberMe = false): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: rememberMe ? "30d" : "24h",
  })
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload
  } catch {
    return null
  }
}
