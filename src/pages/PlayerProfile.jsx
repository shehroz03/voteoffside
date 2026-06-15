import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Heart, GitCompare, Briefcase, Trophy, Activity, Target, Star, Zap } from 'lucide-react'
import { motion, useMotionValue, animate, useReducedMotion } from 'framer-motion'
import { getPlayer, players } from '../lib/players.js'
import { getTeam } from '../lib/teams.js'
import TeamBadge from '../components/TeamBadge.jsx'
import Avatar from '../components/Avatar.jsx'
import { useApp } from '../context/AppContext.jsx'
import { useSeo } from '../lib/seo.js'
import { personalLife } from '../data/playerPersonalLife.js'
import PersonalLifeModal from '../components/PersonalLifeModal.jsx'

const STAT_MAX = { apps: 900, goals: 700, assists: 370, rating: 10 }
const STAT_LABELS = { apps: 'Appearances', goals: 'Goals', assists: 'Assists', rating: 'Rating' }

const POSITION_COLORS = {
  FW: { bg: 'bg-red-500/15',    text: 'text-red-600 dark:text-red-400',    label: 'Forward' },
  MF: { bg: 'bg-blue-500/15',   text: 'text-blue-600 dark:text-blue-400',   label: 'Midfielder' },
  DF: { bg: 'bg-green-500/15',  text: 'text-green-600 dark:text-green-400', label: 'Defender' },
  GK: { bg: 'bg-yellow-500/15', text: 'text-yellow-600 dark:text-yellow-400',label: 'Goalkeeper' },
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
  if (stage === 'Winner')        return 'border-yellow-400/60 bg-yellow-400/20 text-yellow-400'
  if (stage === 'Runner-up')     return 'border-slate-400/50 bg-slate-400/15 text-slate-300'
  if (stage === '3rd Place')     return 'border-amber-600/50 bg-amber-600/15 text-amber-500'
  if (stage === '4th Place')     return 'border-teal-600/50 bg-teal-600/15 text-teal-400'
  if (stage === 'Semi-Final')    return 'border-blue-500/40 bg-blue-500/12 text-blue-400'
  if (stage === 'Quarter-Final') return 'border-blue-400/35 bg-blue-400/10 text-blue-300'
  if (stage === 'Round of 16')   return 'border-indigo-400/30 bg-indigo-400/8 text-indigo-300'
  return 'border-line/40 bg-line/20 text-muted'
}

function wcStageIcon(stage) {
  if (stage === 'Winner')        return '🏆'
  if (stage === 'Runner-up')     return '🥈'
  if (stage === '3rd Place')     return '🥉'
  if (stage === '4th Place')     return '4️⃣'
  if (stage === 'Semi-Final')    return '🔵'
  if (stage === 'Quarter-Final') return '🔵'
  if (stage === 'Round of 16')   return '⚪'
  return '⚫'
}

function PartnerAvatar({ photo, name }) {
  const [failed, setFailed] = useState(false)
  const initials = name ? name.split(' ').map(w => w[0]).slice(0, 2).join('') : '?'
  if (!photo || failed) {
    return (
      <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-500/20 to-purple-500/20 text-2xl font-black text-pink-400 ring-2 ring-pink-500/20">
        {initials}
      </div>
    )
  }
  return (
    <img
      src={photo}
      alt={name}
      onError={() => setFailed(true)}
      referrerPolicy="no-referrer"
      className="h-20 w-20 shrink-0 rounded-2xl object-cover ring-2 ring-pink-500/25"
    />
  )
}

function CountUp({ to, decimals = 0, color }) {
  const reduced = useReducedMotion()
  const mv = useMotionValue(0)
  const [display, setDisplay] = useState('0')
  useEffect(() => {
    const ctrl = animate(mv, to, {
      duration: reduced ? 0 : 1.1,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setDisplay(decimals ? v.toFixed(decimals) : Math.round(v).toLocaleString()),
    })
    return ctrl.stop
  }, [to]) // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <span className="text-2xl font-black tabular-nums leading-none" style={{ color }}>
      {display}
    </span>
  )
}

