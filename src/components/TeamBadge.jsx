import { Link } from 'react-router-dom'
import { flag, getTeam } from '../lib/teams.js'

export default function TeamBadge({ code, size = 'md', link = false, reverse = false }) {
  const team = getTeam(code)
  const sizes = {
    sm: 'text-base',
    md: 'text-xl',
    lg: 'text-3xl',
  }
  const text = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  }

  const inner = (
    <span
      className={`inline-flex items-center gap-2 ${reverse ? 'flex-row-reverse' : ''}`}
    >
      <span className={sizes[size]} aria-hidden>
        {flag(code)}
      </span>
      <span className={`font-semibold ${text[size]}`}>{team.name}</span>
    </span>
  )

  if (link) {
    return (
      <Link to={`/teams/${code}`} className="hover:text-brand transition-colors">
        {inner}
      </Link>
    )
  }
  return inner
}
