import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarDays, Radio, Vote, Users, BarChart3, GitCompare } from 'lucide-react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { tournament } from '../lib/teams.js'
import { useApp } from '../context/AppContext.jsx'
import MatchCard from '../components/MatchCard.jsx'
import SectionHeader from '../components/SectionHeader.jsx'
import AdSlot from '../components/AdSlot.jsx'
import SharePredictions from '../components/SharePredictions.jsx'
import { StaggerList, StaggerItem } from '../motion.jsx'
import { fetchCrowdAccuracy } from '../lib/votesApi.js'
import { supabaseEnabled } from '../lib/supabase.js'

// ─── Countdown logic ──────────────────────────────────────────────────────────

function useCountdown(target) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])
  const diff = Math.max(0, new Date(target).getTime() - now)
  const d = Math.floor(diff / 86400000)
  const h = Math.floor((diff % 86400000) / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  const s = Math.floor((diff % 60000) / 1000)
  return { d, h, m, s, done: diff === 0 }
}

// ─── Animated countdown digit — slot-machine flip on change ──────────────────

function CountDigit({ value }) {
  const reduced = useReducedMotion()
  if (reduced) {
    return <span className="block min-w-[2ch] text-center">{value}</span>
  }
  return (
    <span className="relative block min-w-[2ch] overflow-hidden" style={{ height: '1.2em' }}>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={value}
          className="absolute inset-x-0 top-0 text-center"
          initial={{ y: '70%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '-70%', opacity: 0 }}
          transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </span>
  )
}

// ─── Animated headline — word-by-word stagger ────────────────────────────────

const lineContainerA = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.08 } },
}
const lineContainerB = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.33 } },
}
const wordVariant = {
  hidden: { opacity: 0, y: 22, scale: 0.88 },
  show: {
    opacity: 1, y: 0, scale: 1,
    transition: { duration: 0.38, ease: [0.23, 1, 0.32, 1] },
  },
}

function AnimatedHeadline() {
  const reduced = useReducedMotion()
  const headingClass =
    'mt-5 max-w-xl text-4xl font-black leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl'

  if (reduced) {
    return (
      <h1 className={headingClass}>
        Predict every match.<br />
        <span className="text-gold-300">Beat the world.</span>
      </h1>
    )
  }

  return (
    <h1 className={headingClass}>
      <motion.span
        variants={lineContainerA}
        initial="hidden"
        animate="show"
        className="flex flex-wrap gap-x-[0.24em]"
      >
        {['Predict', 'every', 'match.'].map((w, i) => (
          <motion.span key={i} variants={wordVariant} className="inline-block">
            {w}
          </motion.span>
        ))}
      </motion.span>
      <motion.span
        variants={lineContainerB}
        initial="hidden"
        animate="show"
        className="flex flex-wrap gap-x-[0.24em] text-gold-300"
      >
        {['Beat', 'the', 'world.'].map((w, i) => (
          <motion.span key={i} variants={wordVariant} className="inline-block">
            {w}
          </motion.span>
        ))}
      </motion.span>
    </h1>
  )
}

// ─── Quick nav ────────────────────────────────────────────────────────────────

const QUICK = [
  { to: '/schedule',    label: 'Schedule',    icon: CalendarDays },
  { to: '/predictions', label: 'Predict',     icon: Vote },
  { to: '/live',        label: 'Live',        icon: Radio },
  { to: '/teams',       label: 'Teams',       icon: Users },
  { to: '/compare',     label: 'Compare',     icon: GitCompare },
  { to: '/leaderboard', label: 'Ranks',       icon: BarChart3 },
]

// ─── Crowd Accuracy stat ──────────────────────────────────────────────────────

const DEMO_CROWD_STAT = { correct_ct: 41, total_ct: 64, accuracy_pct: 64 }

