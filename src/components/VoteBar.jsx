import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence, useMotionValue, useTransform, animate, useReducedMotion } from 'framer-motion'

// ─── Animated percentage counter ────────────────────────────────────────────

function AnimatedCounter({ value }) {
  const motionVal = useMotionValue(value)
  const [display, setDisplay] = useState(value)

  useEffect(() => {
    const controls = animate(motionVal, value, {
      duration: 0.65,
      ease: [0.23, 1, 0.32, 1],
      onUpdate: (v) => setDisplay(Math.round(v)),
    })
    return controls.stop
  }, [value]) // eslint-disable-line react-hooks/exhaustive-deps

  return <>{display}</>
}

// ─── Bar spring ──────────────────────────────────────────────────────────────

const barSpring = { type: 'spring', stiffness: 160, damping: 24, mass: 0.8 }
const TIE_GAP = 5

// ─── Fire colors ─────────────────────────────────────────────────────────────

const FIRE_COLORS = ['#fbbf24', '#f97316', '#ef4444', '#fde68a', '#fb923c', '#ff6b35', '#ffaa00']
const EMBER_COLORS = ['#ff4500', '#ff6b35', '#ffa500', '#ffcc00', '#fff176']

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)] }

// ─── Animated bar segment ─────────────────────────────────────────────────────

