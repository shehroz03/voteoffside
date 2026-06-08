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

// ─── Bar spring (unchanged) ──────────────────────────────────────────────────

const barSpring = {
  type: 'spring',
  stiffness: 160,
  damping: 24,
  mass: 0.8,
}

// ─── Momentum threshold ──────────────────────────────────────────────────────

const TIE_GAP = 5

// ─── One portion of the vote bar (home OR away) ──────────────────────────────
// Handles fire gradient, glow pulse, and smooth transitions when leadership flips.

function FirePortion({ pct, isWinner, isTie, side, userPick, teamCode, reduced }) {
  // MotionValue drives background-position for the shifting fire gradient
  const fireX = useMotionValue(0)
  const bgPos = useTransform(fireX, (v) => `${v}% 50%`)

  useEffect(() => {
    if (!isWinner || reduced) {
      fireX.set(0)
      return
    }
    const c = animate(fireX, [0, 100], {
      duration: 2.0,
      repeat: Infinity,
      repeatType: 'mirror',
      ease: 'easeInOut',
    })
    return c.stop
  }, [isWinner, reduced]) // eslint-disable-line react-hooks/exhaustive-deps

  const isPicked = userPick === teamCode

  // Base colour (shows underneath / when fire fades)
  const baseColor =
    side === 'home'
      ? isPicked
        ? '#1a56db'
        : 'rgba(26,86,219,0.5)'
      : isPicked
        ? '#f59e0b'
        : 'rgba(245,158,11,0.5)'

  // Box-shadow: winner = orange fire pulse, tie = mild gold pulse, picked = team colour
  const winnerGlow = [
    '0 0 6px rgba(249,115,22,0.3)',
    '0 0 16px rgba(249,115,22,0.75)',
    '0 0 6px rgba(249,115,22,0.3)',
  ]
  const tieGlow = [
    '0 0 3px rgba(245,158,11,0.15)',
    '0 0 9px rgba(245,158,11,0.38)',
    '0 0 3px rgba(245,158,11,0.15)',
  ]
  const staticGlow =
    isPicked
      ? side === 'home'
        ? '0 0 8px rgba(26,86,219,0.5)'
        : '0 0 8px rgba(245,158,11,0.5)'
      : '0 0 0px transparent'

  const glowAnim =
    isWinner && !reduced ? winnerGlow : isTie && !reduced ? tieGlow : staticGlow

  const glowTransition =
    (isWinner || isTie) && !reduced
      ? { duration: 1.4, repeat: Infinity, ease: 'easeInOut' }
      : undefined

  // Fire gradient: pushes toward boundary from outer edge
  const fireGradient =
    side === 'home'
      ? 'linear-gradient(90deg, #ea580c 0%, #f97316 20%, #fbbf24 45%, #ef4444 70%, #f97316 88%, #fbbf24 100%)'
      : 'linear-gradient(270deg, #ea580c 0%, #f97316 20%, #fbbf24 45%, #ef4444 70%, #f97316 88%, #fbbf24 100%)'

  return (
    <motion.div
      className="relative h-full rounded-full"
      animate={{
        width: `${pct}%`,
        boxShadow: glowAnim,
      }}
      transition={
        glowTransition
          ? { width: barSpring, boxShadow: glowTransition }
          : { width: barSpring }
      }
      style={{ width: `${pct}%` }}
    >
      {/* Base team colour — always visible, fades when fire overlays it */}
      <div
        className="absolute inset-0 rounded-full"
        style={{ background: baseColor }}
      />

      {/* Fire gradient overlay — fades in when winning, out when not */}
      <AnimatePresence>
        {isWinner && !reduced && (
          <motion.div
            key="fire"
            className="absolute inset-0 rounded-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.55, ease: 'easeInOut' }}
            style={{
              background: fireGradient,
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

const FIRE_COLORS = ['#fbbf24', '#f97316', '#ef4444', '#fde68a', '#fb923c']

export default function VoteBar({ homePct, awayPct, userPick, homeCode, awayCode }) {
  const reduced = useReducedMotion()
  const [sparks, setSparks] = useState([])
  const intervalRef = useRef(null)

  // Derive momentum state
  const gap = homePct - awayPct
  const isTie = Math.abs(gap) <= TIE_GAP
  const homeLeads = !isTie && gap > 0
  const awayLeads = !isTie && gap < 0

  // Ref so the interval callback always reads current momentum without restarting
  const leadRef = useRef({ homeLeads, awayLeads, homePct })
  useEffect(() => {
    leadRef.current = { homeLeads, awayLeads, homePct }
  }, [homeLeads, awayLeads, homePct])

  // Spark particle spawner — interval never restarts due to pct changes
  useEffect(() => {
    if (reduced) return

    const spawn = () => {
      const { homeLeads: hL, awayLeads: aL, homePct: hPct } = leadRef.current
      const id = Date.now() + Math.random()
      const dur = 0.55 + Math.random() * 0.4

      let x
      if (hL) {
        // concentrate near boundary
        const lo = Math.max(2, hPct * 0.15)
        const hi = Math.max(lo + 2, hPct - 2)
        x = lo + Math.random() * (hi - lo)
      } else if (aL) {
        const lo = hPct + 2
        const hi = Math.min(98, hPct + (100 - hPct) * 0.85)
        x = lo + Math.random() * (hi - lo)
      } else {
        x = 5 + Math.random() * 90
      }

      const color = FIRE_COLORS[Math.floor(Math.random() * FIRE_COLORS.length)]
      setSparks((s) => [...s.slice(-7), { id, x, color, dur }])
    }

    intervalRef.current = setInterval(spawn, 430)
    return () => clearInterval(intervalRef.current)
  }, [reduced]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-2">

      {/* Track + particle overlay */}
      <div className="relative">

        {/* Particle layer — sits above the track, overflows upward into card body */}
        {!reduced && (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0"
            style={{ bottom: 0, height: 46, overflow: 'visible', zIndex: 10 }}
          >
            {/* Boundary flame column */}
            <AnimatePresence>
              {!isTie && (
                <motion.div
                  key="boundary"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0.45, 1, 0.45] }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut' }}
                  style={{
                    position: 'absolute',
                    left: `${homePct}%`,
                    bottom: 0,
                    width: 5,
                    height: '75%',
                    marginLeft: -2.5,
                    background:
                      'linear-gradient(to top, rgba(249,115,22,0.95), rgba(251,191,36,0.6), transparent)',
                    filter: 'blur(2.5px)',
                    borderRadius: 2,
                  }}
                />
              )}
            </AnimatePresence>

            {/* Sparks */}
            <AnimatePresence>
              {sparks.map(({ id, x, color, dur }) => (
                <motion.div
                  key={id}
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: `${x}%`,
                    width: 3,
                    height: 3,
                    borderRadius: '50%',
                    background: color,
                    filter: 'blur(0.5px)',
                  }}
                  initial={{ y: 0, opacity: 0.9, scale: 1 }}
                  animate={{ y: -40, opacity: 0, scale: 0.35 }}
                  exit={{}}
                  transition={{ duration: dur, ease: 'easeOut' }}
                  onAnimationComplete={() =>
                    setSparks((s) => s.filter((sp) => sp.id !== id))
                  }
                />
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Bar track */}
        <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-line/60 dark:bg-line/40">
          <FirePortion
            pct={homePct}
            isWinner={homeLeads}
            isTie={isTie}
            side="home"
            userPick={userPick}
            teamCode={homeCode}
            reduced={reduced}
          />
          <FirePortion
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
        <span className={`vote-pct ${userPick === homeCode ? 'text-brand' : 'text-brand/70'}`}>
          <AnimatedCounter value={homePct} />%
        </span>
        <span className={`vote-pct ${userPick === awayCode ? 'text-gold-500' : 'text-gold-500/70'}`}>
          <AnimatedCounter value={awayPct} />%
        </span>
      </div>

    </div>
  )
}
