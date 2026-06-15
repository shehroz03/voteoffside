import { useParams, Link } from 'react-router-dom'
import { Heart, ArrowLeft, Trophy, Target, ShieldCheck, TrendingUp, Calendar, CheckCircle2, Clock } from 'lucide-react'
import { motion } from 'framer-motion'
import { getTeam, groups, flag } from '../lib/teams.js'
import TeamBadge from '../components/TeamBadge.jsx'
import Avatar from '../components/Avatar.jsx'
import { players } from '../lib/players.js'
import { useApp } from '../context/AppContext.jsx'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getResult(match, code) {
  if (match.status !== 'finished' || !match.score) return null
  const isHome = match.home === code
  const mine = isHome ? match.score.home : match.score.away
  const theirs = isHome ? match.score.away : match.score.home
  if (mine > theirs) return 'W'
  if (mine < theirs) return 'L'
  return 'D'
}

function isPast(match) {
  return match.status === 'finished' || new Date(match.date) < new Date()
}

function calcStandings(groupCodes, allMatches) {
  const tbl = {}
  groupCodes.forEach(c => { tbl[c] = { P:0, W:0, D:0, L:0, GF:0, GA:0, GD:0, Pts:0 } })
  allMatches.forEach(m => {
    if (m.status !== 'finished' || !m.score) return
    const { home: h, away: a, score: { home: hg, away: ag } } = m
    if (!tbl[h] || !tbl[a]) return
    tbl[h].P++; tbl[a].P++
    tbl[h].GF += hg; tbl[h].GA += ag
    tbl[a].GF += ag; tbl[a].GA += hg
    if (hg > ag)      { tbl[h].W++; tbl[h].Pts += 3; tbl[a].L++ }
    else if (ag > hg) { tbl[a].W++; tbl[a].Pts += 3; tbl[h].L++ }
    else              { tbl[h].D++; tbl[h].Pts++; tbl[a].D++; tbl[a].Pts++ }
  })
  return Object.entries(tbl)
    .map(([code, s]) => ({ code, ...s, GD: s.GF - s.GA }))
    .sort((a, b) => b.Pts - a.Pts || b.GD - a.GD || b.GF - a.GF)
}

