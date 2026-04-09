import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/lib/env'

// Client public pour Client Components (uses anon key, respects RLS)
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
