import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { X, Plus, Search, Trophy } from 'lucide-react'
import { players, getPlayer } from '../lib/players.js'
import { getTeam } from '../lib/teams.js'
import TeamBadge from '../components/TeamBadge.jsx'

const STAT_KEYS = ['apps', 'goals', 'assists', 'rating']
const STAT_LABEL = { apps: 'Appearances', goals: 'Goals', assists: 'Assists', rating: 'Avg rating' }

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

function trophyScore(player) {
  if (!player.honours || player.honours.length === 0) return 0
  return player.honours.reduce((sum, h) => sum + (h.count || 0), 0)
}

function getHonourCount(player, title) {
  if (!player.honours) return 0
  const h = player.honours.find((x) => x.title === title)
  return h ? h.count : 0
}

function TrophyIcons({ count, title, maxDisplay = 5 }) {
  if (count === 0) return <span className="text-muted text-sm">—</span>
  const icon = trophyEmoji(title)
  const shown = Math.min(count, maxDisplay)
  const overflow = count > maxDisplay ? count - maxDisplay : 0
  return (
    <span className="inline-flex flex-wrap items-center gap-0.5">
      {Array.from({ length: shown }).map((_, i) => (
        <span key={i} className="text-base leading-none">{icon}</span>
      ))}
      {overflow > 0 && <span className="text-[11px] font-bold text-muted">+{overflow}</span>}
    </span>
  )
}

