import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Heart, GitCompare, Briefcase, Trophy } from 'lucide-react'
import { motion } from 'framer-motion'
import { getPlayer, players } from '../lib/players.js'
import { getTeam } from '../lib/teams.js'
import TeamBadge from '../components/TeamBadge.jsx'
import Avatar from '../components/Avatar.jsx'
import { useApp } from '../context/AppContext.jsx'

const STAT_MAX = { apps: 900, goals: 700, assists: 370, rating: 10 }
const STAT_LABELS = { apps: 'Appearances', goals: 'Goals', assists: 'Assists', rating: 'Rating' }

const POSITION_COLORS = {
  FW: { bg: 'bg-red-500/15', text: 'text-red-600 dark:text-red-400', label: 'Forward' },
  MF: { bg: 'bg-blue-500/15', text: 'text-blue-600 dark:text-blue-400', label: 'Midfielder' },
  DF: { bg: 'bg-green-500/15', text: 'text-green-600 dark:text-green-400', label: 'Defender' },
  GK: { bg: 'bg-yellow-500/15', text: 'text-yellow-600 dark:text-yellow-400', label: 'Goalkeeper' },
}

const fadeIn = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4 },
}

function trophyEmoji(title) {
  const t = (title || '').toLowerCase()
  if (t.includes('world cup') && !t.includes('club')) return '🏆'
  if (t.includes('champions league') || t.includes('ucl')) return '⭐'
  if (t.includes('ballon')) return '🎖️'
  if (t.includes('la liga') || t.includes('premier league') || t.includes('bundesliga') || t.includes('serie a') || t.includes('ligue 1') || t.includes('eredivisie') || t.includes('liga')) return '🥇'
  if (t.includes('copa america') || t.includes('copa américa') || t.includes('european championship') || t.includes('afcon') || t.includes('nations league') || t.includes('finalissima')) return '🏅'
  if (t.includes('copa del rey') || t.includes('dfb-pokal') || t.includes('fa cup') || t.includes('league cup') || t.includes('copa libertadores') || t.includes('pokal')) return '🏵️'
  if (t.includes('club world cup') || t.includes('intercontinental')) return '🌍'
  if (t.includes('puskas') || t.includes('golden boot')) return '⚽'
  if (t.includes('kopa') || t.includes('young player')) return '🌟'
  if (t.includes('golden ball') || t.includes('golden glove')) return '🥇'
  return '🏆'
}

function trophyCardColor(title) {
  const t = (title || '').toLowerCase()
  if (t.includes('world cup') && !t.includes('club')) return 'border-yellow-500/50 bg-yellow-500/10'
  if (t.includes('champions league')) return 'border-yellow-400/40 bg-yellow-400/8'
  if (t.includes('ballon')) return 'border-amber-500/40 bg-amber-500/8'
  return 'border-line/60 bg-elevated/40'
}

function wcStageBadgeClass(stage) {
  if (stage === 'Winner') return 'border-yellow-400/60 bg-yellow-400/20 text-yellow-400'
  if (stage === 'Runner-up') return 'border-slate-400/50 bg-slate-400/15 text-slate-300'
  if (stage === '3rd Place') return 'border-amber-600/50 bg-amber-600/15 text-amber-500'
  if (stage === '4th Place') return 'border-teal-600/50 bg-teal-600/15 text-teal-400'
  if (stage === 'Semi-Final') return 'border-blue-500/40 bg-blue-500/12 text-blue-400'
  if (stage === 'Quarter-Final') return 'border-blue-400/35 bg-blue-400/10 text-blue-300'
  if (stage === 'Round of 16') return 'border-indigo-400/30 bg-indigo-400/8 text-indigo-300'
  return 'border-line/40 bg-line/20 text-muted'
}

function wcStageIcon(stage) {
  if (stage === 'Winner') return '🏆'
  if (stage === 'Runner-up') return '🥈'
  if (stage === '3rd Place') return '🥉'
  if (stage === '4th Place') return '4️⃣'
  if (stage === 'Semi-Final') return '🔵'
  if (stage === 'Quarter-Final') return '🔵'
  if (stage === 'Round of 16') return '⚪'
  return '⚫'
}

