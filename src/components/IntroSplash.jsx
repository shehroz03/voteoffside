import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { Trophy } from 'lucide-react'

// ─── One-time cinematic intro ───────────────────────────────────────────────────
// Plays once per browser session (sessionStorage gated) so it greets a first-time
// visitor without nagging on every internal navigation.

const KEY = 'vos_intro_played'

const BRAND = 'VoteOffside'

export default function IntroSplash() {
  const reduced = useReducedMotion()
  const [show, setShow] = useState(false)

  useEffect(() => {
    let seen = false
    try { seen = sessionStorage.getItem(KEY) === '1' } catch { /* ignore */ }
    if (seen) return
    setShow(true)
    try { document.body.style.overflow = 'hidden' } catch { /* ignore */ }
    const hold = reduced ? 700 : 2300
    const t = setTimeout(() => {
      setShow(false)
      try { sessionStorage.setItem(KEY, '1') } catch { /* ignore */ }
      try { document.body.style.overflow = '' } catch { /* ignore */ }
    }, hold)
    return () => { clearTimeout(t); try { document.body.style.overflow = '' } catch { /* ignore */ } }
  }, [reduced])

  const node = (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-[120] flex flex-col items-center justify-center overflow-hidden"
          style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 40%, #0c1d52 0%, #060f2c 55%, #03061a 100%)' }}
          initial={{ opacity: 1 }}
          exit={reduced
            ? { opacity: 0, transition: { duration: 0.4 } }
            : { y: '-100%', transition: { duration: 0.7, ease: [0.76, 0, 0.24, 1] } }}
        >
          {/* Drifting ambient orbs */}
          <div className="pointer-events-none absolute -top-24 left-1/4 h-80 w-80 rounded-full bg-brand-500/20 blur-3xl motion-safe:animate-orb-drift-a" />
          <div className="pointer-events-none absolute -bottom-24 right-1/4 h-96 w-96 rounded-full bg-purple-500/12 blur-3xl motion-safe:animate-orb-drift-b" />
          <div className="pointer-events-none absolute inset-0 opacity-[0.06]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px,rgba(255,255,255,0.9) 1px,transparent 0)', backgroundSize: '26px 26px' }} />

          {/* Trophy in spinning aurora ring */}
          <motion.div
            className="relative flex h-28 w-28 items-center justify-center"
            initial={reduced ? { scale: 1, opacity: 0 } : { scale: 0.4, opacity: 0, rotate: -25 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 16, delay: 0.05 }}
          >
            {!reduced && (
              <span
                className="absolute inset-0 rounded-full motion-safe:animate-spin-slow"
                style={{ background: 'conic-gradient(from 0deg, #1a56db, #7c3aed, #f59e0b, #2563eb, #1a56db)', filter: 'blur(6px)', opacity: 0.85 }}
              />
            )}
            <span className="absolute inset-[3px] rounded-full" style={{ background: 'radial-gradient(circle at 35% 30%, #1b2c63, #0a1330)' }} />
            <motion.span
              className="relative"
              animate={reduced ? {} : { y: [0, -6, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Trophy size={46} className="text-white drop-shadow-[0_2px_12px_rgba(251,191,36,0.6)]" />
            </motion.span>
          </motion.div>

          {/* Brand name — letters cascade in */}
          <div className="mt-7 flex overflow-hidden text-4xl font-black tracking-tight sm:text-5xl">
            {BRAND.split('').map((ch, i) => (
              <motion.span
                key={i}
                className="text-aurora"
                initial={reduced ? { opacity: 0 } : { y: '110%', opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 + i * 0.04, duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
              >
                {ch}
              </motion.span>
            ))}
          </div>

          {/* Tagline */}
          <motion.p
            className="mt-3 text-sm font-semibold uppercase tracking-[0.32em] text-white/45"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.85, duration: 0.5 }}
          >
            FIFA World Cup 2026
          </motion.p>

          {/* Loading sweep bar */}
          {!reduced && (
            <div className="mt-9 h-[3px] w-44 overflow-hidden rounded-full bg-white/10">
              <motion.div
                className="h-full w-full rounded-full"
                style={{ background: 'linear-gradient(90deg, #1a56db, #7c3aed, #f59e0b)' }}
                initial={{ x: '-100%' }}
                animate={{ x: '0%' }}
                transition={{ delay: 0.5, duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )

  if (typeof document === 'undefined') return null
  return createPortal(node, document.body)
}
