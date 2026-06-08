import { NavLink } from 'react-router-dom'
import { Home, CalendarDays, Radio, Vote, Users } from 'lucide-react'

const TABS = [
  { to: '/',            label: 'Home',     icon: Home,         end: true },
  { to: '/schedule',    label: 'Schedule', icon: CalendarDays },
  { to: '/predictions', label: 'Predict',  icon: Vote },
  { to: '/live',        label: 'Live',     icon: Radio },
  { to: '/teams',       label: 'Teams',    icon: Users },
]

export default function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line/60 bg-elevated/90 backdrop-blur-md lg:hidden dark:bg-[rgba(6,10,24,0.88)] dark:border-[rgba(24,36,68,0.8)]">
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
                <span className={`flex h-7 w-7 items-center justify-center rounded-xl transition-all duration-150 ${
                  isActive
                    ? 'bg-brand/10 dark:bg-brand/20 shadow-[0_2px_8px_rgba(26,86,219,0.2)]'
                    : ''
                }`}>
                  <Icon size={18} />
                </span>
                {label}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