const RES_CLS  = { W: 'bg-green-500/15 text-green-400 border-green-500/30', D: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30', L: 'bg-red-500/15 text-red-400 border-red-500/30' }
const POS_COLOR = { FW: 'text-red-400 bg-red-500/10 border-red-500/20', MF: 'text-blue-400 bg-blue-500/10 border-blue-500/20', DF: 'text-green-400 bg-green-500/10 border-green-500/20', GK: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' }

// ─── Standing row ─────────────────────────────────────────────────────────────

function StandingRow({ row, rank, highlight }) {
  const team = getTeam(row.code)
  return (
    <motion.tr
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: rank * 0.05 }}
      className={`border-b border-line/30 dark:border-white/5 last:border-0 transition-colors ${highlight ? 'bg-brand/5 dark:bg-brand/10' : 'hover:bg-elevated/60 dark:hover:bg-white/3'}`}
    >
      <td className="py-2.5 pl-3 pr-2">
        <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-black ${rank === 0 ? 'bg-yellow-400/20 text-yellow-400' : rank === 1 ? 'bg-white/10 text-muted' : 'text-muted/60'}`}>
          {rank + 1}
        </span>
      </td>
      <td className="py-2.5 pr-4">
        <Link to={`/teams/${row.code}`} className="flex items-center gap-2 font-bold text-sm text-ink hover:text-brand transition-colors">
          <TeamBadge code={row.code} size={20} cdnSize="w40" />
          <span className={highlight ? 'text-brand dark:text-brand-300' : ''}>{team.name}</span>
          {highlight && <span className="text-[10px] font-black text-brand/70 dark:text-brand-300/70">YOU</span>}
        </Link>
      </td>
      {[row.P, row.W, row.D, row.L, `${row.GF}:${row.GA}`, row.GD > 0 ? `+${row.GD}` : row.GD].map((v, i) => (
        <td key={i} className="py-2.5 px-2 text-center text-xs font-semibold text-muted tabular-nums">{v}</td>
      ))}
      <td className="py-2.5 pl-2 pr-3 text-center">
        <span className={`text-sm font-black tabular-nums ${row.Pts > 0 ? 'text-ink' : 'text-muted/50'}`}>{row.Pts}</span>
      </td>
    </motion.tr>
  )
}

// ─── Match result card ────────────────────────────────────────────────────────

function MatchResultCard({ match, myCode }) {
  const home = getTeam(match.home)
  const away = getTeam(match.away)
  const finished = match.status === 'finished' && match.score
  const live = match.status === 'live'
  const past = isPast(match)
  const result = getResult(match, myCode)
  const isHome = match.home === myCode

  const dateStr = new Date(match.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
  const timeStr = new Date(match.date).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative overflow-hidden rounded-2xl border p-4 transition-colors ${
        finished
          ? result === 'W' ? 'border-green-500/25 bg-green-500/5 dark:bg-green-500/8'
          : result === 'L' ? 'border-red-500/20 bg-red-500/5 dark:bg-red-500/8'
          : 'border-yellow-500/20 bg-yellow-500/5 dark:bg-yellow-500/8'
          : live ? 'border-red-500/30 bg-red-500/5 dark:bg-red-500/8'
          : 'border-line/50 bg-elevated/30 dark:border-white/8 dark:bg-white/2'
      }`}
    >
      {/* Stage + date row */}
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted">{match.stage} · MD{match.matchday}</span>
        <div className="flex items-center gap-1.5">
          {live && (
            <span className="flex items-center gap-1 rounded-full bg-red-500/15 border border-red-500/30 px-2 py-0.5 text-[10px] font-black text-red-400">
              <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" /> LIVE {match.minute}'
            </span>
          )}
          {finished && result && (
            <span className={`rounded-full border px-2 py-0.5 text-[11px] font-black ${RES_CLS[result]}`}>{result === 'W' ? '✓ WIN' : result === 'L' ? '✗ LOSS' : '= DRAW'}</span>
          )}
          {!live && !finished && (
            <span className="text-[10px] text-muted">{past ? 'Played' : dateStr}</span>
          )}
        </div>
      </div>

      {/* Score row */}
      <div className="flex items-center gap-3">
        {/* Home */}
        <div className={`flex flex-1 items-center gap-2 ${isHome ? '' : 'opacity-80'}`}>
          <TeamBadge code={match.home} size={28} cdnSize="w40" />
          <span className={`text-sm font-bold leading-tight ${match.home === myCode ? 'text-ink' : 'text-muted'}`}>{home.name}</span>
        </div>

        {/* Score */}
        <div className="flex shrink-0 items-center gap-1.5">
          {finished ? (
            <>
              <span className={`text-2xl font-black tabular-nums ${match.home === myCode && result === 'W' ? 'text-green-400' : match.away === myCode && result === 'W' ? 'text-muted' : 'text-ink'}`}>
                {match.score.home}
              </span>
              <span className="text-lg font-black text-muted/50">–</span>
              <span className={`text-2xl font-black tabular-nums ${match.away === myCode && result === 'W' ? 'text-green-400' : match.home === myCode && result === 'W' ? 'text-muted' : 'text-ink'}`}>
                {match.score.away}
              </span>
            </>
          ) : live ? (
            <>
              <span className="text-2xl font-black tabular-nums text-red-400">{match.score?.home ?? 0}</span>
              <span className="text-lg font-black text-red-400/50">–</span>
              <span className="text-2xl font-black tabular-nums text-red-400">{match.score?.away ?? 0}</span>
            </>
          ) : (
            <div className="flex flex-col items-center">
              <span className="text-xs font-bold text-muted">{timeStr}</span>
              <span className="text-[10px] text-muted/60">{dateStr}</span>
            </div>
          )}
        </div>

        {/* Away */}
        <div className={`flex flex-1 items-center justify-end gap-2 ${!isHome ? '' : 'opacity-80'}`}>
          <span className={`text-sm font-bold leading-tight text-right ${match.away === myCode ? 'text-ink' : 'text-muted'}`}>{away.name}</span>
          <TeamBadge code={match.away} size={28} cdnSize="w40" />
        </div>
      </div>

      {/* Venue */}
      <p className="mt-2 text-center text-[10px] text-muted/60">📍 {match.venue}</p>
    </motion.div>
  )
}

// ─── Player card ──────────────────────────────────────────────────────────────

