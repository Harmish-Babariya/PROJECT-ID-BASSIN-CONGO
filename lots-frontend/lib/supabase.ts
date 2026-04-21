import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Client public pour Client Components (uses anon key, respects RLS)
export const supabase = createClient(url, anonKey)
