import { NavLink } from 'react-router-dom'
import { Home, CalendarDays, Radio, Vote, Users } from 'lucide-react'

const TABS = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/schedule', label: 'Schedule', icon: CalendarDays },
  { to: '/predictions', label: 'Predict', icon: Vote },
  { to: '/live', label: 'Live', icon: Radio },
  { to: '/teams', label: 'Teams', icon: Users },
]

export default function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 backdrop-blur lg:hidden">
      <div className="mx-auto flex max-w-md items-stretch justify-around px-1 pb-[env(safe-area-inset-bottom)]">
        {TABS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-semibold transition-colors ${
                isActive ? 'text-brand' : 'text-muted'
              }`
            }
          >
            <Icon size={20} />
            {label}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
