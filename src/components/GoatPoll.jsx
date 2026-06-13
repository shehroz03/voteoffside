import { useEffect, useMemo, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { Crown, Check, Loader2 } from 'lucide-react'
import confetti from 'canvas-confetti'
import { getPlayer } from '../lib/players.js'
import { getTeam } from '../lib/teams.js'
import TeamBadge from './TeamBadge.jsx'
import Avatar from './Avatar.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { supabase, supabaseEnabled } from '../lib/supabase.js'
import AuthModal from './AuthModal.jsx'
import { GOAT_PLAYERS, fetchGoatState, castGoatVote, sumGoatCounts } from '../lib/goatPoll.js'

function hexToRgba(hex, a) {
  const n = parseInt(hex.slice(1), 16)
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`
}

export default function GoatPoll() {
  const reduced = useReducedMotion()
  const { user } = useAuth()

  const [counts, setCounts]   = useState({})
  const [pick, setPick]       = useState(null)
  const [loaded, setLoaded]   = useState(false)
  const [voting, setVoting]   = useState(null)   // id currently being submitted
  const [authOpen, setAuthOpen] = useState(false)

  // Initial load + refetch when auth state changes (to pull this user's pick)
  useEffect(() => {
    let alive = true
    fetchGoatState().then(({ counts, pick }) => {
      if (!alive) return
      setCounts(counts)
      setPick(pick)
      setLoaded(true)
    })
    return () => { alive = false }
  }, [user])

  // Live updates: when anyone votes, refresh the running totals for everyone
  useEffect(() => {
    if (!supabaseEnabled) return
    const channel = supabase
      .channel('goat_counts_all')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'goat_vote_counts' },
        (payload) => {
          const row = payload.new
          if (!row || !row.player_id) return
          setCounts((prev) => ({ ...prev, [row.player_id]: row.count }))
        })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  const { sum, leaderId } = useMemo(() => {
    const sum = sumGoatCounts(counts)
    let leaderId = null, max = 0
    for (const p of GOAT_PLAYERS) {
      if ((counts[p.id] || 0) > max) { max = counts[p.id]; leaderId = p.id }
    }
    return { sum, leaderId }
  }, [counts])

  const handleVote = useCallback(async (id, accent) => {
    if (supabaseEnabled && !user) { setAuthOpen(true); return }
    if (pick === id || voting) return

    setVoting(id)
    const res = await castGoatVote(id)
    setVoting(null)
    if (res?.error) return

    setCounts(res.counts)
    setPick(res.pick)

    if (!reduced) {
      confetti({
        particleCount: 60, spread: 60, origin: { y: 0.7 }, scalar: 0.9, gravity: 1.2,
        colors: [accent, '#ffffff', hexToRgba(accent, 0.6)],
      })
    }
  }, [pick, voting, user, reduced])

  return (
    <section className="card relative overflow-hidden p-5 sm:p-6">
      <div className="pointer-events-none absolute -top-20 -right-16 h-56 w-56 rounded-full bg-gold/10 blur-3xl" />

      {/* Header */}
      <div className="relative mb-5 flex items-center justify-between gap-3">
        <div>
          <div className="section-divider mb-1.5">The Big Debate</div>
          <h2 className="flex items-center gap-2 text-xl font-black tracking-tight sm:text-2xl">
            <Crown size={22} className="text-gold-400" />
            Who is the <span className="text-gold-shine">GOAT?</span>
          </h2>
          <p className="mt-1 text-sm text-muted">Real fan votes · tap a name to see their full story</p>
        </div>
        <span className="shrink-0 rounded-full border border-line/60 bg-elevated px-3 py-1 text-xs font-bold text-muted dark:bg-white/5 dark:border-white/10">
          {loaded ? `${sum.toLocaleString()} votes` : '…'}
        </span>
      </div>

      {/* Empty state — no real votes yet */}
      {loaded && sum === 0 && (
        <p className="relative mb-4 rounded-xl border border-dashed border-line/60 bg-elevated/40 px-4 py-2.5 text-center text-xs font-semibold text-muted">
          🐐 No votes yet — be the very first to crown the GOAT!
        </p>
      )}

      {/* Player grid */}
      <div className="relative grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {GOAT_PLAYERS.map((gp, i) => {
          const p = getPlayer(gp.id)
          if (!p) return null
          const team = getTeam(p.team)
          const votesFor = counts[gp.id] || 0
          const pct = sum ? Math.round((votesFor / sum) * 100) : 0
          const isPick = pick === gp.id
          const isLeader = sum > 0 && leaderId === gp.id
          const isVoting = voting === gp.id

          return (
            <motion.div
              key={gp.id}
              initial={reduced ? { opacity: 0 } : { opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06, duration: 0.45, ease: [0.23, 1, 0.32, 1] }}
              className={`group relative flex flex-col overflow-hidden rounded-2xl border p-4 transition-colors ${
                isPick ? 'border-transparent' : 'border-line/60 hover:border-brand/30 dark:border-white/10'
              }`}
              style={isPick ? { boxShadow: `0 0 0 2px ${gp.accent}, 0 8px 28px ${hexToRgba(gp.accent, 0.25)}` } : undefined}
            >
              <div
                className="pointer-events-none absolute inset-0 opacity-60"
                style={{ background: `radial-gradient(120% 80% at 100% 0%, ${hexToRgba(gp.accent, 0.12)}, transparent 60%)` }}
              />

              {isLeader && (
                <motion.div
                  className="absolute right-3 top-3 z-10 flex items-center gap-1 rounded-full bg-gold-gradient px-2 py-0.5 text-[10px] font-black text-[#3a2406] shadow-glow-gold"
                  initial={reduced ? false : { scale: 0, rotate: -20 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 18 }}
                >
                  <Crown size={11} /> LEADING
                </motion.div>
              )}

              {/* Photo + identity → links to profile */}
              <Link to={`/players/${gp.id}`} className="relative z-[1] flex items-center gap-3">
                <div className="relative">
                  <Avatar src={p.photo} alt={p.name} size={64} className="transition-transform duration-200 group-hover:scale-105" />
                  <div className="absolute -bottom-1.5 -right-1.5">
                    <TeamBadge code={p.team} size={26} cdnSize="w40" />
                  </div>
                </div>
                <div className="min-w-0">
                  <div className="truncate font-black leading-tight group-hover:text-brand transition-colors">{p.name}</div>
                  <div className="truncate text-xs font-semibold text-muted">{team.name}</div>
                  <div className="mt-0.5 text-[11px] text-muted">⚽ {p.stats?.goals ?? 0} · 🏆 {(p.honours?.length ?? 0)} titles</div>
                </div>
              </Link>

              {/* Percentage + bar */}
              <div className="relative z-[1] mt-3.5">
                <div className="mb-1 flex items-baseline justify-between">
                  <span className="text-2xl font-black tabular-nums" style={{ color: gp.accent }}>{pct}%</span>
                  <span className="text-[11px] font-semibold text-muted tabular-nums">
                    {loaded ? `${votesFor.toLocaleString()} votes` : '—'}
                  </span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-line/60 dark:bg-white/8">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: `linear-gradient(90deg, ${hexToRgba(gp.accent, 0.7)}, ${gp.accent})` }}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                  />
                </div>
              </div>

              {/* Vote button */}
              <button
                onClick={() => handleVote(gp.id, gp.accent)}
                disabled={isVoting}
                className={`relative z-[1] mt-3.5 flex items-center justify-center gap-1.5 rounded-xl py-2 text-sm font-bold transition-all active:scale-[0.97] disabled:opacity-60 ${
                  isPick ? 'text-white' : 'text-ink hover:text-white'
                }`}
                style={
                  isPick
                    ? { background: `linear-gradient(135deg, ${gp.accent}, ${hexToRgba(gp.accent, 0.75)})` }
                    : { boxShadow: `inset 0 0 0 1.5px ${hexToRgba(gp.accent, 0.5)}` }
                }
                onMouseEnter={(e) => { if (!isPick) e.currentTarget.style.background = `linear-gradient(135deg, ${gp.accent}, ${hexToRgba(gp.accent, 0.75)})` }}
                onMouseLeave={(e) => { if (!isPick) e.currentTarget.style.background = 'transparent' }}
              >
                {isVoting
                  ? <Loader2 size={15} className={!reduced ? 'animate-spin' : ''} />
                  : isPick ? (<><Check size={15} /> Your pick</>) : 'Vote'}
              </button>
            </motion.div>
          )
        })}
      </div>

      {supabaseEnabled && !user && (
        <p className="relative mt-4 text-center text-xs text-muted">
          <button onClick={() => setAuthOpen(true)} className="font-semibold text-brand hover:underline">
            Sign in
          </button>{' '}to cast your vote in the GOAT debate
        </p>
      )}

      {authOpen && <AuthModal onClose={() => setAuthOpen(false)} />}
    </section>
  )
}
