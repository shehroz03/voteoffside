import { useMemo, useState } from 'react'
import { useApp } from '../context/AppContext.jsx'
import { groupKeys } from '../lib/teams.js'
import MatchCard from '../components/MatchCard.jsx'
import AdSlot from '../components/AdSlot.jsx'
import { StaggerList, StaggerItem } from '../motion.jsx'
import { useSeo } from '../lib/seo.js'

export default function Schedule() {
  useSeo({ title: 'Match Schedule & Fixtures', description: 'Full FIFA World Cup 2026 schedule — all 104 matches with kickoff times, groups and venues. Never miss a game.', path: '/schedule' })
  const { matches } = useApp()
  const [group,    setGroup]    = useState('all')
  const [matchday, setMatchday] = useState('all')

  const filtered = useMemo(() => {
    return matches.filter(
      (m) =>
        (group === 'all' || m.group === group) &&
        (matchday === 'all' || String(m.matchday) === matchday)
    )
  }, [group, matchday, matches])

  const byDate = useMemo(() => {
    const map = {}
    filtered.forEach((m) => {
      const key = new Date(m.date).toLocaleDateString(undefined, {
        weekday: 'long', month: 'long', day: 'numeric',
      })
      ;(map[key] ||= []).push(m)
    })
    return map
  }, [filtered])

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h1 className="page-title">Match Schedule</h1>
        <p className="mt-1.5 text-sm text-muted">
          {matches.length} group-stage fixtures across {groupKeys.length} groups
        </p>
      </div>

      {/* Filters */}
      <div className="space-y-3">
        {/* Group filter */}
        <div>
          <p className="section-label mb-2">Group</p>
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
        </div>

        {/* Matchday filter */}
        <div>
          <p className="section-label mb-2">Matchday</p>
          <div className="flex flex-wrap gap-2">
            {['all', '1', '2', '3'].map((md) => (
              <button
                key={md}
                onClick={() => setMatchday(md)}
                className={`chip ${matchday === md ? 'chip-active' : ''}`}
              >
                {md === 'all' ? 'All matchdays' : `Matchday ${md}`}
              </button>
            ))}
          </div>
        </div>
      </div>

      <AdSlot label="Ad" />

      {/* Match list grouped by date */}
      {Object.entries(byDate).map(([date, list]) => (
        <section key={date} className="space-y-3">
          {/* Date header */}
          <div className="date-group-header">
            <div className="date-group-title">
              <h2 className="text-sm font-bold text-ink">{date}</h2>
            </div>
            <span className="rounded-full border border-line/70 bg-elevated px-2.5 py-0.5 text-[11px] font-bold text-muted dark:bg-white/4 dark:border-white/10">
              {list.length} {list.length === 1 ? 'match' : 'matches'}
            </span>
          </div>

          <StaggerList className="grid gap-4 md:grid-cols-2">
            {list.map((m) => (
              <StaggerItem key={m.id}>
                <MatchCard match={m} />
              </StaggerItem>
            ))}
          </StaggerList>
        </section>
      ))}

      {filtered.length === 0 && (
        <div className="py-16 text-center">
          <p className="text-4xl mb-3">🔍</p>
          <p className="font-semibold text-ink">No matches for this filter</p>
          <p className="mt-1 text-sm text-muted">Try selecting a different group or matchday</p>
        </div>
      )}
    </div>
  )
}
