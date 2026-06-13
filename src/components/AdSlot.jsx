import { motion } from 'framer-motion'

const WC_START = new Date('2026-06-11T00:00:00Z')
function getTournamentDay() {
  const diff = Date.now() - WC_START.getTime()
  if (diff < 0) return null
  return Math.floor(diff / 86400000) + 1
}

export default function AdSlot({ label, className = '' }) {
  const day = getTournamentDay()
  const isLive = day !== null

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
      className={`relative overflow-hidden rounded-2xl ${className}`}
      style={{ height: 140 }}
    >
      {/* Stadium background */}
      <img
        src="https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1400&q=80"
        alt="FIFA World Cup 2026 stadium"
        className="absolute inset-0 h-full w-full object-cover object-center"
        draggable={false}
      />

      {/* Dark overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/60 to-black/35" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

      {/* Top accent line — red when live, gold otherwise */}
      <div className={`absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent ${isLive ? 'via-red-500' : 'via-yellow-400'} to-transparent opacity-90`} />

      {/* Content */}
      <div className="relative flex h-full items-center justify-between px-6 sm:px-8">
        {/* Left — branding */}
        <div className="flex items-center gap-4">
          <div className="flex flex-col gap-0.5">
            {isLive ? (
              <div className="flex items-center gap-2">
                <motion.span
                  className="h-2 w-2 rounded-full bg-red-500"
                  animate={{ opacity: [1, 0.2, 1], scale: [1, 1.3, 1] }}
                  transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut' }}
                />
                <span className="text-[10px] font-black uppercase tracking-[0.22em] text-red-400">
                  Live Now · Day {day}
                </span>
              </div>
            ) : (
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-yellow-400/90">FIFA</span>
            )}
            <h3 className="text-lg sm:text-2xl font-black leading-tight text-white drop-shadow-lg">
              World Cup
              <span className="ml-2 text-yellow-400">2026™</span>
            </h3>
            <p className="mt-0.5 text-[11px] font-semibold text-white/70 tracking-wide">
              {isLive ? `Tournament underway · USA · Canada · Mexico` : 'June 11 – July 19 · USA · Canada · Mexico'}
            </p>
          </div>
        </div>

        {/* Right — stat chips */}
        <div className="hidden sm:flex flex-col items-end gap-1.5">
          {isLive ? (
            <>
              <div className="flex items-center gap-2 rounded-full bg-red-500/15 backdrop-blur-sm px-3 py-0.5 border border-red-500/30">
                <span className="text-sm font-black text-red-400">DAY</span>
                <span className="text-lg font-black text-white tabular-nums">{day}</span>
              </div>
              {[{ num: '48', label: 'Teams' }, { num: '104', label: 'Matches' }].map(({ num, label }) => (
                <div key={label} className="flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-sm px-3 py-0.5 border border-white/15">
                  <span className="text-sm font-black text-yellow-400">{num}</span>
                  <span className="text-[11px] font-semibold text-white/80">{label}</span>
                </div>
              ))}
            </>
          ) : (
            [{ num: '48', label: 'Teams' }, { num: '104', label: 'Matches' }, { num: '16', label: 'Venues' }].map(({ num, label }) => (
              <div key={label} className="flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-sm px-3 py-0.5 border border-white/15">
                <span className="text-sm font-black text-yellow-400">{num}</span>
                <span className="text-[11px] font-semibold text-white/80">{label}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Subtle shimmer sweep */}
      <motion.div
        className="pointer-events-none absolute inset-0"
        style={{
          background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.06) 50%, transparent 60%)',
          backgroundSize: '200% 100%',
        }}
        animate={{ backgroundPosition: ['200% 0', '-200% 0'] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: 'linear', repeatDelay: 2 }}
      />
    </motion.div>
  )
}
