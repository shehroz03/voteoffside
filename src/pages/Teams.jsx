import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Heart } from 'lucide-react'
import { teams, groupKeys, confederations } from '../lib/teams.js'
import TeamBadge from '../components/TeamBadge.jsx'
import { useApp } from '../context/AppContext.jsx'
import AdSlot from '../components/AdSlot.jsx'
import { StaggerList, StaggerItem } from '../motion.jsx'

export default function Teams() {
  const { isFavTeam, toggleFavTeam } = useApp()
  const [group, setGroup] = useState('all')
  const [conf, setConf] = useState('all')
  const [q, setQ] = useState('')

  const list = useMemo(() => {
    return teams.filter(
      (t) =>
        (group === 'all' || t.group === group) &&
        (conf === 'all' || t.confederation === conf) &&
        t.name.toLowerCase().includes(q.toLowerCase())
    )
  }, [group, conf, q])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Teams</h1>
        <p className="text-sm text-muted">All 48 qualified nations</p>
      </div>

      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search a team…"
        className="w-full rounded-xl border border-line bg-elevated px-4 py-3 text-sm outline-none focus:border-brand"
      />

      <div className="flex flex-wrap gap-2">
        <button onClick={() => setGroup('all')} className={`chip ${group === 'all' ? 'chip-active' : ''}`}>
          All groups
        </button>
        {groupKeys.map((g) => (
          <button key={g} onClick={() => setGroup(g)} className={`chip ${group === g ? 'chip-active' : ''}`}>
            {g}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <button onClick={() => setConf('all')} className={`chip ${conf === 'all' ? 'chip-active' : ''}`}>
          All regions
        </button>
        {confederations.map((c) => (
          <button key={c} onClick={() => setConf(c)} className={`chip ${conf === c ? 'chip-active' : ''}`}>
            {c}
          </button>
        ))}
      </div>

      <AdSlot label="Ad" />

      <StaggerList className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {list.map((t) => (
          <StaggerItem key={t.code} lift className="card relative p-4">
            <button
              onClick={() => toggleFavTeam(t.code)}
              aria-label="Favourite"
              className="absolute right-3 top-3 text-muted hover:text-red-500"
            >
              <Heart
                size={18}
                className={isFavTeam(t.code) ? 'fill-red-500 text-red-500' : ''}
              />
            </button>
            <Link to={`/teams/${t.code}`} className="block">
              <TeamBadge code={t.code} size={40} />
              <div className="mt-2 font-bold leading-tight">{t.name}</div>
              <div className="mt-1 text-xs text-muted">
                Group {t.group} · {t.confederation}
                {t.host && <span className="ml-1 text-brand">· Host</span>}
              </div>
            </Link>
          </StaggerItem>
        ))}
      </StaggerList>

      {list.length === 0 && <p className="py-12 text-center text-muted">No teams found.</p>}
    </div>
  )
}
