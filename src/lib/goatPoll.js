// ─── GOAT Poll ──────────────────────────────────────────────────────────────────
// A global "who is the greatest?" popularity vote between World Cup superstars.
// Real, shared voting backed by Supabase: counts are public (every visitor sees
// the running totals) but only signed-in users can cast a vote.

import { supabase, supabaseEnabled } from './supabase.js'

export const GOAT_PLAYERS = [
  { id: 'lionel-messi-arg',      accent: '#75aadb' },
  { id: 'cristiano-ronaldo-por', accent: '#e4002b' },
  { id: 'neymar-bra',            accent: '#fcd116' },
  { id: 'kylian-mbapp-fra',      accent: '#2563eb' },
  { id: 'erling-haaland-nor',    accent: '#ef4444' },
  { id: 'vinicius-junior-bra',   accent: '#16a34a' },
]

// Fetch live counts + this user's current pick (pick is null when logged out).
export async function fetchGoatState() {
  if (!supabaseEnabled) return { counts: {}, pick: null }
  const { data, error } = await supabase.rpc('get_goat_state')
  if (error) {
    console.error('get_goat_state:', error.message)
    return { counts: {}, pick: null }
  }
  return { counts: data?.counts ?? {}, pick: data?.pick ?? null }
}

// Cast (or change) a vote. Requires sign-in. Returns fresh { counts, pick }
// or { error } on failure.
export async function castGoatVote(playerId) {
  if (!supabaseEnabled) return { error: 'Voting is unavailable' }
  const { data, error } = await supabase.rpc('cast_goat_vote', { p_player_id: playerId })
  if (error) {
    console.error('cast_goat_vote:', error.message)
    return { error: error.message }
  }
  return { counts: data?.counts ?? {}, pick: data?.pick ?? playerId }
}

// Sum the counts across the poll players.
export function sumGoatCounts(counts) {
  return GOAT_PLAYERS.reduce((acc, p) => acc + (counts[p.id] || 0), 0)
}
