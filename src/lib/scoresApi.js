export function mapApiMatch(m) {
  let status = 'upcoming'
  if (m.status === 'IN_PLAY' || m.status === 'PAUSED') {
    status = 'live'
  } else if (m.status === 'FINISHED') {
    status = 'finished'
  }

  let stage = m.stage === 'GROUP_STAGE' && m.group
    ? 'Group ' + m.group.replace('GROUP_', '')
    : m.stage.replace('_', ' ')

  return {
    id: String(m.id),
    stage: stage,
    group: m.group ? m.group.replace('GROUP_', '') : 'all',
    matchday: m.matchday,
    home: m.homeTeam.tla,
    away: m.awayTeam.tla,
    date: m.utcDate,
    venue: m.venue || 'Stadium',
    status: status,
    minute: m.minute || null,
    score: (status === 'live' || status === 'finished')
      ? { home: m.score.fullTime.home ?? 0, away: m.score.fullTime.away ?? 0 }
      : null,
  }
}

let cache = null
let lastFetch = 0
const CACHE_DURATION = 30000 // 30 seconds

export async function fetchLiveMatches() {
  const now = Date.now()
  if (cache && now - lastFetch < CACHE_DURATION) {
    return cache
  }

  const apiKey = import.meta.env.VITE_FOOTBALL_API_KEY
  if (!apiKey) {
    throw new Error('API key missing. Falling back to demo mode.')
  }

  // We use the proxy path configured in vite.config.js which automatically appends the header
  // or we can use the direct URL if it's running outside Vite's proxy.
  // The Vite proxy is setup for '/football-api' -> 'https://api.football-data.org/v4'
  const url = '/football-api/competitions/WC/matches'

  const res = await fetch(url, {
    headers: {
      'X-Auth-Token': apiKey
    }
  })

  if (!res.ok) {
    throw new Error(`HTTP error: ${res.status}`)
  }

  const data = await res.json()
  if (!data || !data.matches) {
    throw new Error('Invalid API response')
  }

  const mapped = data.matches.map(mapApiMatch)
  cache = mapped
  lastFetch = now

  return mapped
}