export default function PlayerProfile() {
  const { id } = useParams()
  const navigate = useNavigate()
  const player = getPlayer(id)
  const { isFavPlayer, toggleFavPlayer } = useApp()

  if (!player) {
    return (
      <div className="py-16 text-center">
        <p className="text-muted">Player not found.</p>
        <Link to="/players" className="mt-3 inline-block font-semibold text-brand">
          Back to players
        </Link>
      </div>
    )
  }

  const team = getTeam(player.team)
  const posColors = POSITION_COLORS[player.position] || POSITION_COLORS.FW
  const similarPlayers = players
    .filter((p) => p.team === player.team && p.id !== player.id)
    .slice(0, 4)

  return (
    <div className="space-y-6">
      {/* Back button */}
      <motion.div {...fadeIn}>
        <Link to="/players" className="inline-flex items-center gap-1 text-sm font-semibold text-muted hover:text-ink">
          <ArrowLeft size={16} /> All players
        </Link>
      </motion.div>

      {/* Hero section */}
      <motion.div {...fadeIn} transition={{ delay: 0.05 }} className="card overflow-hidden">
        <div className="flex flex-col items-start gap-6 p-6 sm:flex-row sm:items-end">
          {/* Left: info */}
          <div className="flex-1 space-y-4">
            <div>
              <h1 className="text-4xl font-extrabold tracking-tight leading-none">
                {player.name}
              </h1>
            </div>

            {/* Country + Club */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <TeamBadge code={player.team} size={24} cdnSize="w40" />
                <Link to={`/teams/${player.team}`} className="text-sm font-semibold text-muted hover:text-brand">
                  {team.name}
                </Link>
              </div>
              <p className="text-sm text-muted">{player.club}</p>
            </div>

            {/* Position badge + number + age */}
            <div className="flex flex-wrap items-center gap-2.5">
              <div className={`rounded-full px-3 py-1.5 text-xs font-bold ${posColors.bg} ${posColors.text}`}>
                {posColors.label}
              </div>
              {player.number && (
                <span className="text-2xl font-extrabold leading-none text-ink dark:text-ink">
                  #{player.number}
                </span>
              )}
              <span className="text-xs font-semibold text-muted">Age {player.age}</span>
              {player.preferredFoot && (
                <span className="rounded-full border border-line/50 bg-elevated px-2.5 py-1 text-xs font-semibold text-muted">
                  {player.preferredFoot === 'Both' ? '⚽ Both feet' : `${player.preferredFoot === 'Left' ? '🦶 Left' : '🦶 Right'} foot`}
                </span>
              )}
            </div>

            {/* Personal Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-xs text-muted pt-3 w-full border-t border-line/50">
              {player.fullName && <div><span className="font-semibold text-ink">Full Name:</span> {player.fullName}</div>}
              {player.birthDate && (
                <div>
                  <span className="font-semibold text-ink">Born:</span> {player.birthDate}
                  {player.birthPlace && ` — ${player.birthPlace}`}
                </div>
              )}
              {player.height && <div><span className="font-semibold text-ink">Height:</span> {player.height}</div>}
              {player.nationalTeamCaps && (
                <div><span className="font-semibold text-ink">Intl. Caps:</span> {player.nationalTeamCaps}</div>
              )}
            </div>
          </div>

          {/* Right: photo with flag overlay */}
          <div className="relative shrink-0">
            <Avatar src={player.photo} alt={player.name} size={140} />
            <div className="absolute -bottom-2 -right-2">
              <TeamBadge code={player.team} size={56} cdnSize="w80" />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats strip */}
      <motion.div {...fadeIn} transition={{ delay: 0.1 }}>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {['apps', 'goals', 'assists', 'rating'].map((stat) => (
            <div key={stat} className="card flex flex-col items-center gap-2 p-4 text-center">
              <div className="text-3xl font-extrabold text-brand">
                {player.stats[stat]}
              </div>
              <div className="text-xs font-semibold uppercase tracking-wider text-muted">
                {STAT_LABELS[stat]}
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Bio */}
      {player.bio && (
        <motion.section {...fadeIn} transition={{ delay: 0.12 }} className="card p-5">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-muted">Biography</h2>
          <p className="text-sm leading-relaxed text-ink/90">{player.bio}</p>
        </motion.section>
      )}

      {/* Honours shelf — actual trophy icons, one per win */}
      {player.honours && player.honours.length > 0 && (
        <motion.section {...fadeIn} transition={{ delay: 0.14 }} className="card p-5">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted">
            <Trophy size={16} /> Honours Cabinet
          </h2>
          <div className="flex flex-wrap gap-3">
            {player.honours.map((honour, idx) => {
              const icon = trophyEmoji(honour.title)
              const cardCls = trophyCardColor(honour.title)
              const displayCount = Math.min(honour.count, 8)
              const overflow = honour.count > 8 ? honour.count - 8 : 0
              return (
                <div
                  key={idx}
                  className={`flex flex-col items-center gap-1.5 rounded-xl border px-3 py-2.5 min-w-[80px] ${cardCls}`}
                >
                  <div className="flex flex-wrap justify-center gap-0.5 leading-none">
                    {Array.from({ length: displayCount }).map((_, i) => (
                      <span key={i} className="text-lg leading-none">{icon}</span>
                    ))}
                    {overflow > 0 && (
                      <span className="ml-0.5 text-xs font-bold text-muted self-center">+{overflow}</span>
                    )}
                  </div>
                  <span className="text-center text-[11px] font-semibold text-muted leading-tight">{honour.title}</span>
                </div>
              )
            })}
          </div>
        </motion.section>
      )}

      {/* World Cup History timeline */}
      {player.worldCupHistory && player.worldCupHistory.length > 0 && (
        <motion.section {...fadeIn} transition={{ delay: 0.16 }} className="card p-5">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted">
            🌍 World Cup History
          </h2>
          <div className="relative pl-5">
            {/* Vertical line */}
            <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-line/60 rounded-full" />
            <div className="space-y-4">
              {player.worldCupHistory.map((wc, idx) => (
                <div key={idx} className="relative flex items-start gap-3">
                  {/* Dot on timeline */}
                  <div className="absolute -left-3 top-1.5 h-2.5 w-2.5 rounded-full border-2 border-brand bg-elevated" />
                  {/* Content */}
                  <div className="flex-1 flex flex-wrap items-center gap-2">
                    <span className="text-sm font-extrabold text-ink">{wc.year}</span>
                    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-bold ${wcStageBadgeClass(wc.stage)}`}>
                      {wcStageIcon(wc.stage)} {wc.stage}
                    </span>
                    {(wc.goals > 0 || wc.assists > 0) && (
                      <span className="text-xs text-muted">
                        {wc.goals > 0 && `⚽ ${wc.goals} goal${wc.goals !== 1 ? 's' : ''}`}
                        {wc.goals > 0 && wc.assists > 0 && '  '}
                        {wc.assists > 0 && `🎯 ${wc.assists} assist${wc.assists !== 1 ? 's' : ''}`}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.section>
      )}

      {/* Stat bars section */}
      <motion.section {...fadeIn} transition={{ delay: 0.18 }} className="card p-5">
        <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-muted">Career Stats</h2>
        <div className="space-y-4">
          {Object.entries(player.stats).map(([k, v]) => (
            <div key={k}>
              <div className="mb-1 flex justify-between text-sm">
                <span className="font-semibold capitalize">{STAT_LABELS[k] || k}</span>
                <span className="tabular-nums text-muted">{v}</span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-line">
                <motion.div
                  className="h-full rounded-full bg-brand-gradient"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, (v / (STAT_MAX[k] || 100)) * 100)}%` }}
                  transition={{ duration: 0.6, ease: 'easeOut', delay: 0.2 }}
                />
              </div>
            </div>
          ))}
        </div>
      </motion.section>

      {/* Club career table */}
      <motion.section {...fadeIn} transition={{ delay: 0.2 }} className="card p-5">
        <h2 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted">
          <Briefcase size={16} /> Club Career
        </h2>
        {player.career && player.career.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-line/60">
                <tr className="text-left text-xs font-bold uppercase tracking-wider text-muted">
                  <th className="pb-2 pr-3">Club</th>
                  <th className="pb-2 pr-3">Years</th>
                  <th className="pb-2 pr-3">Apps</th>
                  <th className="pb-2">Goals</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/40">
                {player.career.map((c, i) => (
                  <tr key={i} className="text-sm">
                    <td className="py-3 pr-3 font-semibold">{c.club}</td>
                    <td className="py-3 pr-3 text-muted">{c.years}</td>
                    <td className="py-3 pr-3 tabular-nums">{c.apps}</td>
                    <td className="py-3 tabular-nums">{c.goals}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 py-8 text-center text-muted">
            <Briefcase size={32} className="opacity-40" />
            <p className="text-sm">Career history coming soon</p>
          </div>
        )}
      </motion.section>

      {/* Similar players */}
      {similarPlayers.length > 0 && (
        <motion.section {...fadeIn} transition={{ delay: 0.25 }}>
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-muted">
            More from {team.name}
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {similarPlayers.map((p) => (
              <Link
                key={p.id}
                to={`/players/${p.id}`}
                className="group card flex flex-col items-center gap-3 p-4 transition-all hover:shadow-lg"
              >
                <Avatar src={p.photo} alt={p.name} size={80} />
                <div className="w-full text-center">
                  <div className="font-bold leading-tight text-sm truncate">{p.name}</div>
                  <div className={`text-xs font-semibold ${POSITION_COLORS[p.position]?.text || 'text-muted'}`}>
                    {POSITION_COLORS[p.position]?.label || p.position}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </motion.section>
      )}

      {/* Actions */}
      <motion.div {...fadeIn} transition={{ delay: 0.3 }} className="flex gap-3">
        <button
          onClick={() => navigate(`/compare?add=${player.id}`)}
          className="btn-primary flex-1"
        >
          <GitCompare size={16} /> Add to comparison
        </button>
        <button
          onClick={() => toggleFavPlayer(player.id)}
          className="flex h-12 w-12 items-center justify-center rounded-xl border border-line hover:text-red-500 transition-colors"
          aria-label="Favourite"
        >
          <Heart size={20} className={isFavPlayer(player.id) ? 'fill-red-500 text-red-500' : ''} />
        </button>
      </motion.div>
    </div>
  )
}