export default function Compare() {
  const [params, setParams] = useSearchParams()
  const [selected, setSelected] = useState([])
  const [picker, setPicker] = useState(false)
  const [q, setQ] = useState('')

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

  // Trophy cabinet logic
  const hasAnyHonours = chosen.some((p) => p.honours && p.honours.length > 0)

  const allTrophyTitles = useMemo(() => {
    if (!hasAnyHonours) return []
    const seen = new Set()
    const order = []
    for (const p of chosen) {
      if (p.honours) {
        for (const h of p.honours) {
          if (!seen.has(h.title)) {
            seen.add(h.title)
            order.push(h.title)
          }
        }
      }
    }
    return order.filter((title) => chosen.some((p) => getHonourCount(p, title) > 0))
  }, [chosen, hasAnyHonours])

  const scores = useMemo(() => chosen.map(trophyScore), [chosen])
  const maxScore = Math.max(...scores, 0)

  const h2hTrophies = [
    { label: 'World Cups', match: (t) => t.toLowerCase().includes('world cup') && !t.toLowerCase().includes('club') },
    { label: 'Champions Leagues', match: (t) => t.toLowerCase().includes('champions league') },
    { label: 'Ballon d\'Or', match: (t) => t.toLowerCase().includes('ballon') },
  ]

  const gridCols = chosen.length >= 3 ? 'grid-cols-3' : 'grid-cols-2'

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
          {/* Player column cards */}
          <div className={`grid gap-3 ${gridCols} sm:grid-cols-4`}>
            {chosen.map((p) => (
              <div key={p.id} className="card relative p-4 text-center">
                <button
                  onClick={() => setSelected((s) => s.filter((id) => id !== p.id))}
                  className="absolute right-2 top-2 text-muted hover:text-red-500"
                  aria-label="Remove"
                >
                  <X size={16} />
                </button>
                <TeamBadge code={p.team} size={48} />
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

          {/* Stat rows */}
          <div className="card divide-y divide-line">
            {STAT_KEYS.map((key) => {
              const top = best(key)
              return (
                <div key={key} className="p-4">
                  <div className="mb-2 text-xs font-bold uppercase tracking-wider text-muted">
                    {STAT_LABEL[key]}
                  </div>
                  <div className={`grid gap-2 ${gridCols} sm:grid-cols-4`}>
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

          {/* Trophy Cabinet */}
          {(hasAnyHonours || chosen.length >= 2) && (
            <div className="card p-5 space-y-4">
              <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted">
                <Trophy size={16} /> Trophy Cabinet
              </h2>

              {!hasAnyHonours ? (
                <p className="text-sm text-muted text-center py-4">Trophy data coming soon</p>
              ) : (
                <>
                  {/* Trophy rows */}
                  <div className="space-y-3">
                    {allTrophyTitles.map((title) => (
                      <div key={title} className="flex items-center gap-3">
                        {/* Trophy label */}
                        <div className="w-28 shrink-0 flex items-center gap-1.5">
                          <span className="text-base">{trophyEmoji(title)}</span>
                          <span className="text-xs font-semibold text-muted leading-tight truncate">{title}</span>
                        </div>
                        {/* Per-player icon cells */}
                        <div className={`flex-1 grid gap-2 ${gridCols} sm:grid-cols-4`}>
                          {chosen.map((p) => {
                            const count = getHonourCount(p, title)
                            const hasData = p.honours && p.honours.length > 0
                            return (
                              <div key={p.id} className="flex items-center justify-center rounded-lg py-1.5 bg-line/20 min-h-[2.25rem]">
                                {!hasData ? (
                                  <span className="text-[10px] text-muted italic">—</span>
                                ) : (
                                  <TrophyIcons count={count} title={title} maxDisplay={5} />
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Trophy Score row */}
                  <div className="border-t border-line/60 pt-3">
                    <div className="flex items-center gap-3">
                      <div className="w-28 shrink-0 text-xs font-bold text-muted uppercase tracking-wider">
                        Trophy Score
                      </div>
                      <div className={`flex-1 grid gap-2 ${gridCols} sm:grid-cols-4`}>
                        {chosen.map((p, idx) => {
                          const score = scores[idx]
                          const isTop = score > 0 && score === maxScore
                          return (
                            <div
                              key={p.id}
                              className={`flex items-center justify-center rounded-lg py-1.5 text-base font-extrabold tabular-nums ${
                                isTop ? 'bg-yellow-500/15 text-yellow-400' : 'bg-line/20'
                              }`}
                            >
                              {score > 0 ? score : (p.honours && p.honours.length > 0 ? '0' : '?')}
                              {isTop && <span className="ml-1 text-sm">🥇</span>}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>

                  {/* H2H Summary */}
                  <div className="border-t border-line/60 pt-3 space-y-2">
                    <p className="text-xs font-bold uppercase tracking-wider text-muted mb-2">Head to Head</p>
                    {h2hTrophies.map(({ label, match }) => {
                      const totals = chosen.map((p) => {
                        if (!p.honours || p.honours.length === 0) return null
                        return p.honours.filter((h) => match(h.title)).reduce((s, h) => s + h.count, 0)
                      })
                      const hasRelevantData = totals.some((t) => t !== null)
                      const atLeastOneHas = totals.some((t) => t !== null && t > 0)
                      if (!hasRelevantData || !atLeastOneHas) return null
                      const maxVal = Math.max(...totals.filter((t) => t !== null), 0)
                      return (
                        <div key={label} className="flex items-center gap-3">
                          <div className="w-28 shrink-0 text-xs font-semibold text-muted">{label}</div>
                          <div className={`flex-1 grid gap-2 ${gridCols} sm:grid-cols-4`}>
                            {totals.map((t, idx) => {
                              const isWinner = t !== null && t > 0 && t === maxVal
                              return (
                                <div
                                  key={chosen[idx].id}
                                  className={`flex items-center justify-center rounded-lg py-1.5 text-xs font-bold ${
                                    isWinner
                                      ? 'bg-yellow-500/12 text-yellow-400'
                                      : 'bg-line/20 text-muted'
                                  }`}
                                >
                                  {t === null ? '?' : t === 0 ? '—' : t}
                                  {isWinner && <span className="ml-1">🥇</span>}
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
            </div>
          )}
        </>
      )}

      {/* Picker modal */}
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
                  <TeamBadge code={p.team} size={28} cdnSize="w40" />
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
