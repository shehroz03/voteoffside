import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Heart, GitCompare } from 'lucide-react'
import { getPlayer } from '../lib/players.js'
import { getTeam } from '../lib/teams.js'
import TeamBadge from '../components/TeamBadge.jsx'
import { useApp } from '../context/AppContext.jsx'

const STAT_MAX = { apps: 220, goals: 140, assists: 60, rating: 10 }

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

  return (
    <div className="space-y-6">
      <Link to="/players" className="inline-flex items-center gap-1 text-sm font-semibold text-muted hover:text-ink">
        <ArrowLeft size={16} /> All players
      </Link>

      <div className="card p-6">
        <div className="flex items-start gap-4">
          <TeamBadge code={player.team} size={72} cdnSize="w160" />
          <div className="flex-1">
            <h1 className="text-2xl font-extrabold">{player.name}</h1>
            <p className="text-sm text-muted">
              <Link to={`/teams/${player.team}`} className="hover:text-brand">
                {team.name}
              </Link>{' '}
              · {player.position} · #{player.number}
            </p>
            <p className="mt-1 text-sm text-muted">{player.club} · Age {player.age}</p>
          </div>
          <button
            onClick={() => toggleFavPlayer(player.id)}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-line hover:text-red-500"
            aria-label="Favourite"
          >
            <Heart size={20} className={isFavPlayer(player.id) ? 'fill-red-500 text-red-500' : ''} />
          </button>
        </div>

        <button
          onClick={() => navigate(`/compare?add=${player.id}`)}
          className="btn-primary mt-5 w-full"
        >
          <GitCompare size={16} /> Add to comparison
        </button>
      </div>

      <section className="card p-5">
        <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-muted">
          Career stats (sample)
        </h2>
        <div className="space-y-4">
          {Object.entries(player.stats).map(([k, v]) => (
            <div key={k}>
              <div className="mb-1 flex justify-between text-sm">
                <span className="font-semibold capitalize">{k}</span>
                <span className="tabular-nums text-muted">{v}</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-line">
                <div
                  className="vote-fill h-full rounded-full bg-brand"
                  style={{ width: `${Math.min(100, (v / (STAT_MAX[k] || 100)) * 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
