import { NavLink, Link } from 'react-router-dom'
import { Moon, Sun, Trophy } from 'lucide-react'
import { useTheme } from '../context/ThemeContext.jsx'
import { useApp } from '../context/AppContext.jsx'

const LINKS = [
  { to: '/schedule',    label: 'Schedule' },
  { to: '/live',        label: 'Live' },
  { to: '/predictions', label: 'Predict' },
  { to: '/teams',       label: 'Teams' },
  { to: '/players',     label: 'Players' },
  { to: '/compare',     label: 'Compare' },
  { to: '/leaderboard', label: 'Leaderboard' },
]

export default function TopNav() {
  const { dark, toggle } = useTheme()
  const { username } = useApp()

  return (
    <header className="sticky top-0 z-40 border-b border-line/60 bg-elevated/80 backdrop-blur-md dark:bg-[rgba(6,10,24,0.82)] dark:border-[rgba(24,36,68,0.7)]">
      {/* thin brand accent line at top */}
      <div className="absolute top-0 inset-x-0 h-[2px] bg-brand-gradient opacity-80" />

      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 font-extrabold tracking-tight shrink-0">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-gradient shadow-brand">
            <Trophy size={18} className="text-white drop-shadow" />
          </span>
          <span className="text-lg leading-none">
            Vote<span className="bg-brand-gradient bg-clip-text text-transparent">Offside</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="ml-3 hidden items-center gap-0.5 lg:flex">
          {LINKS.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                `relative rounded-lg px-3 py-2 text-sm font-semibold transition-all duration-150 ${
                  isActive
                    ? 'text-brand dark:text-brand-300'
                    : 'text-muted hover:text-ink dark:hover:text-ink'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {l.label}
                  {isActive && (
                    <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-brand-gradient" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {/* User pill */}
          <span className="hidden items-center gap-1.5 rounded-full border border-line/70 bg-elevated px-3 py-1.5 text-xs font-semibold text-muted sm:inline-flex dark:bg-white/5 dark:border-white/10">
            <span className="h-1.5 w-1.5 rounded-full bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.6)]" />
            {username}
          </span>

          {/* Theme toggle */}
          <button
            onClick={toggle}
            aria-label="Toggle dark mode"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-line/70 text-muted hover:text-ink hover:border-brand/40 hover:bg-brand/5 transition-all duration-150 dark:border-white/10 dark:hover:bg-white/5"
          >
            {dark ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>
      </div>
    </header>
  )
}