function PlayerCard({ player }) {
  const posCls = POS_COLOR[player.position] || 'text-muted bg-white/5 border-white/10'
  return (
    <Link to={`/players/${player.id}`}>
      <motion.div
        whileHover={{ y: -2 }}
        className="group flex items-center gap-3 rounded-2xl border border-line/50 bg-elevated/40 p-3 hover:border-brand/30 hover:bg-brand/3 dark:border-white/8 dark:bg-white/2 transition-all"
      >
        <div className="relative shrink-0">
          <Avatar src={player.photo} alt={player.name} size={44} />
          <span className={`absolute -bottom-1 -right-1 rounded-full border px-1.5 text-[8px] font-black ${posCls}`}>
            {player.position}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-ink group-hover:text-brand transition-colors leading-tight">
            {player.name}
          </p>
          <p className="text-[11px] text-muted">#{player.number} · {player.club || 'Club N/A'}</p>
        </div>
        <div className="shrink-0 flex gap-2 text-right">
          {player.stats?.goals != null && (
            <div className="flex flex-col items-center">
              <span className="text-base font-black text-ink tabular-nums">{player.stats.goals}</span>
              <span className="text-[9px] font-bold uppercase text-muted">Goals</span>
            </div>
          )}
          {player.stats?.apps != null && (
            <div className="flex flex-col items-center">
              <span className="text-base font-black text-ink tabular-nums">{player.stats.apps}</span>
              <span className="text-[9px] font-bold uppercase text-muted">Apps</span>
            </div>
          )}
        </div>
      </motion.div>
    </Link>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const POS_ORDER = { FW: 0, MF: 1, DF: 2, GK: 3 }

export default function TeamProfile() {
  const { code } = useParams()
  const team = getTeam(code)
  const { isFavTeam, toggleFavTeam, matches } = useApp()

  const groupCodes = groups[team.group] || []
  const groupMates = groupCodes.filter(c => c !== code)
  const groupMatches = matches.filter(m => m.group === team.group)
  const fixtures = matches.filter(m => m.home === code || m.away === code)

  const pastMatches = fixtures.filter(m => isPast(m)).sort((a, b) => new Date(b.date) - new Date(a.date))
  const upcomingMatches = fixtures.filter(m => !isPast(m)).sort((a, b) => new Date(a.date) - new Date(b.date))

  const standings = calcStandings(groupCodes, groupMatches)
  const myRow = standings.find(r => r.code === code)
  const myRank = standings.findIndex(r => r.code === code)

  const squad = players
    .filter(p => p.team === code)
    .sort((a, b) => (POS_ORDER[a.position] ?? 9) - (POS_ORDER[b.position] ?? 9) || (b.stats?.goals ?? 0) - (a.stats?.goals ?? 0))

  const totalGoals = squad.reduce((s, p) => s + (p.stats?.goals ?? 0), 0)
  const topScorer = squad.filter(p => (p.stats?.goals ?? 0) > 0).sort((a, b) => (b.stats?.goals ?? 0) - (a.stats?.goals ?? 0))[0]

  return (
    <div className="space-y-6">

      {/* Back */}
      <Link to="/teams" className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-ink transition-colors">
        <ArrowLeft size={15} /> All teams
      </Link>

      {/* ── Hero card ── */}
      <div className="relative overflow-hidden rounded-3xl border border-line/50 bg-elevated dark:border-white/8 dark:bg-[#0b1228] p-6">
        <div className="pointer-events-none absolute -top-12 -right-12 h-48 w-48 rounded-full bg-brand/8 blur-3xl" />
        <div className="relative flex items-center gap-5">
          <div className="shrink-0">
            <TeamBadge code={code} size={80} cdnSize="w160" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              {team.host && <span className="rounded-full bg-brand/10 border border-brand/25 px-2 py-0.5 text-[10px] font-black text-brand">🏟️ HOST</span>}
              <span className="rounded-full bg-line/50 dark:bg-white/8 px-2 py-0.5 text-[10px] font-bold text-muted">Group {team.group}</span>
              <span className="rounded-full bg-line/50 dark:bg-white/8 px-2 py-0.5 text-[10px] font-bold text-muted">{team.confederation}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-ink">{flag(code)} {team.name}</h1>
            {myRow && (
              <p className="mt-1 text-sm text-muted">
                <span className="font-bold text-ink">{myRow.Pts} pts</span> · {myRow.W}W {myRow.D}D {myRow.L}L · Rank <span className="font-bold text-ink">#{myRank + 1}</span> in group
              </p>
            )}
          </div>
          <button
            onClick={() => toggleFavTeam(code)}
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-colors ${isFavTeam(code) ? 'border-red-500/40 bg-red-500/10 text-red-500' : 'border-line/60 text-muted hover:text-red-500 dark:border-white/10'}`}
          >
            <span className={`text-xl ${isFavTeam(code) ? '' : 'grayscale opacity-50'}`}>❤️</span>
          </button>
        </div>

        {/* Quick stats */}
        {myRow && (
          <div className="relative mt-5 grid grid-cols-4 gap-2 sm:grid-cols-4">
            {[
              { icon: '⚽', val: myRow.GF, label: 'Goals For' },
              { icon: '🛡️', val: myRow.GA, label: 'Goals Against' },
              { icon: '📊', val: myRow.GD > 0 ? `+${myRow.GD}` : myRow.GD, label: 'Goal Diff' },
              { icon: '🏅', val: myRow.Pts, label: 'Points' },
            ].map(({ icon, val, label }) => (
              <div key={label} className="flex flex-col items-center rounded-xl border border-line/40 bg-surface/60 dark:border-white/6 dark:bg-white/3 px-2 py-3">
                <span className="text-base">{icon}</span>
                <span className="text-lg font-black tabular-nums text-ink">{val}</span>
                <span className="text-[9px] font-bold uppercase tracking-wider text-muted mt-0.5">{label}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Group Standings ── */}
      {groupCodes.length > 0 && (
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-muted">
            <Trophy size={13} /> Group {team.group} Standings
          </h2>
          <div className="overflow-hidden rounded-2xl border border-line/50 dark:border-white/8">
            <table className="w-full">
              <thead>
                <tr className="border-b border-line/40 dark:border-white/8 bg-elevated/60 dark:bg-white/3">
                  <th className="py-2 pl-3 pr-2 text-left text-[10px] font-black uppercase tracking-wider text-muted w-8">#</th>
                  <th className="py-2 pr-4 text-left text-[10px] font-black uppercase tracking-wider text-muted">Team</th>
                  {['P','W','D','L','Score','GD','Pts'].map(h => (
                    <th key={h} className="py-2 px-2 text-center text-[10px] font-black uppercase tracking-wider text-muted">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {standings.map((row, i) => (
                  <StandingRow key={row.code} row={row} rank={i} highlight={row.code === code} />
                ))}
              </tbody>
            </table>
            {standings.every(r => r.P === 0) && (
              <p className="py-6 text-center text-sm text-muted">No matches played yet in Group {team.group}</p>
            )}
          </div>
          <p className="mt-1.5 text-[10px] text-muted/60 pl-1">Top 2 teams advance to Round of 32</p>
        </section>
      )}

      {/* ── Group rivals ── */}
      <section>
        <h2 className="mb-2.5 text-xs font-black uppercase tracking-widest text-muted">Group {team.group} Rivals</h2>
        <div className="flex flex-wrap gap-2">
          {groupMates.map(c => (
            <Link key={c} to={`/teams/${c}`} className="inline-flex items-center gap-2 rounded-xl border border-line/60 bg-elevated/60 px-3 py-1.5 text-sm font-semibold text-muted hover:border-brand/40 hover:text-brand transition-colors dark:border-white/8 dark:bg-white/3">
              <TeamBadge code={c} size={18} cdnSize="w40" /> {getTeam(c).name}
            </Link>
          ))}
        </div>
      </section>

      {/* ── Past Results ── */}
      {pastMatches.length > 0 && (
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-muted">
            <CheckCircle2 size={13} /> Results ({pastMatches.length})
          </h2>
          <div className="grid gap-3 md:grid-cols-2">
            {pastMatches.map(m => (
              <MatchResultCard key={m.id} match={m} myCode={code} />
            ))}
          </div>
        </section>
      )}

      {/* ── Upcoming ── */}
      {upcomingMatches.length > 0 && (
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-muted">
            <Clock size={13} /> Upcoming ({upcomingMatches.length})
          </h2>
          <div className="grid gap-3 md:grid-cols-2">
            {upcomingMatches.map(m => (
              <MatchResultCard key={m.id} match={m} myCode={code} />
            ))}
          </div>
        </section>
      )}

      {/* ── Squad ── */}
      {squad.length > 0 && (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-muted">
              <Target size={13} /> Squad ({squad.length} players)
            </h2>
            {topScorer && (
              <span className="text-[11px] text-muted">
                Top scorer: <span className="font-bold text-ink">{topScorer.name}</span> ({topScorer.stats.goals} goals)
              </span>
            )}
          </div>

          {/* Position groups */}
          {['FW', 'MF', 'DF', 'GK'].map(pos => {
            const group = squad.filter(p => p.position === pos)
            if (!group.length) return null
            const labels = { FW: '⚡ Forwards', MF: '🔄 Midfielders', DF: '🛡️ Defenders', GK: '🧤 Goalkeepers' }
            return (
              <div key={pos} className="mb-4">
                <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-muted/70">{labels[pos]}</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {group.map(p => <PlayerCard key={p.id} player={p} />)}
                </div>
              </div>
            )
          })}
        </section>
      )}
    </div>
  )
}
