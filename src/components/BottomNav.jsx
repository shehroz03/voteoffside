import { NavLink } from 'react-router-dom'
import { Home, CalendarDays, Radio, Vote, Users } from 'lucide-react'
import { motion } from 'framer-motion'

const TABS = [
  { to: '/',            label: 'Home',     icon: Home,         end: true },
  { to: '/schedule',    label: 'Schedule', icon: CalendarDays },
  { to: '/predictions', label: 'Predict',  icon: Vote },
  { to: '/live',        label: 'Live',     icon: Radio },
  { to: '/teams',       label: 'Teams',    icon: Users },
]

export default function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line/60 bg-elevated/92 backdrop-blur-md lg:hidden dark:bg-[rgba(6,10,24,0.92)] dark:border-[rgba(24,36,68,0.8)]">
      <div className="mx-auto flex max-w-md items-stretch justify-around px-1 pb-[env(safe-area-inset-bottom)]">
        {TABS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-1 py-3 text-[10px] font-bold tracking-wide transition-all duration-150 ${
                isActive
                  ? 'text-brand dark:text-brand-300'
                  : 'text-muted hover:text-ink'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span className="relative flex h-8 w-8 items-center justify-center">
                  {isActive && (
                    <motion.span
                      layoutId="bottom-nav-pill"
                      className="absolute inset-0 rounded-xl bg-brand-gradient opacity-15 dark:opacity-20"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                  <Icon size={18} className={`relative z-10 transition-transform duration-150 ${isActive ? 'scale-110' : ''}`} />
                </span>
                <span className={`transition-colors ${isActive ? 'text-brand dark:text-brand-300' : ''}`}>
                  {label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
