import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarDays, Radio, Vote, Users, BarChart3, GitCompare, ChevronRight, Globe2, Trophy, Flame, Zap } from 'lucide-react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { tournament } from '../lib/teams.js'
import { useApp } from '../context/AppContext.jsx'
import MatchCard from '../components/MatchCard.jsx'
import SectionHeader from '../components/SectionHeader.jsx'
import AdSlot from '../components/AdSlot.jsx'
import SharePredictions from '../components/SharePredictions.jsx'
import GoatPoll from '../components/GoatPoll.jsx'
import { StaggerList, StaggerItem, Reveal } from '../motion.jsx'
import { fetchCrowdAccuracy } from '../lib/votesApi.js'
import { supabaseEnabled } from '../lib/supabase.js'

const WC_START = new Date('2026-06-11T00:00:00Z')
function getTournamentDay() {
  const diff = Date.now() - WC_START.getTime()
  if (diff < 0) return null
  return Math.floor(diff / 86400000) + 1
}

// ─── Countdown ────────────────────────────────────────────────────────────────

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

function CountDigit({ value }) {
  const reduced = useReducedMotion()
  if (reduced) return <span className="block min-w-[2ch] text-center">{value}</span>
  return (
    <span className="relative block min-w-[2ch] overflow-hidden" style={{ height: '1.2em' }}>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={value}
          className="absolute inset-x-0 top-0 text-center"
          initial={{ y: '70%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '-70%', opacity: 0 }}
          transition={{ duration: 0.18, ease: [0.22,1,0.36,1] }}
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </span>
  )
}

// ─── Animated headline ────────────────────────────────────────────────────────

const lineContainerA = { hidden: {}, show: { transition: { staggerChildren: 0.07, delayChildren: 0.08 } } }
const lineContainerB = { hidden: {}, show: { transition: { staggerChildren: 0.07, delayChildren: 0.33 } } }
const wordVariant = {
  hidden: { opacity: 0, y: 22, scale: 0.88 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.38, ease: [0.23,1,0.32,1] } },
}

function AnimatedHeadline() {
  const reduced = useReducedMotion()
  const cls = 'mt-5 max-w-xl text-4xl font-black leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl'
  if (reduced) {
    return (
      <h1 className={cls}>
        Predict every match.<br />
        <span className="text-gold-shine">Beat the world.</span>
      </h1>
    )
  }
  return (
    <h1 className={cls}>
      <motion.span variants={lineContainerA} initial="hidden" animate="show" className="flex flex-wrap gap-x-[0.24em]">
        {['Predict', 'every', 'match.'].map((w, i) => (
          <motion.span key={i} variants={wordVariant} className="inline-block">{w}</motion.span>
        ))}
      </motion.span>
      <motion.span variants={lineContainerB} initial="hidden" animate="show" className="flex flex-wrap gap-x-[0.24em] text-gold-300">
        {['Beat', 'the', 'world.'].map((w, i) => (
          <motion.span key={i} variants={wordVariant} className="inline-block text-gold-shine">{w}</motion.span>
        ))}
      </motion.span>
    </h1>
  )
}

// ─── Quick nav config ─────────────────────────────────────────────────────────

const QUICK = [
  { to: '/schedule',    label: 'Schedule', icon: CalendarDays, iconBg: 'bg-blue-500/12 dark:bg-blue-500/18',   iconColor: 'text-blue-500',   shadow: 'shadow-[0_3px_12px_rgba(59,130,246,0.22)]',   hoverBorder: 'hover:border-blue-500/40' },
  { to: '/predictions', label: 'Predict',  icon: Vote,         iconBg: 'bg-emerald-500/12 dark:bg-emerald-500/18', iconColor: 'text-emerald-500', shadow: 'shadow-[0_3px_12px_rgba(16,185,129,0.22)]',   hoverBorder: 'hover:border-emerald-500/40' },
  { to: '/live',        label: 'Live',     icon: Radio,        iconBg: 'bg-red-500/12 dark:bg-red-500/18',     iconColor: 'text-red-500',    shadow: 'shadow-[0_3px_12px_rgba(239,68,68,0.22)]',    hoverBorder: 'hover:border-red-500/40' },
  { to: '/teams',       label: 'Teams',    icon: Users,        iconBg: 'bg-purple-500/12 dark:bg-purple-500/18', iconColor: 'text-purple-500', shadow: 'shadow-[0_3px_12px_rgba(168,85,247,0.22)]',  hoverBorder: 'hover:border-purple-500/40' },
  { to: '/compare',     label: 'Compare',  icon: GitCompare,   iconBg: 'bg-orange-500/12 dark:bg-orange-500/18', iconColor: 'text-orange-500', shadow: 'shadow-[0_3px_12px_rgba(249,115,22,0.22)]',  hoverBorder: 'hover:border-orange-500/40' },
  { to: '/leaderboard', label: 'Ranks',    icon: BarChart3,    iconBg: 'bg-amber-500/12 dark:bg-amber-500/18',  iconColor: 'text-amber-500',  shadow: 'shadow-[0_3px_12px_rgba(245,158,11,0.22)]',  hoverBorder: 'hover:border-amber-500/40' },
]

// ─── CountUp animation ────────────────────────────────────────────────────────

const DEMO_CROWD_STAT = { correct_ct: 41, total_ct: 64, accuracy_pct: 64 }

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
      const eased = 1 - Math.pow(1 - t, 3)
      setVal(Math.round(eased * to))
      if (t < 1) rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [to, reduced])
  return <span className={className}>{val}{suffix}</span>
}

