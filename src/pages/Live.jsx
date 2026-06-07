import { useEffect, useState } from 'react'
import { TrendingUp } from 'lucide-react'
import { useApp } from '../context/AppContext.jsx'
import { withDemoLiveState } from '../lib/matches.js'
import { getTeam } from '../lib/teams.js'
import MatchCard from '../components/MatchCard.jsx'
import AdSlot from '../components/AdSlot.jsx'

export default function Live() {
  const { matches } = useApp()
  const [tick, setTick] = useState(0)
  const [lastRefresh, setLastRefresh] = useState(new Date())

  // Auto-refresh every 30s (here it re-renders; wire to your scores API).
  useEffect(() => {
    const id = setInterval(() => {
      setTick((t) => t + 1)
      setLastRefresh(new Date())
    }, 30000)
    return () => clearInterval(id)
  }, [])

  const live = withDemoLiveState(matches.slice(0, 6))
  const liveNow = live.filter((m) => m.status === 'live')
  const finished = live.filter((m) => m.status === 'finished')

  // Upset = away team (often underdog) leading. Simplified demo logic.
  const upset = liveNow.find((m) => (m.score?.away ?? 0) > (m.score?.home ?? 0))

  return (
    <div className="space-y-6" key={tick}>
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Live Scores</h1>
          <p className="text-sm text-muted">
            Auto-refreshes every 30s · updated{' '}
            {lastRefresh.toLocaleTimeString(undefined, {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            })}
          </p>
        </div>
      </div>

      {upset && (
        <div className="flex items-center gap-3 rounded-2xl border border-gold/40 bg-gold/10 px-4 py-3 text-sm font-semibold">
          <TrendingUp className="text-gold-600" size={18} />
          <span>
            Upset alert! {getTeam(upset.away).name} are leading{' '}
            {getTeam(upset.home).name} {upset.score.away}–{upset.score.home}.
          </span>
        </div>
      )}

      {liveNow.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-red-500">
            Live now
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {liveNow.map((m) => (
              <MatchCard key={m.id} match={m} votable={false} />
            ))}
          </div>
        </section>
      )}

      <AdSlot label="Ad" />

      {finished.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-muted">
            Recent results
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {finished.map((m) => (
              <MatchCard key={m.id} match={m} votable={false} />
            ))}
          </div>
        </section>
      )}

      <p className="rounded-xl border border-line bg-elevated p-3 text-center text-xs text-muted">
        Demo data. Connect football-data.org (or TheSportsDB) in the backend to show real live scores.
      </p>
    </div>
  )
}
