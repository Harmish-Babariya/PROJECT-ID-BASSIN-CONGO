// Environment variable validation - ensures all required vars are set at startup

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

// Public variables (safe for client-side)
export const SUPABASE_URL = requireEnv("NEXT_PUBLIC_SUPABASE_URL")
export const SUPABASE_ANON_KEY = requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
export const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ""

// Server-only variables
export const SUPABASE_SERVICE_ROLE_KEY = requireEnv("SUPABASE_SERVICE_ROLE_KEY")
export const JWT_SECRET = process.env.JWT_SECRET || ""

// Mailjet transactional email
export const MAILJET_API_KEY = process.env.MAILJET_API_KEY || ""
export const MAILJET_API_SECRET = process.env.MAILJET_API_SECRET || ""
export const MAILJET_FROM_EMAIL = process.env.MAILJET_FROM_EMAIL || ""
export const MAILJET_FROM_NAME = process.env.MAILJET_FROM_NAME || "ID Bassin Congo"
