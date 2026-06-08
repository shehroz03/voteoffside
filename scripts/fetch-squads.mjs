// =============================================================
//  VoteOffside — WC 2026 Squad Fetcher (football-data.org)
//  Uses the API key already in .env (VITE_FOOTBALL_API_KEY).
//
//  Run: npm run fetch:squads
//
//  Phase 1: Get all 48 WC 2026 teams  (1 API call)
//  Phase 2: Fetch each squad           (48 API calls, 1.5s gap)
//  Phase 3: Photo enrichment via TheSportsDB free API (no key)
//  Output:  src/data/players.json
// =============================================================

import { readFile, writeFile } from 'node:fs/promises'
import { existsSync }          from 'node:fs'
import path                    from 'node:path'
import { fileURLToPath }       from 'node:url'

const __dir    = path.dirname(fileURLToPath(import.meta.url))
const ROOT     = path.resolve(__dir, '..')
const OUT_FILE = path.join(ROOT, 'src', 'data', 'players.json')
const CACHE    = path.join(__dir, '.wc2026_teams.json')

const FD_KEY  = process.env.VITE_FOOTBALL_API_KEY
if (!FD_KEY) {
  console.error('\n❌  VITE_FOOTBALL_API_KEY not set')
  process.exit(1)
}
const FD_BASE    = 'https://api.football-data.org/v4'
const FD_HEADERS = { 'X-Auth-Token': FD_KEY }

// football-data.org TLA → our team code (only Uruguay differs)
const TLA_MAP = { URY: 'URU' }
function ourCode(tla) { return TLA_MAP[tla] ?? tla }

function normPos(p) {
  if (!p) return 'MF'
  switch (p) {
    case 'Goalkeeper': return 'GK'
    case 'Defender':   return 'DF'
    case 'Midfielder': return 'MF'
    case 'Attacker':   return 'FW'
    default:           return 'MF'
  }
}

function calcAge(dob) {
  if (!dob) return null
  const birth = new Date(dob)
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age
}

function slug(name, teamCode) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    + '-' + teamCode.toLowerCase()
}

const sleep = ms => new Promise(r => setTimeout(r, ms))

async function fdFetch(path) {
  const res = await fetch(`${FD_BASE}${path}`, { headers: FD_HEADERS })
  if (res.status === 429) {
    console.log('  ⏳ Rate limited — waiting 60s...')
    await sleep(60_000)
    return fdFetch(path)
  }
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${path}`)
  return res.json()
}

async function tsdbPhoto(name) {
  try {
    const res = await fetch(
      `https://www.thesportsdb.com/api/v1/json/3/searchplayers.php?p=${encodeURIComponent(name)}`
    )
    if (!res.ok) return null
    const d = await res.json()
    const p = d.player?.[0]
    return p?.strCutout || p?.strThumb || null
  } catch { return null }
}

// ── Phase 1: get all 48 team IDs ─────────────────────────────
async function getTeams() {
  if (existsSync(CACHE)) {
    const saved = JSON.parse(await readFile(CACHE, 'utf8'))
    console.log(`📋  Loaded ${saved.length} team IDs from cache`)
    return saved
  }
  console.log('\n🔍  Phase 1: Fetching WC 2026 team list...')
  const data = await fdFetch('/competitions/WC/teams?season=2026')
  const teams = data.teams.map(t => ({
    id:   t.id,
    code: ourCode(t.tla),
    name: t.name,
    crest: t.crest,
  }))
  await writeFile(CACHE, JSON.stringify(teams, null, 2))
  console.log(`✅  ${teams.length} teams found, IDs cached to ${CACHE}`)
  return teams
}

// ── Phase 2: fetch squads ─────────────────────────────────────
async function fetchSquads(teams) {
  console.log('\n👥  Phase 2: Fetching squads...\n')
  const allPlayers = []

  for (let i = 0; i < teams.length; i++) {
    const { id, code, name } = teams[i]
    let success = false
    for (let attempt = 0; attempt < 3 && !success; attempt++) {
      try {
        const data = await fdFetch(`/teams/${id}`)
        const squad = data.squad || []
        const mapped = squad.map(p => ({
          id:       slug(p.name, code),
          name:     p.name,
          team:     code,
          position: normPos(p.position),
          number:   null,
          age:      calcAge(p.dateOfBirth),
          club:     null,
          photo:    null,
          stats:    { apps: 0, goals: 0, assists: 0, rating: 0 },
        }))
        allPlayers.push(...mapped)
        console.log(`  ✓ ${code.padEnd(4)} (${name}) — ${squad.length} players`)
        success = true
      } catch (e) {
        if (attempt < 2) {
          console.log(`  ⏳ ${code} failed (${e.message}), retrying in 65s...`)
          await sleep(65_000)
        } else {
          console.log(`  × ${code.padEnd(4)} (${name}) — gave up after 3 attempts`)
        }
      }
    }
    if (i < teams.length - 1) await sleep(7000)  // free tier: ~10 req/min → 6s safe gap
  }
  return allPlayers
}

// ── Phase 3: photo enrichment (TheSportsDB, no key) ──────────
async function enrichPhotos(players, existing) {
  const byName = Object.fromEntries(existing.map(p => [p.name.toLowerCase(), p]))

  let photoCount = 0
  const total = players.length
  console.log(`\n📸  Phase 3: Photo enrichment for ${total} players (TheSportsDB)...\n`)
  console.log('    This may take a while — 1 request per second.\n')

  for (let i = 0; i < players.length; i++) {
    const p = players[i]
    const old = byName[p.name.toLowerCase()]

    // Preserve existing club, number, stats, photo where we already have them
    if (old) {
      p.club   = old.club   ?? p.club
      p.number = old.number ?? p.number
      p.stats  = (old.stats?.goals || old.stats?.apps) ? old.stats : p.stats
      if (old.photo) { p.photo = old.photo; photoCount++; continue }
    }

    // Try TheSportsDB for new players
    const photo = await tsdbPhoto(p.name)
    if (photo) { p.photo = photo; photoCount++ }

    if ((i + 1) % 20 === 0) {
      console.log(`  … ${i + 1}/${total} done, ${photoCount} photos so far`)
    }
    await sleep(1000)
  }

  return players
}

// ── Main ──────────────────────────────────────────────────────
async function main() {
  console.log('⚽  VoteOffside Squad Fetcher — football-data.org')
  console.log('━'.repeat(52))

  let existing = []
  try {
    const raw = JSON.parse(await readFile(OUT_FILE, 'utf8'))
    existing = raw.players || []
    console.log(`\n📂  Loaded ${existing.length} existing players from players.json`)
  } catch { /* first run */ }

  const teams      = await getTeams()
  const rawPlayers = await fetchSquads(teams)
  const merged     = await enrichPhotos(rawPlayers, existing)

  const withPhotos = merged.filter(p => p.photo).length
  const output = {
    _note: `Real WC 2026 squads from football-data.org. Photos from TheSportsDB. Fetched: ${new Date().toISOString()}`,
    players: merged,
  }

  await writeFile(OUT_FILE, JSON.stringify(output, null, 2) + '\n')

  console.log('\n' + '━'.repeat(52))
  console.log(`✅  Done! ${merged.length} players → src/data/players.json`)
  console.log(`📸  ${withPhotos} / ${merged.length} players have photos`)
  console.log('\nNext: npm run dev → check the Players page!')
}

main().catch(e => {
  console.error('\n💥  Fatal:', e.message)
  process.exit(1)
})