function BarSegment({ pct, isWinner, isTie, side, userPick, teamCode, reduced }) {
  const fireX = useMotionValue(0)
  const bgPos = useTransform(fireX, (v) => `${v}% 50%`)

  useEffect(() => {
    if (!isWinner || reduced) { fireX.set(0); return }
    const c = animate(fireX, [0, 100], {
      duration: 1.6,
      repeat: Infinity,
      repeatType: 'mirror',
      ease: 'easeInOut',
    })
    return c.stop
  }, [isWinner, reduced]) // eslint-disable-line react-hooks/exhaustive-deps

  const isPicked = userPick === teamCode
  const isHome = side === 'home'

  const baseColor = isHome
    ? isPicked ? '#1a56db' : 'rgba(26,86,219,0.55)'
    : isPicked ? '#f59e0b' : 'rgba(245,158,11,0.55)'

  // Winner glow: intense fire orange pulse
  const glow = isWinner && !reduced
    ? ['0 0 8px rgba(249,115,22,0.4)', '0 0 22px rgba(249,115,22,0.85)', '0 0 8px rgba(249,115,22,0.4)']
    : isTie && !reduced
    ? ['0 0 4px rgba(245,158,11,0.2)', '0 0 12px rgba(245,158,11,0.5)', '0 0 4px rgba(245,158,11,0.2)']
    : isPicked
    ? isHome ? '0 0 10px rgba(26,86,219,0.6)' : '0 0 10px rgba(245,158,11,0.6)'
    : 'none'

  // Fire gradient — home flows right, away flows left
  const fireGrad = isHome
    ? 'linear-gradient(90deg,#b91c1c 0%,#ea580c 18%,#f97316 35%,#fbbf24 52%,#f97316 68%,#ea580c 82%,#ef4444 100%)'
    : 'linear-gradient(270deg,#b91c1c 0%,#ea580c 18%,#f97316 35%,#fbbf24 52%,#f97316 68%,#ea580c 82%,#ef4444 100%)'

  return (
    <motion.div
      className="relative h-full rounded-full"
      animate={{ width: `${pct}%`, boxShadow: glow }}
      transition={
        (isWinner || isTie) && !reduced
          ? { width: barSpring, boxShadow: { duration: 1.4, repeat: Infinity, ease: 'easeInOut' } }
          : { width: barSpring }
      }
      style={{ width: `${pct}%` }}
    >
      {/* Base colour */}
      <div className="absolute inset-0 rounded-full" style={{ background: baseColor }} />

      {/* Fire gradient overlay on winner */}
      <AnimatePresence>
        {isWinner && !reduced && (
          <motion.div
            key="fire-overlay"
            className="absolute inset-0 rounded-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            style={{
              background: fireGrad,
              backgroundSize: '200% 100%',
              backgroundPosition: bgPos,
            }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ─── Main VoteBar ─────────────────────────────────────────────────────────────

export default function VoteBar({ homePct, awayPct, userPick, homeCode, awayCode }) {
  const reduced = useReducedMotion()
  const [particles, setParticles] = useState([])
  const [embers, setEmbers] = useState([])
  const intervalRef = useRef(null)
  const emberRef = useRef(null)

  const gap = homePct - awayPct
  const isTie = Math.abs(gap) <= TIE_GAP
  const homeLeads = !isTie && gap > 0
  const awayLeads = !isTie && gap < 0
  const winnerPct = homeLeads ? homePct : awayLeads ? awayPct : 50

  const leadRef = useRef({ homeLeads, awayLeads, homePct })
  useEffect(() => { leadRef.current = { homeLeads, awayLeads, homePct } }, [homeLeads, awayLeads, homePct])

  // Main fire sparks — concentrated near boundary
  useEffect(() => {
    if (reduced) return
    const spawn = () => {
      const { homeLeads: hL, awayLeads: aL, homePct: hPct } = leadRef.current
      const id = Date.now() + Math.random()
      const dur = 0.45 + Math.random() * 0.55
      const size = 2 + Math.random() * 3.5

      // Cluster sparks tightly around boundary ± 8%
      const spread = 8
      const base = hPct
      const x = base - spread + Math.random() * (spread * 2)

      const color = pick(FIRE_COLORS)
      const height = 30 + Math.random() * 28
      setParticles((s) => [...s.slice(-12), { id, x, color, dur, size, height }])
    }
    intervalRef.current = setInterval(spawn, 120)
    return () => clearInterval(intervalRef.current)
  }, [reduced])

  // Floating embers — rise slowly above boundary
  useEffect(() => {
    if (reduced) return
    const spawn = () => {
      const { homePct: hPct } = leadRef.current
      const id = 'e' + Date.now() + Math.random()
      const dur = 1.2 + Math.random() * 1.4
      const size = 1.5 + Math.random() * 2.5
      const x = hPct - 12 + Math.random() * 24
      const color = pick(EMBER_COLORS)
      const drift = (Math.random() - 0.5) * 20
      setEmbers((s) => [...s.slice(-8), { id, x, color, dur, size, drift }])
    }
    emberRef.current = setInterval(spawn, 280)
    return () => clearInterval(emberRef.current)
  }, [reduced])

  return (
    <div className="space-y-2">

      {/* Track + particle overlay */}
      <div className="relative">

        {/* Particle + ember layer */}
        {!reduced && (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0"
            style={{ bottom: 0, height: 72, overflow: 'visible', zIndex: 10 }}
          >
            {/* Wide halo glow behind boundary */}
            <AnimatePresence>
              {!isTie && (
                <motion.div
                  key="halo"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0.25, 0.7, 0.25] }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1.0, repeat: Infinity, ease: 'easeInOut' }}
                  style={{
                    position: 'absolute',
                    left: `${homePct}%`,
                    bottom: -2,
                    width: 36,
                    height: 56,
                    marginLeft: -18,
                    background:
                      'radial-gradient(ellipse at 50% 100%, rgba(249,115,22,0.85) 0%, rgba(251,191,36,0.45) 45%, transparent 75%)',
                    filter: 'blur(6px)',
                    borderRadius: 4,
                  }}
                />
              )}
            </AnimatePresence>

            {/* Tight core flame column */}
            <AnimatePresence>
              {!isTie && (
                <motion.div
                  key="core"
                  initial={{ opacity: 0, scaleY: 0.4 }}
                  animate={{
                    opacity: [0.7, 1, 0.7],
                    scaleY: [0.8, 1.15, 0.8],
                    scaleX: [0.9, 1.1, 0.9],
                  }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.7, repeat: Infinity, ease: 'easeInOut' }}
                  style={{
                    position: 'absolute',
                    left: `${homePct}%`,
                    bottom: 0,
                    width: 6,
                    height: '65%',
                    marginLeft: -3,
                    transformOrigin: 'bottom',
                    background:
                      'linear-gradient(to top, rgba(234,88,12,1), rgba(249,115,22,0.85), rgba(251,191,36,0.6), transparent)',
                    filter: 'blur(2px)',
                    borderRadius: 3,
                  }}
                />
              )}
            </AnimatePresence>

            {/* Secondary flame tongues (flicker) */}
            <AnimatePresence>
              {!isTie && (
                <>
                  <motion.div
                    key="flame-l"
                    animate={{ opacity: [0.4, 0.8, 0.3], x: [-2, 1, -3], scaleY: [0.7, 1, 0.6] }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.55, repeat: Infinity, ease: 'easeInOut' }}
                    style={{
                      position: 'absolute',
                      left: `${homePct}%`,
                      bottom: 0,
                      width: 4,
                      height: '45%',
                      marginLeft: -8,
                      transformOrigin: 'bottom',
                      background: 'linear-gradient(to top, rgba(239,68,68,0.9), rgba(251,191,36,0.5), transparent)',
                      filter: 'blur(2.5px)',
                      borderRadius: 3,
                    }}
                  />
                  <motion.div
                    key="flame-r"
                    animate={{ opacity: [0.3, 0.7, 0.4], x: [2, -1, 3], scaleY: [0.6, 1, 0.7] }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.65, repeat: Infinity, ease: 'easeInOut', delay: 0.15 }}
                    style={{
                      position: 'absolute',
                      left: `${homePct}%`,
                      bottom: 0,
                      width: 4,
                      height: '40%',
                      marginLeft: 4,
                      transformOrigin: 'bottom',
                      background: 'linear-gradient(to top, rgba(234,88,12,0.9), rgba(253,230,138,0.5), transparent)',
                      filter: 'blur(2.5px)',
                      borderRadius: 3,
                    }}
                  />
                </>
              )}
            </AnimatePresence>

            {/* Fire sparks rising from boundary */}
            <AnimatePresence>
              {particles.map(({ id, x, color, dur, size, height }) => (
                <motion.div
                  key={id}
                  style={{
                    position: 'absolute',
                    bottom: 2,
                    left: `${x}%`,
                    width: size,
                    height: size,
                    borderRadius: '50%',
                    background: color,
                    filter: 'blur(0.6px)',
                    boxShadow: `0 0 ${size + 1}px ${color}`,
                  }}
                  initial={{ y: 0, opacity: 1, scale: 1 }}
                  animate={{ y: -height, opacity: 0, scale: 0.2 }}
                  exit={{}}
                  transition={{ duration: dur, ease: [0.2, 0.8, 0.6, 1] }}
                  onAnimationComplete={() => setParticles((s) => s.filter((p) => p.id !== id))}
                />
              ))}
            </AnimatePresence>

            {/* Slow-rising embers (drift sideways) */}
            <AnimatePresence>
              {embers.map(({ id, x, color, dur, size, drift }) => (
                <motion.div
                  key={id}
                  style={{
                    position: 'absolute',
                    bottom: 4,
                    left: `${x}%`,
                    width: size,
                    height: size,
                    borderRadius: '50%',
                    background: color,
                    filter: 'blur(0.8px)',
                  }}
                  initial={{ y: 0, opacity: 0.9, x: 0, scale: 1 }}
                  animate={{ y: -62, opacity: 0, x: drift, scale: 0.3 }}
                  exit={{}}
                  transition={{ duration: dur, ease: 'easeOut' }}
                  onAnimationComplete={() => setEmbers((s) => s.filter((e) => e.id !== id))}
                />
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* The bar track itself */}
        <div className="flex h-3.5 w-full overflow-hidden rounded-full bg-line/60 dark:bg-white/10">
          <BarSegment
            pct={homePct}
            isWinner={homeLeads}
            isTie={isTie}
            side="home"
            userPick={userPick}
            teamCode={homeCode}
            reduced={reduced}
          />
          <BarSegment
            pct={awayPct}
            isWinner={awayLeads}
            isTie={isTie}
            side="away"
            userPick={userPick}
            teamCode={awayCode}
            reduced={reduced}
          />
        </div>
      </div>

      {/* Percentage labels */}
      <div className="flex justify-between">
        <span className={`vote-pct ${userPick === homeCode ? 'text-brand font-black' : 'text-brand/70'}`}>
          <AnimatedCounter value={homePct} />%
        </span>
        <span className={`vote-pct ${userPick === awayCode ? 'text-gold-500 font-black' : 'text-gold-500/70'}`}>
          <AnimatedCounter value={awayPct} />%
        </span>
      </div>
    </div>
  )
}
