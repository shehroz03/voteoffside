// =============================================================
//  VoteOffside — Full WC 2026 Squad Fetcher (API-Football)
//  One-time script: fetches all 48 national team squads with
//  real player photos, positions, ages and numbers.
//
//  Run: node scripts/fetch-squads.mjs
//
//  FREE REGISTRATION (100 req/day):
//    1. Go to https://dashboard.api-football.com/register
//    2. Confirm email → get your key
//    3. Add to .env:  APISPORTS_KEY=your_key_here
//    4. Run this script once
//
//  Cost: ~96 API calls (48 team ID lookups + 48 squad fetches)
//  Time: ~4 minutes (2s throttle between calls)
//  Output: src/data/players.json (replaces existing, keeps club/stats)
// =============================================================

import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { existsSync }                  from 'node:fs'
import path                            from 'node:path'
import { fileURLToPath }               from 'node:url'

const __dir     = path.dirname(fileURLToPath(import.meta.url))
const ROOT      = path.resolve(__dir, '..')
const OUT_FILE  = path.join(ROOT, 'src', 'data', 'players.json')
const IDS_CACHE = path.join(__dir, '.wc2026_ids.json') // saved between runs

// --- API config ---
const KEY = process.env.APISPORTS_KEY
if (!KEY) {
  console.error('\n❌  APISPORTS_KEY not set in .env')
  console.error('    Register free at https://dashboard.api-football.com/register')
  console.error('    Then add: APISPORTS_KEY=your_key to .env\n')
  process.exit(1)
}
const BASE    = 'https://v3.football-api.com'
const HEADERS = { 'x-apisports-key': KEY }

// --- All 48 WC 2026 teams: our code → search name for API ---
const TEAM_NAMES = {
  MEX: 'Mexico',        RSA: 'South Africa', KOR: 'South Korea',   CZE: 'Czech Republic',
  CAN: 'Canada',        BIH: 'Bosnia',        QAT: 'Qatar',         SUI: 'Switzerland',
  BRA: 'Brazil',        MAR: 'Morocco',       HAI: 'Haiti',         SCO: 'Scotland',
  USA: 'United States', PAR: 'Paraguay',      AUS: 'Australia',     TUR: 'Turkey',
  GER: 'Germany',       CUW: 'Curacao',       CIV: 'Ivory Coast',   ECU: 'Ecuador',
  NED: 'Netherlands',   JPN: 'Japan',         SWE: 'Sweden',        TUN: 'Tunisia',
  BEL: 'Belgium',       EGY: 'Egypt',         IRN: 'Iran',          NZL: 'New Zealand',
  ESP: 'Spain',         CPV: 'Cape Verde',    KSA: 'Saudi Arabia',  URU: 'Uruguay',
  FRA: 'France',        SEN: 'Senegal',       IRQ: 'Iraq',          NOR: 'Norway',
  ARG: 'Argentina',     ALG: 'Algeria',       AUT: 'Austria',       JOR: 'Jordan',
  POR: 'Portugal',      COD: 'DR Congo',      UZB: 'Uzbekistan',    COL: 'Colombia',
  ENG: 'England',       CRO: 'Croatia',       GHA: 'Ghana',         PAN: 'Panama',
}

// Position normaliser (API-Football uses long-form names)
function normPos(p) {
  if (!p) return 'MF'
  const u = p.toUpperCase()
  if (u.includes('ATTACK') || u.includes('FORWARD') || u.includes('WINGER'))  return 'FW'
  if (u.includes('MIDFIELD'))                                                   return 'MF'
  if (u.includes('DEFEND') || u.includes('BACK'))                               return 'DF'
  if (u.includes('GOAL'))                                                        return 'GK'
  return 'MF'
}

