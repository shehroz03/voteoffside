import { Link } from 'react-router-dom'

export default function SectionHeader({ title, subtitle, to, action }) {
  return (
    <div className="mb-4 flex items-end justify-between gap-3">
      <div>
        <h2 className="text-lg font-extrabold tracking-tight sm:text-xl">{title}</h2>
        {subtitle && <p className="text-sm text-muted">{subtitle}</p>}
      </div>
      {to && (
        <Link to={to} className="shrink-0 text-sm font-semibold text-brand hover:underline">
          {action || 'See all'}
        </Link>
      )}
    </div>
  )
}
