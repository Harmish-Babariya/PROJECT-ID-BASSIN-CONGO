import jwt from "jsonwebtoken"
import { JWT_SECRET as SECRET } from "@/lib/env"

const JWT_SECRET = SECRET || "default-secret-change-in-production"

export type JWTPayload = {
  userId: string
  email: string
  tokenVersion?: number
  sessionId?: string
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
