import { supabase, supabaseEnabled } from './supabase.js'

/** Returns integer balance, or null if Supabase is disabled / error. */
export async function fetchBalance(userId) {
  if (!supabaseEnabled || !userId) return null
  try {
    const { data, error } = await supabase.rpc('get_user_balance', { p_user_id: userId })
    if (error) throw error
    return data ?? null
  } catch (err) {
    console.error('fetchBalance:', err.message)
    return null
  }
}

/**
 * Places a bet via the `place_bet` RPC.
 * Returns { bet_id, new_balance } on success.
 * Throws an Error with a human-readable message on failure.
 * Returns null gracefully if Supabase is disabled.
 */
export async function placeBet(userId, matchId, teamCode, amount, odds) {
  if (!supabaseEnabled) return null
  const { data, error } = await supabase.rpc('place_bet', {
    p_user_id:   userId,
    p_match_id:  matchId,
    p_team_code: teamCode,
    p_amount:    amount,
    p_odds:      odds,
  })
  if (error) throw new Error(error.message)
  return data // { bet_id, new_balance }
}

/** Returns array of bets for the user, ordered newest-first. Empty array on error. */
export async function fetchMyBets(userId) {
  if (!supabaseEnabled || !userId) return []
  try {
    const { data, error } = await supabase
      .from('coin_bets')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data ?? []
  } catch (err) {
    console.error('fetchMyBets:', err.message)
    return []
  }
}
