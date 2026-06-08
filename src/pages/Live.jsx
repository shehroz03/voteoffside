import { useEffect, useState } from 'react'
import { TrendingUp } from 'lucide-react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { useApp } from '../context/AppContext.jsx'
import { withDemoLiveState } from '../lib/matches.js'
import { getTeam } from '../lib/teams.js'
import { fetchLiveMatches } from '../lib/scoresApi.js'
import MatchCard from '../components/MatchCard.jsx'
import AdSlot from '../components/AdSlot.jsx'
import { StaggerList, StaggerItem } from '../motion.jsx'

export default function Live() {
  const reduced = useReducedMotion()
  const { matches } = useApp()
  const [tick, setTick] = useState(0)
  const [lastRefresh, setLastRefresh] = useState(new Date())
  const [realMatches, setRealMatches] = useState(null)
  const [isDemo, setIsDemo] = useState(true)

  // Auto-refresh every 30s — no changes to this logic
  useEffect(() => {
    async function load() {
      try {
        const data = await fetchLiveMatches()
        setRealMatches(data)
        setIsDemo(false)
      } catch (err) {
        console.warn('Live API failed, falling back to demo mode:', err.message)
        setIsDemo(true)
      }
      setLastRefresh(new Date())
    }

    load()
    const id = setInterval(() => {
      setTick((t) => t + 1)
      load()
    }, 30000)
    return () => clearInterval(id)
  }, [])

  const liveSource = isDemo ? withDemoLiveState(matches.slice(0, 6)) : (realMatches || [])
  const liveNow = liveSource.filter((m) => m.status === 'live')
  const finished = liveSource.filter((m) => m.status === 'finished')

  // Upset = away team (often underdog) leading. Simplified demo logic.
  const upset = liveNow.find((m) => (m.score?.away ?? 0) > (m.score?.home ?? 0))

  return (
    <div className="space-y-6" key={tick}>
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Live Scores</h1>
          <p className="mt-1 text-sm text-muted">
            Auto-refreshes every 30s · updated{' '}
            {lastRefresh.toLocaleTimeString(undefined, {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            })}
          </p>
        </div>
      </div>

      {/* Upset banner — slides in from above then shakes once */}
      <AnimatePresence>
        {upset && (
          <motion.div
            key={upset.id}
            initial={{ opacity: 0, y: reduced ? 0 : -18 }}
            animate={{
              opacity: 1,
              y: 0,
              x: reduced ? 0 : [0, -6, 6, -4, 4, -2, 2, 0],
            }}
            exit={{ opacity: 0, y: reduced ? 0 : -10, transition: { duration: 0.15 } }}
            transition={{
              opacity: { duration: 0.2 },
              y: { type: 'spring', stiffness: 300, damping: 22 },
              x: { delay: 0.38, duration: 0.52, ease: 'easeInOut' },
            }}
            className="flex items-center gap-3 rounded-2xl border border-gold-500/40 bg-gold/10 dark:bg-gold/8 px-5 py-3.5 text-sm font-bold shadow-[0_2px_16px_rgba(245,158,11,0.12)]"
          >
            <TrendingUp className="text-gold-500 shrink-0" size={20} />
            <span>
              Upset alert! {getTeam(upset.away).name} are leading{' '}
              {getTeam(upset.home).name} {upset.score.away}–{upset.score.home}.
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {liveNow.length > 0 && (
        <section>
          <div className="mb-4 flex items-center gap-2">
            {/* Pulsing LIVE badge */}
            <motion.span
              className="badge-live"
              animate={!reduced ? {
                boxShadow: [
                  '0 0 0px rgba(239,68,68,0)',
                  '0 0 10px rgba(239,68,68,0.55)',
                  '0 0 0px rgba(239,68,68,0)',
                ],
              } : undefined}
              transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
            >
              <motion.span
                className="h-1.5 w-1.5 rounded-full bg-white/80"
                animate={!reduced
                  ? { scale: [1, 1.65, 1], opacity: [1, 0.35, 1] }
                  : { opacity: [1, 0.5, 1] }
                }
                transition={{ duration: 1.15, repeat: Infinity, ease: 'easeInOut' }}
              />
              Live now
            </motion.span>
            <span className="text-xs text-muted font-medium">
              {liveNow.length} match{liveNow.length !== 1 ? 'es' : ''}
            </span>
          </div>
          <StaggerList className="grid gap-4 md:grid-cols-2">
            {liveNow.map((m) => (
              <StaggerItem key={m.id}>
                <MatchCard match={m} votable={false} />
              </StaggerItem>
            ))}
          </StaggerList>
        </section>
      )}

      <AdSlot label="Ad" />

      {finished.length > 0 && (
        <section>
          <h2 className="mb-4 section-label">Recent results</h2>
          <StaggerList className="grid gap-4 md:grid-cols-2">
            {finished.map((m) => (
              <StaggerItem key={m.id}>
                <MatchCard match={m} votable={false} />
              </StaggerItem>
            ))}
          </StaggerList>
        </section>
      )}

      {isDemo ? (
        <p className="rounded-2xl border border-line/60 bg-elevated px-4 py-3 text-center text-xs text-muted dark:bg-white/3 dark:border-white/8">
          Demo data. Connect football-data.org (or TheSportsDB) in the backend to show real live scores.
        </p>
      ) : (
        <p className="rounded-2xl border border-green-500/30 bg-green-500/8 dark:bg-green-500/10 px-4 py-3 text-center text-xs font-semibold text-green-600 dark:text-green-400">
          ● Live Real-time API Mode active (football-data.org)
        </p>
      )}
    </div>
  )
}
