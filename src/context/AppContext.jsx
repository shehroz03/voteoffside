import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { getFingerprint, getUsername, regenerateUsername } from '../lib/identity.js'
import { matches as staticMatches } from '../lib/matches.js'
import { useAuth } from './AuthContext.jsx'

const AppContext = createContext()

function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function mapApiMatch(m) {
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

export function AppProvider({ children }) {
  const { user } = useAuth()
  const [anonUsername, setAnonUsername] = useState(getUsername)
  const [fingerprint] = useState(getFingerprint)

  // When logged in, use the user's display name or email; otherwise use the anon username.
  const username = user
    ? (user.user_metadata?.full_name || user.email || anonUsername)
    : anonUsername

  // favorites: { teams: [codes], players: [ids] }
  const [favorites, setFavorites] = useState(() =>
    load('vo_favorites', { teams: [], players: [] })
  )
  // votes: { [matchId]: teamCode }  — this user's own picks
  const [votes, setVotes] = useState(() => load('vo_votes', {}))

  // matches: real matches from API or static fallback
  const [matches, setMatches] = useState(() => {
    const cached = load('vo_api_matches', null)
    return cached || staticMatches
  })

  useEffect(() => {
    localStorage.setItem('vo_favorites', JSON.stringify(favorites))
  }, [favorites])

  useEffect(() => {
    localStorage.setItem('vo_votes', JSON.stringify(votes))
  }, [votes])

  // Fetch real matches with 5-minute local cache
  useEffect(() => {
    async function loadMatches() {
      try {
        const cachedTime = localStorage.getItem('vo_api_matches_time')
        const now = Date.now()

        // 5 minutes cache expiry
        if (cachedTime && now - Number(cachedTime) < 300000) {
          const cached = load('vo_api_matches', null)
          if (cached && cached.length > 0) {
            setMatches(cached)
            return
          }
        }

        const res = await fetch('/football-api/competitions/WC/matches')
        if (!res.ok) throw new Error(`HTTP error: ${res.status}`)
        const data = await res.json()

        if (data && data.matches && data.matches.length > 0) {
          const mapped = data.matches.map(mapApiMatch)
          setMatches(mapped)
          localStorage.setItem('vo_api_matches', JSON.stringify(mapped))
          localStorage.setItem('vo_api_matches_time', String(now))
        }
      } catch (err) {
        console.warn('Could not fetch matches from API, using static/cached matches:', err.message)
      }
    }
    loadMatches()
  }, [])

  const toggleFavTeam = useCallback((code) => {
    setFavorites((f) => ({
      ...f,
      teams: f.teams.includes(code)
        ? f.teams.filter((c) => c !== code)
        : [...f.teams, code],
    }))
  }, [])

  const toggleFavPlayer = useCallback((id) => {
    setFavorites((f) => ({
      ...f,
      players: f.players.includes(id)
        ? f.players.filter((p) => p !== id)
        : [...f.players, id],
    }))
  }, [])

  const castVote = useCallback((matchId, teamCode) => {
    setVotes((v) => ({ ...v, [matchId]: teamCode }))
  }, [])

  const newUsername = useCallback(() => setAnonUsername(regenerateUsername()), [])

  return (
    <AppContext.Provider
      value={{
        username,
        fingerprint,
        favorites,
        votes,
        matches,
        toggleFavTeam,
        toggleFavPlayer,
        castVote,
        newUsername,
        isFavTeam: (c) => favorites.teams.includes(c),
        isFavPlayer: (id) => favorites.players.includes(id),
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => useContext(AppContext)
