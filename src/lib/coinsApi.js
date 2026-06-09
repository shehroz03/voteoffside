import { supabase, supabaseEnabled } from './supabase.js'

export async function fetchBalance(userId) {
  if (!supabaseEnabled || !userId) return null
  const { data, error } = await supabase.rpc('get_user_balance', { p_user_id: userId })
  if (error) { console.error('fetchBalance:', error.message); return null }
  return data
}

export async function fetchMyBets(userId) {
  if (!supabaseEnabled || !userId) return []
  const { data, error } = await supabase
    .from('coin_bets')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) { console.error('fetchMyBets:', error.message); return [] }
  return data ?? []
}

export async function placeBetRemote({ userId, matchId, teamCode, amount, odds }) {
  if (!supabaseEnabled) return { error: 'Supabase not configured' }
  const { data, error } = await supabase.rpc('place_bet', {
    p_user_id:   userId,
    p_match_id:  matchId,
    p_team_code: teamCode,
    p_amount:    amount,
    p_odds:      odds,
  })
  if (error) return { error: error.message }
  return { data }
}
