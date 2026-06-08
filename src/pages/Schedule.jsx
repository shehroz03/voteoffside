import { useMemo, useState } from 'react'
import { useApp } from '../context/AppContext.jsx'
import { groupKeys } from '../lib/teams.js'
import MatchCard from '../components/MatchCard.jsx'
import AdSlot from '../components/AdSlot.jsx'
import { StaggerList, StaggerItem } from '../motion.jsx'

export default function Schedule() {
  const { matches } = useApp()
  const [group, setGroup] = useState('all')
  const [matchday, setMatchday] = useState('all')

  const filtered = useMemo(() => {
    return matches.filter(
      (m) =>
        (group === 'all' || m.group === group) &&
        (matchday === 'all' || String(m.matchday) === matchday)
    )
  }, [group, matchday])

  // group by date for nice section headers
  const byDate = useMemo(() => {
    const map = {}
    filtered.forEach((m) => {
      const key = new Date(m.date).toLocaleDateString(undefined, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      })
      ;(map[key] ||= []).push(m)
    })
    return map
  }, [filtered])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Match Schedule</h1>
        <p className="text-sm text-muted">{matches.length} group-stage fixtures</p>
      </div>

      {/* filters */}
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setGroup('all')}
            className={`chip ${group === 'all' ? 'chip-active' : ''}`}
          >
            All groups
          </button>
          {groupKeys.map((g) => (
            <button
              key={g}
              onClick={() => setGroup(g)}
              className={`chip ${group === g ? 'chip-active' : ''}`}
            >
              Group {g}
            </button>
          ))}
        </div>
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

      <AdSlot label="Ad" />

      {Object.entries(byDate).map(([date, list]) => (
        <section key={date}>
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-muted">
            {date}
          </h2>
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
        <p className="py-12 text-center text-muted">No matches for this filter.</p>
      )}
    </div>
  )
}
