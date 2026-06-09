import { Link } from 'react-router-dom'
import { Trophy, Github } from 'lucide-react'

const PAGES = [
  { to: '/',            label: 'Home' },
  { to: '/schedule',    label: 'Schedule' },
  { to: '/predictions', label: 'Predictions' },
  { to: '/live',        label: 'Live' },
  { to: '/teams',       label: 'Teams' },
  { to: '/leaderboard', label: 'Leaderboard' },
]

const LEGAL = [
  { to: '/about',      label: 'About' },
  { to: '/privacy',    label: 'Privacy Policy' },
  { to: '/contact',    label: 'Contact' },
  { to: '/disclaimer', label: 'Disclaimer' },
]

export default function Footer() {
  return (
    <footer className="border-t border-line/50 bg-elevated/50 pb-28 pt-12 dark:bg-[rgba(6,10,24,0.55)] dark:border-white/5 lg:pb-12">
      <div className="mx-auto max-w-6xl px-4">

        {/* Top row */}
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">

          {/* Brand */}
          <div className="lg:col-span-2">
            <Link to="/" className="inline-flex items-center gap-2.5 font-extrabold tracking-tight">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-gradient shadow-brand">
                <Trophy size={18} className="text-white drop-shadow" />
              </span>
              <span className="text-lg leading-none">
                Vote<span className="bg-brand-gradient bg-clip-text text-transparent">Offside</span>
              </span>
            </Link>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted">
              The fan prediction game for the 2026 FIFA World Cup. Pick winners, beat the crowd,
              and climb the leaderboard.
            </p>
            {/* Stats pills */}
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-line/60 bg-elevated px-3 py-1 text-xs font-semibold text-muted dark:bg-white/4 dark:border-white/8">
                ⚽ 104 matches
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-line/60 bg-elevated px-3 py-1 text-xs font-semibold text-muted dark:bg-white/4 dark:border-white/8">
                🌍 48 nations
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-line/60 bg-elevated px-3 py-1 text-xs font-semibold text-muted dark:bg-white/4 dark:border-white/8">
                🪙 Free to play
              </span>
            </div>
          </div>

          {/* Pages */}
          <div>
            <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-muted">Pages</h3>
            <ul className="space-y-2">
              {PAGES.map(({ to, label }) => (
                <li key={to}>
                  <Link to={to} className="text-sm text-muted transition-colors hover:text-brand dark:hover:text-brand-300">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-muted">Info</h3>
            <ul className="space-y-2">
              {LEGAL.map(({ to, label }) => (
                <li key={to}>
                  <Link to={to} className="text-sm text-muted transition-colors hover:text-brand dark:hover:text-brand-300">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="mt-10 h-px bg-gradient-to-r from-transparent via-line/70 to-transparent dark:via-white/8" />

        {/* Bottom row */}
        <div className="mt-5 flex flex-col items-start gap-1.5 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
          <span>© 2026 VoteOffside. All rights reserved.</span>
          <span className="text-muted/60 max-w-sm text-right">
            Unofficial fan site — not affiliated with FIFA or any national football association.
          </span>
        </div>
      </div>
    </footer>
  )
}