// Slug from name (used as player id)
function slug(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

const sleep = ms => new Promise(r => setTimeout(r, ms))

async function apiFetch(path) {
  const url = `${BASE}${path}`
  const res = await fetch(url, { headers: HEADERS })
  if (res.status === 429) throw new Error('Rate limited — wait a minute and retry')
  if (!res.ok)            throw new Error(`HTTP ${res.status} for ${url}`)
  const json = await res.json()
  if (json.errors && Object.keys(json.errors).length) {
    throw new Error('API error: ' + JSON.stringify(json.errors))
  }
  return json
}

// ---- Phase 1: resolve team IDs --------------------------------
async function resolveTeamIds() {
  // Load cached IDs if available (from a previous run)
  if (existsSync(IDS_CACHE)) {
    const saved = JSON.parse(await readFile(IDS_CACHE, 'utf8'))
    console.log(`\n📋  Loaded ${Object.keys(saved).length} cached team IDs (${IDS_CACHE})`)
    return saved
  }

  console.log('\n🔍  Phase 1: Resolving team IDs from API-Football...\n')
  const ids    = {}
  const missed = []
  const codes  = Object.keys(TEAM_NAMES)

  for (let i = 0; i < codes.length; i++) {
    const code = codes[i]
    const name = TEAM_NAMES[code]
    try {
      const data = await apiFetch(
        `/teams?name=${encodeURIComponent(name)}&type=National`
      )
      const teams = (data.response || [])
      // Prefer exact-ish match, then first result
      const hit = teams.find(t =>
        t.team?.name?.toLowerCase() === name.toLowerCase()
      ) || teams.find(t =>
        t.team?.name?.toLowerCase().includes(name.toLowerCase().split(' ')[0])
      ) || teams[0]

      if (hit?.team?.id) {
        ids[code] = hit.team.id
        console.log(`  ✓ ${code.padEnd(4)} ${name.padEnd(20)} → id ${hit.team.id}`)
      } else {
        missed.push(code)
        console.log(`  – ${code.padEnd(4)} ${name.padEnd(20)} → not found`)
      }
    } catch (e) {
      missed.push(code)
      console.log(`  × ${code.padEnd(4)} ${name.padEnd(20)} → ${e.message}`)
    }
    if (i < codes.length - 1) await sleep(2200)
  }

  // Save to cache so we don't need phase 1 again tomorrow
  await writeFile(IDS_CACHE, JSON.stringify(ids, null, 2))
  console.log(`\n💾  Team IDs saved to ${IDS_CACHE}`)
  if (missed.length) {
    console.log(`⚠️   Missed: ${missed.join(', ')}`)
    console.log('    These teams will have no players in the output.')
  }
  return ids
}

// ---- Phase 2: fetch squads ------------------------------------
async function fetchSquads(teamIds) {
  console.log('\n👥  Phase 2: Fetching player squads...\n')
  const allPlayers = []
  const codes      = Object.keys(teamIds)

  for (let i = 0; i < codes.length; i++) {
    const code = codes[i]
    const id   = teamIds[code]
    try {
      const data = await apiFetch(`/players/squads?team=${id}`)
      const squad = data.response?.[0]?.players || []
      const mapped = squad.map(p => ({
        id:       slug(p.name) + '-' + code.toLowerCase(),
        name:     p.name,
        team:     code,
        position: normPos(p.position),
        number:   p.number  || null,
        age:      p.age     || null,
        club:     null,   // squad endpoint doesn't provide club; can be enriched later
        photo:    p.photo  || null,
        stats: { apps: 0, goals: 0, assists: 0, rating: 0 },
      }))
      allPlayers.push(...mapped)
      console.log(`  ✓ ${code.padEnd(4)} — ${squad.length} players`)
    } catch (e) {
      console.log(`  × ${code.padEnd(4)} — ${e.message}`)
    }
    if (i < codes.length - 1) await sleep(2200)
  }
  return allPlayers
}

// ---- Merge: preserve existing club + stats for known players --
async function mergeWithExisting(newPlayers) {
  try {
    const raw     = JSON.parse(await readFile(OUT_FILE, 'utf8'))
    const existing = raw.players || []
    // Build lookup by name (lowercased)
    const byName = Object.fromEntries(
      existing.map(p => [p.name.toLowerCase(), p])
    )
    return newPlayers.map(p => {
      const old = byName[p.name.toLowerCase()]
      if (!old) return p
      return {
        ...p,
        club:  old.club  || p.club,
        photo: p.photo   || old.photo,  // prefer new API-Football photo
        stats: (old.stats?.goals || old.stats?.apps)
               ? old.stats            // keep real sample stats if we had them
               : p.stats,
      }
    })
  } catch {
    return newPlayers
  }
}

// ---- Main -----------------------------------------------------
async function main() {
  console.log('⚽  VoteOffside Squad Fetcher — API-Football free tier')
  console.log('━'.repeat(54))

  const teamIds = await resolveTeamIds()
  if (Object.keys(teamIds).length === 0) {
    console.error('\n❌  No team IDs resolved. Check your API key.')
    process.exit(1)
  }

  const rawPlayers   = await fetchSquads(teamIds)
  const mergedPlayers = await mergeWithExisting(rawPlayers)

  const output = {
    _note: `Real WC 2026 squad data from API-Football. `
         + `Photos from media.api-sports.io. `
         + `Stats are placeholders (not available in free squad endpoint). `
         + `Fetched: ${new Date().toISOString()}`,
    players: mergedPlayers,
  }

  await writeFile(OUT_FILE, JSON.stringify(output, null, 2) + '\n')

  console.log('\n' + '━'.repeat(54))
  console.log(`✅  Done! ${mergedPlayers.length} players written to src/data/players.json`)
  const withPhoto = mergedPlayers.filter(p => p.photo).length
  console.log(`📸  ${withPhoto} players have photos`)
  console.log('\nNext: npm run dev — check the Players page!')
}

main().catch(e => {
  console.error('\n💥  Fatal:', e.message)
  process.exit(1)
})
