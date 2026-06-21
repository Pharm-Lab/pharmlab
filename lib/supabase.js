import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Unauthenticated client — public reads only
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Authenticated client using the new native Clerk+Supabase integration
// Pass the Clerk session object from useSession()
export function createClerkSupabaseClient(session) {
  return createClient(supabaseUrl, supabaseAnonKey, {
    accessToken: async () => session?.getToken() ?? null,
  })
}