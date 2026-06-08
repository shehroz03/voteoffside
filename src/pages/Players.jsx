import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Heart, GitCompare } from 'lucide-react'
import { players, positions } from '../lib/players.js'
import { getTeam, teams } from '../lib/teams.js'
import TeamBadge from '../components/TeamBadge.jsx'
import { useApp } from '../context/AppContext.jsx'
import AdSlot from '../components/AdSlot.jsx'
import { StaggerList, StaggerItem } from '../motion.jsx'

export default function Players() {
  const { isFavPlayer, toggleFavPlayer } = useApp()
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [pos, setPos] = useState('all')
  const [team, setTeam] = useState('all')

  const teamOptions = useMemo(
    () => teams.filter((t) => players.some((p) => p.team === t.code)),
    []
  )

  const list = useMemo(() => {
    return players.filter(
      (p) =>
        (pos === 'all' || p.position === pos) &&
        (team === 'all' || p.team === team) &&
        p.name.toLowerCase().includes(q.toLowerCase())
    )
  }, [q, pos, team])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Players</h1>
        <p className="text-sm text-muted">Search and compare World Cup stars</p>
      </div>

      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search a player…"
        className="w-full rounded-xl border border-line bg-elevated px-4 py-3 text-sm outline-none focus:border-brand"
      />

      <div className="flex flex-wrap gap-2">
        <button onClick={() => setPos('all')} className={`chip ${pos === 'all' ? 'chip-active' : ''}`}>
          All positions
        </button>
        {positions.map((p) => (
          <button key={p} onClick={() => setPos(p)} className={`chip ${pos === p ? 'chip-active' : ''}`}>
            {p}
          </button>
        ))}
      </div>

      <select
        value={team}
        onChange={(e) => setTeam(e.target.value)}
        className="w-full rounded-xl border border-line bg-elevated px-4 py-3 text-sm outline-none focus:border-brand sm:w-64"
      >
        <option value="all">All teams</option>
        {teamOptions.map((t) => (
          <option key={t.code} value={t.code}>
            {t.name}
          </option>
        ))}
      </select>

      <AdSlot label="Ad" />

      <StaggerList className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((p) => (
          <StaggerItem key={p.id} lift className="card flex items-center gap-3 p-4">
            <TeamBadge code={p.team} size={36} />
            <Link to={`/players/${p.id}`} className="min-w-0 flex-1">
              <div className="truncate font-bold leading-tight">{p.name}</div>
              <div className="truncate text-xs text-muted">
                {getTeam(p.team).name} · {p.position} · #{p.number}
              </div>
            </Link>
            <button
              onClick={() => navigate(`/compare?add=${p.id}`)}
              className="text-muted hover:text-brand"
              aria-label="Compare"
            >
              <GitCompare size={18} />
            </button>
            <button
              onClick={() => toggleFavPlayer(p.id)}
              className="text-muted hover:text-red-500"
              aria-label="Favourite"
            >
              <Heart size={18} className={isFavPlayer(p.id) ? 'fill-red-500 text-red-500' : ''} />
            </button>
          </StaggerItem>
        ))}
      </StaggerList>

      {list.length === 0 && <p className="py-12 text-center text-muted">No players found.</p>}
    </div>
  )
}