// rAF-driven ease-out count-up; instantly shows the target when motion is reduced
function CountUp({ to, suffix = '', className }) {
  const reduced = useReducedMotion()
  const [val, setVal] = useState(reduced ? to : 0)
  const rafRef = useRef(null)

  useEffect(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    if (reduced || to === 0) { setVal(to); return }
    const startAt = performance.now()
    const DURATION = 1300
    const tick = (now) => {
      const t = Math.min((now - startAt) / DURATION, 1)
      const eased = 1 - Math.pow(1 - t, 3)   // ease-out cubic
      setVal(Math.round(eased * to))
      if (t < 1) rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [to, reduced])

  return <span className={className}>{val}{suffix}</span>
}

function CrowdAccuracyStat({ stat, loaded, isDemo }) {
  const reduced = useReducedMotion()

  // Loading shimmer
  if (!loaded) {
    return (
      <div className="card p-6 space-y-4">
        <div className="flex items-center gap-2">
          <div className="h-2.5 w-28 rounded-full bg-line animate-pulse" />
        </div>
        <div className="h-12 w-36 rounded-2xl bg-line animate-pulse mx-auto" />
        <div className="grid grid-cols-2 gap-3">
          <div className="h-16 rounded-2xl bg-line animate-pulse" />
          <div className="h-16 rounded-2xl bg-line animate-pulse" />
        </div>
      </div>
    )
  }

  // No settled matches yet — friendly placeholder
  if (!stat || stat.total_ct === 0) {
    return (
      <div className="card px-6 py-10 text-center">
        <p className="text-3xl mb-3" aria-hidden>📊</p>
        <p className="font-extrabold tracking-tight text-ink text-lg">
          Stats live once the tournament kicks off
        </p>
        <p className="mt-2 text-sm text-muted max-w-xs mx-auto leading-relaxed">
          Crowd accuracy will appear here after the first matches are settled
        </p>
      </div>
    )
  }

  return (
    <motion.div
      className="card overflow-hidden p-6"
      initial={!reduced ? { opacity: 0, y: 10 } : { opacity: 0 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.44, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Header row */}
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span aria-hidden className="text-base leading-none">📊</span>
          <span className="section-label">Crowd Intelligence</span>
        </div>
        {isDemo && (
          <span className="rounded-full border border-line/60 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-muted">
            demo
          </span>
        )}
      </div>

      {/* Hero stat — the big number */}
      <div className="text-center">
        <p className="text-sm text-muted">Fans predicted the winner in</p>
        <p className="mt-1 leading-none">
          <CountUp
            to={stat.accuracy_pct}
            suffix="%"
            className="text-5xl font-black tabular-nums text-brand"
          />
          <span className="ml-2 text-lg font-bold text-muted/80">of matches</span>
        </p>
      </div>

      {/* Supporting counts */}
      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-elevated px-4 py-3.5 text-center dark:bg-white/4">
          <CountUp
            to={stat.correct_ct}
            className="text-2xl font-black tabular-nums text-ink"
          />
          <p className="mt-0.5 text-[11px] font-semibold text-muted">called correctly</p>
        </div>
        <div className="rounded-2xl bg-elevated px-4 py-3.5 text-center dark:bg-white/4">
          <CountUp
            to={stat.total_ct}
            className="text-2xl font-black tabular-nums text-ink"
          />
          <p className="mt-0.5 text-[11px] font-semibold text-muted">matches settled</p>
        </div>
      </div>
    </motion.div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Home() {
  const reduced = useReducedMotion()
  const { matches } = useApp()
  const c = useCountdown(tournament.openingMatch.kickoff_ET)
  const featured = matches.slice(0, 3)

  const [crowdStat,   setCrowdStat]   = useState(!supabaseEnabled ? DEMO_CROWD_STAT : null)
  const [crowdLoaded, setCrowdLoaded] = useState(!supabaseEnabled)

  useEffect(() => {
    if (!supabaseEnabled) return
    fetchCrowdAccuracy().then((data) => {
      setCrowdStat(data)
      setCrowdLoaded(true)
    })
  }, [])

  // Shared fade-up helper for hero content items
  const fadeUp = (delay) => ({
    initial: reduced ? { opacity: 0 } : { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.38, ease: 'easeOut', delay },
  })

  return (
    <div className="space-y-10">

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden rounded-3xl px-6 py-14 text-white sm:px-12 sm:py-20 min-h-[340px] sm:min-h-[430px] flex items-center"
        style={{
          backgroundColor: '#081228',
          backgroundImage: "url('/hero-stadium.png')",
          backgroundSize: 'cover',
          backgroundPosition: 'center 55%',
        }}
      >
        {/* Overlay stack */}
        <div className="pointer-events-none absolute inset-0" style={{ background: 'rgba(5,14,56,0.55)' }} />
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'linear-gradient(92deg, rgba(6,16,70,0.98) 0%, rgba(8,20,80,0.94) 30%, rgba(10,24,90,0.80) 50%, rgba(6,14,60,0.35) 68%, transparent 85%)',
          }}
        />
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-20"
          style={{ background: 'linear-gradient(to bottom, rgba(3,6,28,0.6) 0%, transparent 100%)' }}
        />
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-32"
          style={{ background: 'linear-gradient(to top, rgba(3,6,28,0.80) 0%, transparent 100%)' }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute right-0 top-0 bottom-0 hidden sm:block"
          style={{ width: '50%' }}
        >
          <img
            src="/hero-player.jpg"
            alt=""
            className="h-full w-full object-cover object-center"
            style={{
              WebkitMaskImage:
                'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.4) 22%, rgba(0,0,0,0.82) 45%, black 70%, black 100%)',
              maskImage:
                'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.4) 22%, rgba(0,0,0,0.82) 45%, black 70%, black 100%)',
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(to top, rgba(3,6,28,0.65) 0%, transparent 40%), linear-gradient(to left, rgba(3,6,28,0.4) 0%, transparent 30%)',
            }}
          />
        </div>
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.9) 1px, transparent 0)',
            backgroundSize: '22px 22px',
          }}
        />
        <div className="pointer-events-none absolute -top-16 -right-16 h-72 w-72 rounded-full bg-brand-300/15 blur-3xl motion-safe:animate-orb-drift-a" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 h-80 w-80 rounded-full bg-gold/10 blur-3xl motion-safe:animate-orb-drift-b" />
        <div
          className="pointer-events-none absolute inset-y-0 left-0 w-1/3 motion-safe:animate-hero-sweep"
          style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.05) 50%, transparent 100%)' }}
        />

        {/* Hero content */}
        <div className="relative w-full max-w-lg">
          <motion.span
            {...fadeUp(0)}
            className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3.5 py-1 text-[11px] font-extrabold uppercase tracking-[0.12em] backdrop-blur-sm"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-gold-400 shadow-[0_0_6px_rgba(251,191,36,0.8)]" />
            FIFA World Cup 2026
          </motion.span>

          <AnimatedHeadline />

          <motion.p {...fadeUp(0.52)} className="mt-4 max-w-md text-white/75 text-base leading-relaxed">
            Vote on all 104 matches, watch live scores, and climb the leaderboard.
            No signup needed.
          </motion.p>

          <motion.div {...fadeUp(0.62)} className="mt-7 flex flex-wrap gap-3">
            <Link
              to="/predictions"
              className="btn bg-white px-6 py-3 text-brand font-black hover:bg-white/92 shadow-[0_4px_20px_rgba(0,0,0,0.2)] hover:shadow-[0_6px_24px_rgba(0,0,0,0.3)] hover:-translate-y-0.5"
            >
              Start predicting
            </Link>
            <Link
              to="/schedule"
              className="btn border border-white/30 px-6 py-3 text-white font-semibold hover:bg-white/10 backdrop-blur-sm"
            >
              View schedule
            </Link>
          </motion.div>

          {!c.done && (
            <motion.div
              {...fadeUp(0.72)}
              className="mt-8 inline-flex items-center gap-4 rounded-2xl bg-white/10 px-5 py-3.5 backdrop-blur-sm border border-white/10"
            >
              <span className="section-label text-white/60 tracking-[0.14em]">Kickoff in</span>
              <div className="flex gap-3 font-black tabular-nums text-xl">
                {[['d', c.d], ['h', c.h], ['m', c.m], ['s', c.s]].map(([k, v]) => (
                  <span key={k} className="flex flex-col items-center leading-none">
                    <CountDigit value={v} />
                    <span className="mt-0.5 text-[10px] font-bold text-white/55 tracking-widest uppercase">
                      {k}
                    </span>
                  </span>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </section>

      {/* ── Quick links ──────────────────────────────────────────── */}
      <StaggerList className="grid grid-cols-3 gap-3 sm:grid-cols-6">
        {QUICK.map(({ to, label, icon: Icon }) => (
          <StaggerItem key={to} lift>
            <Link
              to={to}
              className="card flex flex-col items-center gap-2.5 py-5 transition-colors duration-200 dark:hover:shadow-[0_4px_20px_rgba(26,86,219,0.25)]"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand/10 text-brand dark:bg-brand/15 shadow-[0_2px_8px_rgba(26,86,219,0.12)]">
                <Icon size={21} />
              </span>
              <span className="text-xs font-bold tracking-wide">{label}</span>
            </Link>
          </StaggerItem>
        ))}
      </StaggerList>

      {/* ── Crowd Intelligence ───────────────────────────────────── */}
      <CrowdAccuracyStat
        stat={crowdStat}
        loaded={crowdLoaded}
        isDemo={!supabaseEnabled}
      />

      {/* ── Share predictions ────────────────────────────────────── */}
      <SharePredictions />

      <AdSlot label="Ad · below navbar" />

      {/* ── Featured matches ─────────────────────────────────────── */}
      <section>
        <SectionHeader
          title="Vote on the next matches"
          subtitle="Tap a team to lock your prediction"
          to="/predictions"
        />
        <StaggerList className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {featured.map((m) => (
            <StaggerItem key={m.id}>
              <MatchCard match={m} />
            </StaggerItem>
          ))}
        </StaggerList>
      </section>

    </div>
  )
}
