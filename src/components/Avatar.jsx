import { useState } from 'react'
import { User } from 'lucide-react'

export default function Avatar({ src, alt = 'Avatar', size = 80, className = '' }) {
  const [errored, setErrored] = useState(false)

  const sizeClass = {
    64: 'w-16 h-16',
    80: 'w-20 h-20',
    100: 'w-24 h-24',
    120: 'w-32 h-32',
    140: 'w-[140px] h-[140px]',
  }[size] || `w-${size} h-${size}`

  if (errored || !src) {
    return (
      <div
        className={`flex items-center justify-center rounded-2xl bg-line/30 text-muted ${sizeClass} ${className}`}
      >
        <User size={Math.floor(size * 0.4)} strokeWidth={1.5} />
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={alt}
      onError={() => setErrored(true)}
      className={`rounded-2xl object-cover shadow-lg ring-1 ring-black/10 dark:ring-white/10 ${sizeClass} ${className}`}
    />
  )
}
