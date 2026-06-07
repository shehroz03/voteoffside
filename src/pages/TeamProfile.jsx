import { useParams, Link } from 'react-router-dom'
import { Heart, ArrowLeft } from 'lucide-react'
import { getTeam, flag, groups } from '../lib/teams.js'
import { players } from '../lib/players.js'
import { useApp } from '../context/AppContext.jsx'
import MatchCard from '../components/MatchCard.jsx'

export default function TeamProfile() {
  const { code } = useParams()
  const team = getTeam(code)
  const { isFavTeam, toggleFavTeam, matches } = useApp()

  const groupMates = (groups[team.group] || []).filter((c) => c !== code)
  const fixtures = matches.filter((m) => m.home === code || m.away === code)
  const squad = players.filter((p) => p.team === code)

  return (
    <div className="space-y-6">
      <Link to="/teams" className="inline-flex items-center gap-1 text-sm font-semibold text-muted hover:text-ink">
        <ArrowLeft size={16} /> All teams
      </Link>

      <div className="card flex items-center gap-4 p-5">
        <div className="text-6xl">{flag(code)}</div>
        <div className="flex-1">
          <h1 className="text-2xl font-extrabold">{team.name}</h1>
          <p className="text-sm text-muted">
            Group {team.group} · {team.confederation}
            {team.host && <span className="ml-1 text-brand">· Host nation</span>}
          </p>
        </div>
        <button
          onClick={() => toggleFavTeam(code)}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-line hover:text-red-500"
          aria-label="Favourite"
        >
          <Heart size={20} className={isFavTeam(code) ? 'fill-red-500 text-red-500' : ''} />
        </button>
      </div>

      <section>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-muted">
          Group {team.group} rivals
        </h2>
        <div className="flex flex-wrap gap-2">
          {groupMates.map((c) => (
            <Link key={c} to={`/teams/${c}`} className="chip">
              <span className="text-lg">{flag(c)}</span> {getTeam(c).name}
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-muted">Fixtures</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {fixtures.map((m) => (
            <MatchCard key={m.id} match={m} />
          ))}
        </div>
      </section>

      {squad.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-muted">
            Key players
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {squad.map((p) => (
              <Link key={p.id} to={`/players/${p.id}`} className="card p-3">
                <div className="font-bold leading-tight">{p.name}</div>
                <div className="text-xs text-muted">
                  {p.position} · #{p.number}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
