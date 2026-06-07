import { NavLink, Link } from 'react-router-dom'
import { Moon, Sun, Trophy } from 'lucide-react'
import { useTheme } from '../context/ThemeContext.jsx'
import { useApp } from '../context/AppContext.jsx'

const LINKS = [
  { to: '/schedule', label: 'Schedule' },
  { to: '/live', label: 'Live' },
  { to: '/predictions', label: 'Predict' },
  { to: '/teams', label: 'Teams' },
  { to: '/players', label: 'Players' },
  { to: '/compare', label: 'Compare' },
  { to: '/leaderboard', label: 'Leaderboard' },
]

export default function TopNav() {
  const { dark, toggle } = useTheme()
  const { username } = useApp()

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-surface/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4">
        <Link to="/" className="flex items-center gap-2 font-extrabold tracking-tight">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-white">
            <Trophy size={18} />
          </span>
          <span className="text-lg">
            Vote<span className="text-brand">Offside</span>
          </span>
        </Link>

        <nav className="ml-2 hidden items-center gap-1 lg:flex">
          {LINKS.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                `rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                  isActive ? 'text-brand' : 'text-muted hover:text-ink'
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <span className="hidden rounded-full border border-line px-3 py-1.5 text-xs font-semibold text-muted sm:inline">
            {username}
          </span>
          <button
            onClick={toggle}
            aria-label="Toggle dark mode"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-line text-muted hover:text-ink"
          >
            {dark ? <Sun size={17} /> : <Moon size={17} />}
          </button>
        </div>
      </div>
    </header>
  )
}
