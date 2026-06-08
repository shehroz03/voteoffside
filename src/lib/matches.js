import { groups } from './teams.js'

// Group-stage matchups are generated via round-robin and are ACCURATE
// (who plays whom within each group). Dates, kickoff times and venues are
// reasonable SEED values for building/testing the UI — replace them with the
// official fixture list (or a live API) before launch. See README "Real data".

const HOST_CITIES = [
  'Mexico City', 'Guadalajara', 'Monterrey', 'Toronto', 'Vancouver',
  'Atlanta', 'Boston', 'Dallas', 'Houston', 'Kansas City', 'Los Angeles',
  'Miami', 'New York / NJ', 'Philadelphia', 'San Francisco', 'Seattle',
]
const KICKOFFS = ['12:00', '15:00', '18:00', '21:00']

// round-robin pairings for a group of 4 (indices)
const ROUNDS = [
  [[0, 1], [2, 3]],
  [[0, 2], [1, 3]],
  [[0, 3], [1, 2]],
]

function pad(n) {
  return String(n).padStart(2, '0')
}

function isoDate(y, m, d, time) {
  return `${y}-${pad(m)}-${pad(d)}T${time}:00`
}

function buildGroupStage() {
  const matches = []
  let id = 1
  let cityIdx = 0
  const groupKeys = Object.keys(groups)

  groupKeys.forEach((g, gi) => {
    const codes = groups[g]
    ROUNDS.forEach((round, md) => {
      // MD1 ~ Jun 11-17, MD2 ~ Jun 18-23, MD3 ~ Jun 24-27
      const baseDay = [11, 18, 24][md]
      const day = baseDay + Math.floor(gi / 2)
      round.forEach((pair, pi) => {
        const time = KICKOFFS[(gi + pi) % KICKOFFS.length]
        matches.push({
          id: `G${id}`,
          stage: 'Group ' + g,
          group: g,
          matchday: md + 1,
          home: codes[pair[0]],
          away: codes[pair[1]],
          date: isoDate(2026, 6, Math.min(day, 27), time),
          venue: HOST_CITIES[cityIdx++ % HOST_CITIES.length],
          status: 'upcoming', // upcoming | live | finished
          score: null, // { home, away } when finished/live
        })
        id++
      })
    })
  })

  // Make the official opener correct: Mexico vs South Africa first.
  matches.sort((a, b) => new Date(a.date) - new Date(b.date))
  return matches
}

export const matches = buildGroupStage()

export function getMatch(id) {
  return matches.find((m) => m.id === id)
}

export function getMatchVoteState(match) {
  const now = new Date()
  const kickoff = new Date(match.date)

  if (kickoff <= now) return 'closed'

  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const dayAfterTomorrowStart = new Date(todayStart)
  dayAfterTomorrowStart.setDate(todayStart.getDate() + 2)

  const kickoffDayStart = new Date(kickoff.getFullYear(), kickoff.getMonth(), kickoff.getDate())

  if (kickoffDayStart < dayAfterTomorrowStart) return 'open'
  return 'locked'
}

// Demo helper: pretend the first few matches are live/finished so the
// Live page has something to show. Remove once a real scores API is wired.
export function withDemoLiveState(list) {
  return list.map((m, i) => {
    if (i === 0) return { ...m, status: 'live', minute: 67, score: { home: 1, away: 1 } }
    if (i === 1) return { ...m, status: 'live', minute: 23, score: { home: 0, away: 2 } }
    if (i === 2) return { ...m, status: 'finished', score: { home: 2, away: 0 } }
    return m
  })
}
