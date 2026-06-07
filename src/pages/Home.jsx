import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarDays, Radio, Vote, Users, BarChart3, GitCompare } from 'lucide-react'
import { tournament } from '../lib/teams.js'
import { useApp } from '../context/AppContext.jsx'
import MatchCard from '../components/MatchCard.jsx'
import SectionHeader from '../components/SectionHeader.jsx'
import AdSlot from '../components/AdSlot.jsx'

function useCountdown(target) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])
  const diff = Math.max(0, new Date(target).getTime() - now)
  const d = Math.floor(diff / 86400000)
  const h = Math.floor((diff % 86400000) / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  const s = Math.floor((diff % 60000) / 1000)
  return { d, h, m, s, done: diff === 0 }
}

const QUICK = [
  { to: '/schedule', label: 'Schedule', icon: CalendarDays },
  { to: '/predictions', label: 'Predict', icon: Vote },
  { to: '/live', label: 'Live', icon: Radio },
  { to: '/teams', label: 'Teams', icon: Users },
  { to: '/compare', label: 'Compare', icon: GitCompare },
  { to: '/leaderboard', label: 'Ranks', icon: BarChart3 },
]

export default function Home() {
  const { matches } = useApp()
  const c = useCountdown(tournament.openingMatch.kickoff_ET)
  const featured = matches.slice(0, 3)

  return (
    <div className="space-y-10">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl bg-brand px-6 py-10 text-white sm:px-10 sm:py-14">
        <div
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 20%, white 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />
        <div className="relative">
          <span className="inline-block rounded-full bg-white/15 px-3 py-1 text-xs font-bold uppercase tracking-wider">
            FIFA World Cup 2026
          </span>
          <h1 className="mt-4 max-w-xl text-3xl font-extrabold leading-tight sm:text-5xl">
            Predict every match. Beat the world.
          </h1>
          <p className="mt-3 max-w-md text-white/80">
            Vote on all 104 matches, watch live scores, and climb the leaderboard.
            No signup needed.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/predictions" className="btn bg-white px-5 py-3 text-brand hover:bg-white/90">
              Start predicting
            </Link>
            <Link to="/schedule" className="btn border border-white/40 px-5 py-3 text-white hover:bg-white/10">
              View schedule
            </Link>
          </div>

          {!c.done && (
            <div className="mt-8 inline-flex items-center gap-3 rounded-xl bg-white/10 px-4 py-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-white/70">
                Kickoff in
              </span>
              <div className="flex gap-2 font-extrabold tabular-nums">
                {[['d', c.d], ['h', c.h], ['m', c.m], ['s', c.s]].map(([k, v]) => (
                  <span key={k} className="min-w-[2.5ch] text-center">
                    {v}
                    <span className="ml-0.5 text-xs font-medium text-white/60">{k}</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Quick links */}
      <section className="grid grid-cols-3 gap-3 sm:grid-cols-6">
        {QUICK.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            className="card flex flex-col items-center gap-2 py-4 transition-transform hover:-translate-y-0.5"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 text-brand">
              <Icon size={20} />
            </span>
            <span className="text-xs font-semibold">{label}</span>
          </Link>
        ))}
      </section>

      <AdSlot label="Ad · below navbar" />

      {/* Featured matches */}
      <section>
        <SectionHeader
          title="Vote on the next matches"
          subtitle="Tap a team to lock your prediction"
          to="/predictions"
        />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {featured.map((m) => (
            <MatchCard key={m.id} match={m} />
          ))}
        </div>
      </section>
    </div>
  )
}
