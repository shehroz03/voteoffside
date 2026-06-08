import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Heart, GitCompare, Briefcase, Trophy } from 'lucide-react'
import { motion } from 'framer-motion'
import { getPlayer, players } from '../lib/players.js'
import { getTeam } from '../lib/teams.js'
import TeamBadge from '../components/TeamBadge.jsx'
import Avatar from '../components/Avatar.jsx'
import { useApp } from '../context/AppContext.jsx'

const STAT_MAX = { apps: 220, goals: 140, assists: 60, rating: 10 }
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
              <span className="text-2xl font-extrabold leading-none text-ink dark:text-ink">
                #{player.number}
              </span>
              <span className="text-xs font-semibold text-muted">Age {player.age}</span>
            </div>

            {/* Personal Details */}
            {(player.fullName || player.birthDate || player.height) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-xs text-muted pt-3 w-full border-t border-line/50">
                {player.fullName && <div><span className="font-semibold text-ink">Full Name:</span> {player.fullName}</div>}
                {player.birthDate && <div><span className="font-semibold text-ink">Born:</span> {player.birthDate} {player.birthPlace && `(${player.birthPlace})`}</div>}
                {player.height && <div><span className="font-semibold text-ink">Height:</span> {player.height}</div>}
              </div>
            )}
          </div>

          {/* Right: photo with flag overlay */}
          <div className="relative shrink-0">
            <Avatar src={player.photo} alt={player.name} size={140} />
            {/* Flag overlay */}
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
            <div
              key={stat}
              className="card flex flex-col items-center gap-2 p-4 text-center"
            >
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

      {/* Bio and Honours */}
      {(player.bio || (player.honours && player.honours.length > 0)) && (
        <motion.section {...fadeIn} transition={{ delay: 0.12 }} className="card p-5 space-y-5">
          {player.bio && (
            <div>
              <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-muted">
                Biography
              </h2>
              <p className="text-sm leading-relaxed text-ink/90">
                {player.bio}
              </p>
            </div>
          )}
          
          {player.honours && player.honours.length > 0 && (
            <div>
              <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-muted flex items-center gap-2">
                <Trophy size={16} /> Major Honours
              </h2>
              <div className="flex flex-wrap gap-3">
                {player.honours.map((honour, idx) => (
                  <div key={idx} className="flex items-center gap-1.5 rounded-lg border border-line/60 bg-line/20 px-3 py-1.5 text-xs font-semibold">
                    <Trophy size={14} className="text-brand" />
                    <span>{honour.count}x {honour.title}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.section>
      )}

      {/* Stat bars section */}
      <motion.section {...fadeIn} transition={{ delay: 0.15 }} className="card p-5">
        <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-muted">
          Career progression
        </h2>
        <div className="space-y-4">
          {Object.entries(player.stats).map(([k, v]) => (
            <div key={k}>
              <div className="mb-1 flex justify-between text-sm">
                <span className="font-semibold capitalize">{STAT_LABELS[k]}</span>
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

      {/* Career history section */}
      <motion.section {...fadeIn} transition={{ delay: 0.2 }} className="card p-5">
        <h2 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted">
          <Briefcase size={16} />
          Club career
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
