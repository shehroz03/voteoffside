import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { X, Plus, Search } from 'lucide-react'
import { players, getPlayer } from '../lib/players.js'
import { getTeam, flag } from '../lib/teams.js'

const STAT_KEYS = ['apps', 'goals', 'assists', 'rating']
const STAT_LABEL = { apps: 'Appearances', goals: 'Goals', assists: 'Assists', rating: 'Avg rating' }

export default function Compare() {
  const [params, setParams] = useSearchParams()
  const [selected, setSelected] = useState([])
  const [picker, setPicker] = useState(false)
  const [q, setQ] = useState('')

  // handle ?add=id (from Players / PlayerProfile)
  useEffect(() => {
    const add = params.get('add')
    if (add && getPlayer(add)) {
      setSelected((cur) => (cur.includes(add) || cur.length >= 4 ? cur : [...cur, add]))
      params.delete('add')
      setParams(params, { replace: true })
    }
  }, [params, setParams])

  const chosen = selected.map(getPlayer).filter(Boolean)

  const results = useMemo(
    () =>
      players
        .filter((p) => !selected.includes(p.id) && p.name.toLowerCase().includes(q.toLowerCase()))
        .slice(0, 8),
    [q, selected]
  )

  const best = (key) => Math.max(...chosen.map((p) => p.stats[key] || 0), 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Player Comparison</h1>
        <p className="text-sm text-muted">Compare up to 4 players side by side</p>
      </div>

      {chosen.length === 0 && (
        <div className="card p-10 text-center">
          <p className="text-muted">No players selected yet.</p>
          <button onClick={() => setPicker(true)} className="btn-primary mx-auto mt-4">
            <Plus size={16} /> Add a player
          </button>
        </div>
      )}

      {chosen.length > 0 && (
        <>
          {/* player columns */}
          <div className={`grid gap-3 ${chosen.length >= 3 ? 'grid-cols-3' : 'grid-cols-2'} sm:grid-cols-4`}>
            {chosen.map((p) => (
              <div key={p.id} className="card relative p-4 text-center">
                <button
                  onClick={() => setSelected((s) => s.filter((id) => id !== p.id))}
                  className="absolute right-2 top-2 text-muted hover:text-red-500"
                  aria-label="Remove"
                >
                  <X size={16} />
                </button>
                <div className="text-4xl">{flag(p.team)}</div>
                <div className="mt-2 text-sm font-bold leading-tight">{p.name}</div>
                <div className="text-xs text-muted">{getTeam(p.team).name}</div>
              </div>
            ))}
            {chosen.length < 4 && (
              <button
                onClick={() => setPicker(true)}
                className="flex min-h-[7rem] flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-line text-muted hover:border-brand hover:text-brand"
              >
                <Plus size={20} />
                <span className="text-xs font-semibold">Add</span>
              </button>
            )}
          </div>

          {/* stat rows with winner highlight */}
          <div className="card divide-y divide-line">
            {STAT_KEYS.map((key) => {
              const top = best(key)
              return (
                <div key={key} className="p-4">
                  <div className="mb-2 text-xs font-bold uppercase tracking-wider text-muted">
                    {STAT_LABEL[key]}
                  </div>
                  <div className={`grid gap-2 ${chosen.length >= 3 ? 'grid-cols-3' : 'grid-cols-2'} sm:grid-cols-4`}>
                    {chosen.map((p) => {
                      const v = p.stats[key] || 0
                      const win = v === top && top > 0
                      return (
                        <div
                          key={p.id}
                          className={`rounded-xl px-2 py-2 text-center text-lg font-extrabold tabular-nums ${
                            win ? 'bg-success/10 text-success' : ''
                          }`}
                        >
                          {v}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* picker modal */}
      {picker && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4"
          onClick={() => setPicker(false)}
        >
          <div
            className="w-full max-w-md rounded-t-2xl bg-surface p-4 sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center gap-2 rounded-xl border border-line px-3">
              <Search size={16} className="text-muted" />
              <input
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search player…"
                className="w-full bg-transparent py-3 text-sm outline-none"
              />
            </div>
            <div className="max-h-72 space-y-1 overflow-y-auto">
              {results.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    setSelected((s) => (s.length >= 4 ? s : [...s, p.id]))
                    setPicker(false)
                    setQ('')
                  }}
                  className="flex w-full items-center gap-3 rounded-xl p-2 text-left hover:bg-elevated"
                >
                  <span className="text-2xl">{flag(p.team)}</span>
                  <span className="flex-1">
                    <span className="block text-sm font-semibold">{p.name}</span>
                    <span className="block text-xs text-muted">{getTeam(p.team).name}</span>
                  </span>
                </button>
              ))}
              {results.length === 0 && (
                <p className="py-6 text-center text-sm text-muted">No players.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
