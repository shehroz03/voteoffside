import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'

export default function SectionHeader({ title, subtitle, to, action }) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4">
      <div>
        <div className="section-divider mb-2">{title}</div>
        {subtitle && <p className="text-sm text-muted">{subtitle}</p>}
      </div>
      {to && (
        <Link
          to={to}
          className="shrink-0 inline-flex items-center gap-1 rounded-xl border border-line/60 px-3 py-1.5 text-xs font-bold text-brand hover:bg-brand/5 hover:border-brand/40 transition-all duration-150 dark:border-white/10 dark:hover:bg-brand/10"
        >
          {action || 'See all'} <ChevronRight size={12} />
        </Link>
      )}
    </div>
  )
}
