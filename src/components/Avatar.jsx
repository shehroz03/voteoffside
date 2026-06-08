import { useState } from 'react'
import { User } from 'lucide-react'

const SIZE_CLASS = {
  64:  'w-16 h-16',
  80:  'w-20 h-20',
  100: 'w-24 h-24',
  120: 'w-32 h-32',
  140: 'w-[140px] h-[140px]',
}

export default function Avatar({ src, alt = 'Avatar', size = 80, className = '' }) {
  const [status, setStatus] = useState(src ? 'loading' : 'empty')
  const sizeClass = SIZE_CLASS[size] ?? `w-${size} h-${size}`
  const base = `rounded-2xl ${sizeClass} ${className}`

  if (status === 'empty' || status === 'error') {
    return (
      <div className={`flex shrink-0 items-center justify-center bg-line/30 text-muted ${base}`}>
        <User size={Math.floor(size * 0.4)} strokeWidth={1.5} />
      </div>
    )
  }

  return (
    <div className={`relative shrink-0 overflow-hidden ${base}`}>
      {/* shimmer while loading */}
      {status === 'loading' && (
        <div className="absolute inset-0 animate-pulse bg-line/40" />
      )}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        onLoad={() => setStatus('loaded')}
        onError={() => setStatus('error')}
        className={`h-full w-full object-cover shadow-lg ring-1 ring-black/10 transition-opacity duration-300 dark:ring-white/10 ${
          status === 'loaded' ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </div>
  )
}
