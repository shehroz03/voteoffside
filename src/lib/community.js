// Demo community votes. In production these come from the backend
// (Express + MongoDB + Socket.io) so all users see real, live percentages.
// Here we derive a stable split from the match id so the UI is consistent.

function seedFrom(str) {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return Math.abs(h)
}

export function communityVotes(match, userPick) {
  const seed = seedFrom(match.id)
  const base = 30 + (seed % 41) // 30..70 for home
  let homePct = base
  let awayPct = 100 - base
  const total = 800 + (seed % 5000)

  // nudge slightly toward the user's own pick so voting feels responsive
  let votedHome = total
  let votedAway = total
  void votedHome
  void votedAway

  return {
    total: total + (userPick ? 1 : 0),
    home: homePct,
    away: awayPct,
  }
}
