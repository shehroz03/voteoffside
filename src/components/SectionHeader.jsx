import { Link } from 'react-router-dom'

export default function SectionHeader({ title, subtitle, to, action }) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4">
      <div>
        <h2 className="text-xl font-extrabold tracking-tight sm:text-2xl leading-none">{title}</h2>
        {subtitle && (
          <p className="mt-1 text-sm text-muted">{subtitle}</p>
        )}
      </div>
      {to && (
        <Link
          to={to}
          className="shrink-0 rounded-lg border border-line/60 px-3 py-1.5 text-xs font-bold text-brand hover:bg-brand/5 hover:border-brand/40 transition-all duration-150 dark:border-white/10 dark:hover:bg-brand/10"
        >
          {action || 'See all'}
        </Link>
      )}
    </div>
  )
}