export default function PlayerProfile() {
  const { id } = useParams()
  const navigate = useNavigate()
  const player = getPlayer(id)
  const { isFavPlayer, toggleFavPlayer } = useApp()

  useSeo(player ? {
    title: `${player.name} — ${getTeam(player.team).name} | World Cup 2026 Stats`,
    description: `${player.name} (${getTeam(player.team).name}) profile for the 2026 FIFA World Cup — position, goals, assists, appearances and career stats.`,
    path: `/players/${id}`,
  } : { title: 'Player Profile', path: `/players/${id}` })

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
  const life = personalLife[player.id] || null
  const [lifeOpen, setLifeOpen] = useState(false)

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

            {/* Personal Life modal button */}
            {life && (
              <button
                onClick={() => setLifeOpen(true)}
                className="mt-1 inline-flex items-center gap-2 rounded-full border border-pink-500/30 bg-pink-500/8 px-4 py-1.5 text-xs font-bold text-pink-400 hover:bg-pink-500/20 active:scale-95 transition-all"
              >
                ❤️ Personal Life & Family
                {life.partner?.name && life.partner.name !== 'Keeps private life private' && (
                  <span className="text-pink-300/70">· {life.partner.name}</span>
                )}
                {life.children?.length > 0 && (
                  <span className="rounded-full bg-pink-500/20 px-1.5 py-0.5 text-[10px]">
                    {life.children.length} kids
                  </span>
                )}
              </button>
            )}
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

      {/* Honours shelf */}
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
            <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-line/60 rounded-full" />
            <div className="space-y-4">
              {player.worldCupHistory.map((wc, idx) => (
                <div key={idx} className="relative flex items-start gap-3">
                  <div className="absolute -left-3 top-1.5 h-2.5 w-2.5 rounded-full border-2 border-brand bg-elevated" />
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

      {/* Career Stats */}
      <motion.section {...fadeIn} transition={{ delay: 0.18 }} className="card p-5">
        <h2 className="mb-5 text-sm font-bold uppercase tracking-wider text-muted">Career Stats</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Object.entries(player.stats).map(([k, v], i) => {
            const cfg = {
              apps:    { label: 'Appearances', icon: Activity, grad: 'from-blue-500 to-cyan-400',    glow: 'rgba(59,130,246,0.3)',  ring: '#3b82f6' },
              goals:   { label: 'Goals',       icon: Target,   grad: 'from-red-500 to-orange-400',   glow: 'rgba(239,68,68,0.3)',   ring: '#ef4444' },
              assists: { label: 'Assists',     icon: Zap,      grad: 'from-purple-500 to-pink-400',  glow: 'rgba(168,85,247,0.3)', ring: '#a855f7' },
              rating:  { label: 'Rating',      icon: Star,     grad: 'from-yellow-400 to-amber-300', glow: 'rgba(251,191,36,0.3)', ring: '#fbbf24' },
            }[k] || { label: k, icon: Activity, grad: 'from-brand to-cyan-400', glow: 'rgba(26,86,219,0.3)', ring: '#1a56db' }

            const pct = Math.min(100, (v / (STAT_MAX[k] || 100)) * 100)
            const Icon = cfg.icon
            const r = 20
            const circumference = 2 * Math.PI * r

            return (
              <motion.div
                key={k}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.06, duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                className="relative flex flex-col items-center gap-2 rounded-xl border border-line/50 bg-elevated/40 px-3 py-3 dark:border-white/8 dark:bg-white/3"
                whileHover={{ boxShadow: `0 4px 18px ${cfg.glow}` }}
              >
                <div className="relative">
                  <svg width="52" height="52" viewBox="0 0 52 52" className="-rotate-90">
                    <circle cx="26" cy="26" r={r} fill="none" stroke="currentColor" strokeWidth="4"
                      className="text-line/50 dark:text-white/10" />
                    <motion.circle
                      cx="26" cy="26" r={r} fill="none"
                      stroke={cfg.ring} strokeWidth="4" strokeLinecap="round"
                      strokeDasharray={circumference}
                      initial={{ strokeDashoffset: circumference }}
                      animate={{ strokeDashoffset: circumference - (pct / 100) * circumference }}
                      transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.15 + i * 0.06 }}
                      style={{ filter: `drop-shadow(0 0 3px ${cfg.ring})` }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Icon size={14} style={{ color: cfg.ring }} />
                  </div>
                </div>

                <CountUp to={typeof v === 'number' ? v : parseFloat(v)} decimals={k === 'rating' ? 1 : 0} color={cfg.ring} />

                <span className="text-[10px] font-bold uppercase tracking-widest text-muted text-center leading-tight">
                  {cfg.label}
                </span>

                <div className="h-0.5 w-full overflow-hidden rounded-full bg-line/40 dark:bg-white/8">
                  <motion.div
                    className={`h-full rounded-full bg-gradient-to-r ${cfg.grad}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.15 + i * 0.06 }}
                  />
                </div>
              </motion.div>
            )
          })}
        </div>
      </motion.section>

      {/* Club career */}
      <motion.section {...fadeIn} transition={{ delay: 0.2 }} className="card p-5">
        <h2 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted">
          <Briefcase size={16} /> Club Career
        </h2>
        {player.career && player.career.length > 0 ? (
          <div className="space-y-1.5">
            <div className="grid grid-cols-[1fr_auto_auto_auto] gap-x-4 px-3 pb-1.5 border-b border-line/50">
              {['Club', 'Years', 'Apps', 'Goals'].map((h) => (
                <span key={h} className="text-[10px] font-bold uppercase tracking-widest text-muted">{h}</span>
              ))}
            </div>
            {player.career.map((c, i) => {
              const isCurrent = (c.years || '').toLowerCase().includes('present')
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.22 + i * 0.05, duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
                  className={`grid grid-cols-[1fr_auto_auto_auto] gap-x-4 items-center rounded-xl px-3 py-2.5 transition-colors ${
                    isCurrent
                      ? 'bg-brand/8 border border-brand/20 dark:bg-brand/10'
                      : 'hover:bg-elevated dark:hover:bg-white/4'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {isCurrent && (
                      <span className="shrink-0 h-1.5 w-1.5 rounded-full bg-green-400 shadow-[0_0_4px_rgba(74,222,128,0.8)]" />
                    )}
                    <span className={`text-sm font-semibold truncate ${isCurrent ? 'text-brand' : 'text-ink'}`}>
                      {c.club}
                    </span>
                  </div>
                  <span className="text-xs text-muted tabular-nums whitespace-nowrap">{c.years}</span>
                  <span className="text-sm font-semibold tabular-nums text-right">{c.apps}</span>
                  <span className={`text-sm font-bold tabular-nums text-right ${c.goals > 50 ? 'text-orange-400' : ''}`}>
                    {c.goals}
                  </span>
                </motion.div>
              )
            })}
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

      {/* Personal Life Modal */}
      {lifeOpen && life && (
        <PersonalLifeModal
          life={life}
          playerName={player.name}
          onClose={() => setLifeOpen(false)}
        />
      )}
    </div>
  )
}
