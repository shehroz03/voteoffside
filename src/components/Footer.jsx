import { Link } from 'react-router-dom'
import { Trophy } from 'lucide-react'

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
    <footer className="border-t border-line/60 bg-elevated/60 pb-28 pt-10 dark:bg-[rgba(6,10,24,0.6)] lg:pb-12">
      <div className="mx-auto max-w-6xl px-4">

        {/* Top row: logo + columns */}
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">

          {/* Brand block */}
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
          </div>

          {/* Pages */}
          <div>
            <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-muted">Pages</h3>
            <ul className="space-y-2">
              {PAGES.map(({ to, label }) => (
                <li key={to}>
                  <Link
                    to={to}
                    className="text-sm text-muted transition-colors hover:text-brand dark:hover:text-brand-300"
                  >
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
                  <Link
                    to={to}
                    className="text-sm text-muted transition-colors hover:text-brand dark:hover:text-brand-300"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="mt-10 border-t border-line/50" />

        {/* Bottom row */}
        <div className="mt-5 flex flex-col items-start gap-1.5 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
          <span>© 2026 VoteOffside. All rights reserved.</span>
          <span className="text-muted/70">
            Unofficial fan site — not affiliated with, endorsed by, or connected to FIFA or any
            national football association.
          </span>
        </div>
      </div>
    </footer>
  )
}