// ─── Crowd Accuracy card ──────────────────────────────────────────────────────

function CrowdAccuracyStat({ stat, loaded, isDemo }) {
  const reduced = useReducedMotion()

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

  if (!stat || stat.total_ct === 0) {
    return (
      <div className="card px-6 py-10 text-center">
        <p className="text-3xl mb-3" aria-hidden>📊</p>
        <p className="font-extrabold tracking-tight text-ink text-lg">Stats live once the tournament kicks off</p>
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
      transition={{ duration: 0.44, ease: [0.22,1,0.36,1] }}
    >
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span aria-hidden className="text-base leading-none">📊</span>
          <span className="section-label">Crowd Intelligence</span>
        </div>
        {isDemo && (
          <span className="rounded-full border border-line/60 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-muted">demo</span>
        )}
      </div>

      <div className="text-center">
        <p className="text-sm text-muted">Fans predicted the winner in</p>
        <p className="mt-1 leading-none">
          <CountUp to={stat.accuracy_pct} suffix="%" className="text-5xl font-black tabular-nums text-aurora" />
          <span className="ml-2 text-lg font-bold text-muted/80">of matches</span>
        </p>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-elevated px-4 py-3.5 text-center dark:bg-white/4">
          <CountUp to={stat.correct_ct} className="text-2xl font-black tabular-nums text-ink" />
          <p className="mt-0.5 text-[11px] font-semibold text-muted">called correctly</p>
        </div>
        <div className="rounded-2xl bg-elevated px-4 py-3.5 text-center dark:bg-white/4">
          <CountUp to={stat.total_ct} className="text-2xl font-black tabular-nums text-ink" />
          <p className="mt-0.5 text-[11px] font-semibold text-muted">matches settled</p>
        </div>
      </div>
    </motion.div>
  )
}

// ─── World Cup stats band ───────────────────────────────────────────────────────

const WC_STATS = [
  { icon: Globe2, value: '48',  label: 'Teams',   color: 'text-blue-300' },
  { icon: Flame,  value: '104', label: 'Matches', color: 'text-orange-300' },
  { icon: Trophy, value: '1',   label: 'Trophy',  color: 'text-gold-300' },
]

function WorldCupBand() {
  const reduced = useReducedMotion()
  return (
    <section
      className="relative overflow-hidden rounded-3xl px-6 py-10 sm:px-10 sm:py-12 text-white"
      style={{ backgroundColor: '#06122e' }}
    >
      {/* Stadium image background */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: "url('/hero-stadium.png')",
          backgroundSize: 'cover',
          backgroundPosition: 'center 40%',
          opacity: 0.42,
        }}
      />
      <div className="pointer-events-none absolute inset-0" style={{ background: 'linear-gradient(120deg, rgba(6,16,46,0.95) 0%, rgba(8,20,70,0.78) 45%, rgba(124,58,237,0.25) 100%)' }} />
      <div className="pointer-events-none absolute -top-16 right-10 h-56 w-56 rounded-full bg-gold/15 blur-3xl motion-safe:animate-orb-drift-a" />

      <div className="relative flex flex-col items-center gap-7 text-center">
        <div>
          <div className="flex items-center justify-center gap-2 mb-1">
            <motion.span
              className="h-2 w-2 rounded-full bg-red-500"
              animate={{ opacity: [1, 0.15, 1], scale: [1, 1.5, 1] }}
              transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut' }}
            />
            <span className="section-label text-red-400/90 tracking-[0.18em]">Tournament Underway</span>
          </div>
          <h2 className="mt-2 text-2xl font-black tracking-tight sm:text-4xl">
            104 matches. One <span className="text-gold-shine">champion.</span><br className="hidden sm:block" /> Your call.
          </h2>
        </div>

        {/* Stat trio */}
        <div className="grid w-full max-w-lg grid-cols-3 gap-3 sm:gap-4">
          {WC_STATS.map(({ icon: Icon, value, label, color }, i) => (
            <motion.div
              key={label}
              className="glass rounded-2xl px-2 py-4 sm:py-5"
              initial={reduced ? { opacity: 0 } : { opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 + i * 0.1, duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
            >
              <Icon size={22} className={`mx-auto mb-1.5 ${color}`} />
              <p className="text-2xl font-black tabular-nums sm:text-3xl">{value}</p>
              <p className="text-[11px] font-bold uppercase tracking-wider text-white/55">{label}</p>
            </motion.div>
          ))}
        </div>

        <Link
          to="/predictions"
          className="sheen btn bg-gold-gradient px-7 py-3 font-black text-[#3a2406] shadow-[0_6px_24px_rgba(245,158,11,0.4)] hover:-translate-y-0.5 hover:shadow-[0_10px_32px_rgba(245,158,11,0.55)]"
        >
          Make your predictions
        </Link>
      </div>
    </section>
  )
}

// ─── FIFA Live Day Poster ─────────────────────────────────────────────────────

function FifaLivePoster() {
  const reduced = useReducedMotion()
  const day = getTournamentDay()
  if (!day) return null

  const today = new Date()
  const dateStr = today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })

  return (
    <motion.section
      initial={reduced ? { opacity: 0 } : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.23, 1, 0.32, 1] }}
      className="relative overflow-hidden rounded-3xl text-white"
      style={{ background: 'linear-gradient(135deg, #02071a 0%, #0b1d4e 45%, #06102e 100%)' }}
    >
      {/* Background glow blobs */}
      <div aria-hidden className="pointer-events-none absolute -top-20 -left-20 h-72 w-72 rounded-full bg-red-600/12 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -bottom-16 right-10 h-64 w-64 rounded-full bg-yellow-400/10 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-48 w-96 rounded-full bg-blue-700/15 blur-2xl" />

      {/* Top accent — red stripe */}
      <div className="absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r from-red-700 via-red-500 to-red-700" />

      {/* Dot grid overlay */}
      <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px,rgba(255,255,255,0.9) 1px,transparent 0)', backgroundSize: '20px 20px' }} />

      <div className="relative px-6 py-8 sm:px-10 sm:py-10">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 sm:gap-10">

          {/* Left — main content */}
          <div className="flex-1 text-center sm:text-left">
            {/* LIVE badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-red-500/40 bg-red-500/15 px-4 py-1.5 mb-4">
              <motion.span
                className="h-2 w-2 rounded-full bg-red-500"
                animate={{ opacity: [1, 0.1, 1], scale: [1, 1.6, 1] }}
                transition={{ duration: 1.0, repeat: Infinity, ease: 'easeInOut' }}
              />
              <span className="text-[11px] font-black uppercase tracking-[0.2em] text-red-400">FIFA World Cup · Live Now</span>
            </div>

            {/* Headline */}
            <h2 className="text-3xl sm:text-5xl font-black leading-none tracking-tight">
              <span className="block text-white/90">FIFA</span>
              <span className="block text-yellow-400 drop-shadow-[0_0_24px_rgba(251,191,36,0.5)]">World Cup 2026™</span>
              <span className="block text-white/90">Is Happening.</span>
            </h2>

            <p className="mt-3 text-sm text-white/55 font-medium">{dateStr}</p>

            {/* Host nations */}
            <div className="mt-4 flex items-center justify-center sm:justify-start gap-3 text-sm font-bold text-white/80">
              <span>🇺🇸 USA</span>
              <span className="text-white/25">·</span>
              <span>🇨🇦 Canada</span>
              <span className="text-white/25">·</span>
              <span>🇲🇽 Mexico</span>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-center sm:justify-start gap-3">
              <Link
                to="/live"
                className="inline-flex items-center gap-2 rounded-xl bg-red-500 px-5 py-2.5 text-sm font-black text-white shadow-[0_4px_18px_rgba(239,68,68,0.4)] hover:bg-red-400 hover:-translate-y-0.5 transition-all"
              >
                <Zap size={14} />
                Live Scores
              </Link>
              <Link
                to="/predictions"
                className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-5 py-2.5 text-sm font-semibold text-white/80 hover:bg-white/8 hover:text-white transition-all backdrop-blur-sm"
              >
                Make Predictions
              </Link>
            </div>
          </div>

          {/* Right — Day counter */}
          <div className="shrink-0 flex flex-col items-center gap-2">
            <div
              className="relative flex flex-col items-center justify-center rounded-2xl border border-yellow-400/20 bg-white/4 px-8 py-6 backdrop-blur-sm"
              style={{ minWidth: 130 }}
            >
              <span className="text-[10px] font-black uppercase tracking-[0.25em] text-white/50 mb-1">Tournament</span>
              <span className="text-7xl font-black tabular-nums leading-none text-yellow-400 drop-shadow-[0_0_20px_rgba(251,191,36,0.6)]">{day}</span>
              <span className="mt-1 text-xs font-black uppercase tracking-[0.18em] text-white/60">Day{day === 1 ? '' : 's'} In</span>
              {/* Glow ring */}
              <div aria-hidden className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-yellow-400/15" />
            </div>

            {/* Stats row */}
            <div className="flex gap-2 mt-1">
              {[{ v: 48, l: 'Teams' }, { v: 104, l: 'Matches' }].map(({ v, l }) => (
                <div key={l} className="flex flex-col items-center rounded-xl bg-white/5 border border-white/8 px-3 py-2">
                  <span className="text-base font-black text-white/90 tabular-nums">{v}</span>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-white/40">{l}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* Bottom shimmer */}
      <motion.div
        className="pointer-events-none absolute inset-0 rounded-3xl"
        style={{ background: 'linear-gradient(110deg, transparent 35%, rgba(255,255,255,0.04) 50%, transparent 65%)' }}
        animate={{ backgroundPosition: ['200% 0', '-200% 0'] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'linear', repeatDelay: 1.5 }}
      />
    </motion.section>
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
    fetchCrowdAccuracy().then((data) => { setCrowdStat(data); setCrowdLoaded(true) })
  }, [])

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
        <div className="pointer-events-none absolute inset-0" style={{ background: 'linear-gradient(92deg,rgba(6,16,70,0.98) 0%,rgba(8,20,80,0.94) 30%,rgba(10,24,90,0.80) 50%,rgba(6,14,60,0.35) 68%,transparent 85%)' }} />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-20" style={{ background: 'linear-gradient(to bottom,rgba(3,6,28,0.6) 0%,transparent 100%)' }} />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32" style={{ background: 'linear-gradient(to top,rgba(3,6,28,0.80) 0%,transparent 100%)' }} />

        {/* Player photo — right side */}
        <div aria-hidden className="pointer-events-none absolute right-0 top-0 bottom-0 hidden sm:block" style={{ width: '50%' }}>
          <img src="/hero-player.jpg" alt="" className="h-full w-full object-cover object-center"
            style={{ WebkitMaskImage: 'linear-gradient(to right,transparent 0%,rgba(0,0,0,0.4) 22%,rgba(0,0,0,0.82) 45%,black 70%,black 100%)', maskImage: 'linear-gradient(to right,transparent 0%,rgba(0,0,0,0.4) 22%,rgba(0,0,0,0.82) 45%,black 70%,black 100%)' }} />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to top,rgba(3,6,28,0.65) 0%,transparent 40%),linear-gradient(to left,rgba(3,6,28,0.4) 0%,transparent 30%)' }} />
        </div>

        {/* Dot grid */}
        <div className="pointer-events-none absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px,rgba(255,255,255,0.9) 1px,transparent 0)', backgroundSize: '22px 22px' }} />

        {/* Orbs */}
        <div className="pointer-events-none absolute -top-16 -right-16 h-72 w-72 rounded-full bg-brand-300/15 blur-3xl motion-safe:animate-orb-drift-a" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 h-80 w-80 rounded-full bg-gold/10 blur-3xl motion-safe:animate-orb-drift-b" />
        <div className="pointer-events-none absolute inset-y-0 left-0 w-1/3 motion-safe:animate-hero-sweep" style={{ background: 'linear-gradient(90deg,transparent 0%,rgba(255,255,255,0.05) 50%,transparent 100%)' }} />

        {/* Content */}
        <div className="relative w-full max-w-lg">
          <motion.span {...fadeUp(0)} className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3.5 py-1 text-[11px] font-extrabold uppercase tracking-[0.12em] backdrop-blur-sm border border-red-500/30">
            <motion.span
              className="h-1.5 w-1.5 rounded-full bg-red-500"
              animate={{ opacity: [1, 0.15, 1], scale: [1, 1.4, 1] }}
              transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut' }}
            />
            🔴 Live · FIFA World Cup 2026
          </motion.span>

          <AnimatedHeadline />

          <motion.p {...fadeUp(0.52)} className="mt-4 max-w-md text-white/75 text-base leading-relaxed">
            Sign in to vote on all 104 matches, watch live scores, and climb the leaderboard.
          </motion.p>

          <motion.div {...fadeUp(0.62)} className="mt-7 flex flex-wrap gap-3">
            <Link to="/predictions" className="sheen btn bg-white px-6 py-3 text-brand font-black hover:bg-white shadow-[0_4px_20px_rgba(0,0,0,0.2)] hover:shadow-[0_8px_28px_rgba(251,191,36,0.35)] hover:-translate-y-0.5">
              Start predicting
            </Link>
            <Link to="/schedule" className="btn border border-white/30 px-6 py-3 text-white font-semibold hover:bg-white/10 backdrop-blur-sm">
              View schedule
            </Link>
          </motion.div>

          {c.done ? (
            <motion.div {...fadeUp(0.72)} className="mt-8 inline-flex items-center gap-3 rounded-2xl bg-red-500/15 px-5 py-3 backdrop-blur-sm border border-red-500/25">
              <motion.span
                className="h-2 w-2 shrink-0 rounded-full bg-red-500"
                animate={{ opacity: [1, 0.1, 1], scale: [1, 1.5, 1] }}
                transition={{ duration: 1.0, repeat: Infinity, ease: 'easeInOut' }}
              />
              <span className="text-sm font-black text-white/90">
                FIFA World Cup 2026 is <span className="text-red-400">LIVE</span> · Day {getTournamentDay()}
              </span>
              <Link to="/live" className="ml-1 shrink-0 rounded-lg bg-red-500/20 px-2.5 py-0.5 text-[11px] font-black text-red-300 hover:bg-red-500/35 transition-colors border border-red-500/30">
                Scores →
              </Link>
            </motion.div>
          ) : (
            <motion.div {...fadeUp(0.72)} className="mt-8 inline-flex items-center gap-4 rounded-2xl bg-white/10 px-5 py-3.5 backdrop-blur-sm border border-white/10">
              <span className="section-label text-white/60 tracking-[0.14em]">Kickoff in</span>
              <div className="flex gap-3 font-black tabular-nums text-xl">
                {[['d', c.d], ['h', c.h], ['m', c.m], ['s', c.s]].map(([k, v]) => (
                  <span key={k} className="flex flex-col items-center leading-none">
                    <CountDigit value={v} />
                    <span className="mt-0.5 text-[10px] font-bold text-white/55 tracking-widest uppercase">{k}</span>
                  </span>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </section>

      {/* ── FIFA Live Poster ─────────────────────────────────────── */}
      <FifaLivePoster />

      {/* ── Quick links ──────────────────────────────────────────── */}
      <StaggerList className="grid grid-cols-3 gap-3 sm:grid-cols-6">
        {QUICK.map(({ to, label, icon: Icon, iconBg, iconColor, shadow, hoverBorder }) => (
          <StaggerItem key={to} lift>
            <Link to={to} className={`sheen quick-card border border-line/60 hover:shadow-lg ${hoverBorder}`}>
              <span className={`quick-icon ${iconBg} ${iconColor} ${shadow}`}>
                <Icon size={22} />
              </span>
              <span className="text-xs font-bold tracking-wide text-ink">{label}</span>
            </Link>
          </StaggerItem>
        ))}
      </StaggerList>

      {/* ── Crowd Intelligence ───────────────────────────────────── */}
      <Reveal>
        <CrowdAccuracyStat stat={crowdStat} loaded={crowdLoaded} isDemo={!supabaseEnabled} />
      </Reveal>

      {/* ── World Cup band ───────────────────────────────────────── */}
      <Reveal>
        <WorldCupBand />
      </Reveal>

      {/* ── GOAT poll ────────────────────────────────────────────── */}
      <Reveal>
        <GoatPoll />
      </Reveal>

      {/* ── Share predictions ────────────────────────────────────── */}
      <Reveal>
        <SharePredictions />
      </Reveal>

      <AdSlot label="Ad · below navbar" />

      {/* ── Featured matches ─────────────────────────────────────── */}
      <Reveal><section>
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <div className="section-divider mb-2">Next Matches</div>
            <h2 className="text-xl font-extrabold tracking-tight sm:text-2xl leading-none">Vote on the next matches</h2>
            <p className="mt-1 text-sm text-muted">Tap a team to lock your prediction</p>
          </div>
          <Link to="/predictions" className="shrink-0 inline-flex items-center gap-1 rounded-xl border border-line/60 px-3 py-1.5 text-xs font-bold text-brand hover:bg-brand/5 hover:border-brand/40 transition-all dark:border-white/10 dark:hover:bg-brand/10">
            See all <ChevronRight size={12} />
          </Link>
        </div>
        <StaggerList className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {featured.map((m) => (
            <StaggerItem key={m.id}>
              <MatchCard match={m} />
            </StaggerItem>
          ))}
        </StaggerList>
      </section></Reveal>

    </div>
  )
}
