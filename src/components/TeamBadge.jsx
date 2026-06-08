import { useState } from 'react'
import { flagUrl, flag, getTeam } from '../lib/teams.js'

/**
 * Circular country-flag badge using flagcdn.com.
 * Falls back to the emoji flag on image error so nothing ever breaks.
 *
 * Props:
 *   code      — 3-letter team code, e.g. "BRA"
 *   size      — pixel diameter of the circle (default 32)
 *   cdnSize   — flagcdn size slug: "w40" | "w80" | "w160" (default "w80")
 *   className — extra Tailwind classes (margins, etc.)
 */
export default function TeamBadge({ code, size = 32, cdnSize = 'w80', className = '' }) {
  const [errored, setErrored] = useState(false)
  const url = flagUrl(code, cdnSize)

  // Emoji fallback — same circle footprint so layout is never disturbed
  if (errored || !url) {
    return (
      <span
        aria-hidden
        className={`inline-flex shrink-0 select-none items-center justify-center rounded-full leading-none ${className}`}
        style={{ width: size, height: size, fontSize: size * 0.62 }}
      >
        {flag(code)}
      </span>
    )
  }

  return (
    <img
      src={url}
      alt={getTeam(code).name}
      loading="lazy"
      width={size}
      height={size}
      onError={() => setErrored(true)}
      className={`shrink-0 rounded-full object-cover shadow-sm ring-1 ring-black/10 dark:ring-white/10 ${className}`}
    />
  )
}
