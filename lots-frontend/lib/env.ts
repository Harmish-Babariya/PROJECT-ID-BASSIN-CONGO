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
export const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ""
export const JWT_SECRET = process.env.JWT_SECRET || ""
