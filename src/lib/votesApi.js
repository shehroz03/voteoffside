import { supabase, supabaseEnabled } from './supabase.js'

// Read current aggregate counts for one match -> { teamCode: count }
export async function fetchCounts(matchId) {
  if (!supabaseEnabled) return null
  const { data, error } = await supabase
    .from('vote_counts')
    .select('team_code, count')
    .eq('match_id', matchId)
  if (error) {
    console.error('fetchCounts:', error.message)
    return null
  }
  const counts = {}
  for (const row of data) counts[row.team_code] = row.count
  return counts
}

// Fetch the Beat-the-Crowd leaderboard.
// Returns array of { username, total_points, correct_ct, played_ct, accuracy, current_streak }
// or null when Supabase is not configured.
export async function fetchLeaderboard(limit = 50) {
  if (!supabaseEnabled) return null
  const { data, error } = await supabase.rpc('get_leaderboard', { p_limit: limit })
  if (error) {
    console.error('fetchLeaderboard:', error.message)
    return null
  }
  return data ?? []
}

// Top scorer from the most recently settled matchday.
// Returns { username, day_points, day_correct, matchday } or null.
export async function fetchPredictorOfDay() {
  if (!supabaseEnabled) return null
  const { data, error } = await supabase.rpc('get_predictor_of_day')
  if (error) {
    console.error('fetchPredictorOfDay:', error.message)
    return null
  }
  return data?.[0] ?? null
}

// Current correct-prediction streak for one user. Returns 0 in demo mode.
export async function fetchMyStreak(username) {
  if (!supabaseEnabled || !username) return 0
  const { data, error } = await supabase.rpc('get_user_streak', { p_username: username })
  if (error) {
    console.error('fetchMyStreak:', error.message)
    return 0
  }
  return data ?? 0
}

// How accurately the crowd-favourite predicted match results.
// Returns { correct_ct, total_ct, accuracy_pct } or null.
export async function fetchCrowdAccuracy() {
  if (!supabaseEnabled) return null
  const { data, error } = await supabase.rpc('get_crowd_accuracy')
  if (error) {
    console.error('fetchCrowdAccuracy:', error.message)
    return null
  }
  return data?.[0] ?? null
}

// Cast (or change) a vote. Returns fresh counts -> { teamCode: count }
export async function castVoteRemote({ fingerprint, matchId, teamCode, username }) {
  if (!supabaseEnabled) return null
  const { data, error } = await supabase.rpc('cast_vote', {
    p_fingerprint: fingerprint,
    p_match_id: matchId,
    p_team_code: teamCode,
    p_username: username,
  })
  if (error) {
    console.error('castVote:', error.message)
    return null
  }
  return data
}
