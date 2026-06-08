import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY

// When keys are missing the app runs in demo mode (no crash).
export const supabaseEnabled = Boolean(url && anon)

export const supabase = supabaseEnabled
  ? createClient(url, anon, {
      realtime: { params: { eventsPerSecond: 10 } },
      auth: { persistSession: true, autoRefreshToken: true },
    })
  : null
