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
