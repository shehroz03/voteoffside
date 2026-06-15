import { useEffect, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence, useAnimation, useReducedMotion } from 'framer-motion'
import { Lock, Loader2 } from 'lucide-react'
import confetti from 'canvas-confetti'
import { getTeam } from '../lib/teams.js'
import { getMatchVoteState } from '../lib/matches.js'
import TeamBadge from './TeamBadge.jsx'
import { communityVotes } from '../lib/community.js'
import { supabaseEnabled } from '../lib/supabase.js'
import { useApp } from '../context/AppContext.jsx'
import { useVotes } from '../context/VotesContext.jsx'
import { useReactions } from '../context/ReactionsContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useCoins } from '../context/CoinsContext.jsx'
import ShareWin from './ShareWin.jsx'
import VoteBar from './VoteBar.jsx'
import AuthModal from './AuthModal.jsx'

function fmtDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}
function fmtTime(iso) {
  return new Date(iso).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
}
function fmtVotingOpens(iso) {
  return new Date(iso).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })
}

// ─── ScoreDigit (unchanged) ───────────────────────────────────────────────────

function ScoreDigit({ value, isLive, className }) {
  const reduced = useReducedMotion()
  const controls = useAnimation()
  const prev = useRef(value)

  useEffect(() => {
    if (!isLive || reduced || value === prev.current) return
    prev.current = value
    controls.start({
      scale: [1, 1.55, 1],
      filter: [
        'drop-shadow(0 0 0px transparent)',
        'drop-shadow(0 0 7px rgba(34,197,94,0.9))',
        'drop-shadow(0 0 0px transparent)',
      ],
      transition: { duration: 0.48, ease: [0.22, 1, 0.36, 1] },
    })
  }, [value, isLive, reduced]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <motion.span animate={controls} className={className}>
      {value}
    </motion.span>
  )
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TAP_SPRING  = { type: 'spring', stiffness: 420, damping: 28 }
const CARD_SPRING = { type: 'spring', stiffness: 340, damping: 30 }

const DOT_PULSE = {
  animate: { scale: [1, 1.65, 1], opacity: [1, 0.35, 1] },
  transition: { duration: 1.15, repeat: Infinity, ease: 'easeInOut' },
}
const BADGE_GLOW = {
  animate: {
    boxShadow: [
      '0 0 0px rgba(239,68,68,0)',
      '0 0 9px rgba(239,68,68,0.55)',
      '0 0 0px rgba(239,68,68,0)',
    ],
  },
  transition: { duration: 2.2, repeat: Infinity, ease: 'easeInOut' },
}

const REACTION_EMOJIS = ['🔥', '⚽', '😱', '👏', '💪']
const WIN_EMOJIS  = ['🔥', '🏆', '⚡', '💪']
const LOSE_EMOJIS = ['💔', '😭', '😰', '❌']
const TIE_EMOJIS  = ['🔥', '⚽', '⚡', '🤝']
const TIE_GAP = 5

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)] }

// ─── FloatEmoji ───────────────────────────────────────────────────────────────

function FloatEmoji({ id, emoji, x, onDone }) {
  return (
    <motion.span
      key={id}
      aria-hidden
      className="pointer-events-none absolute select-none text-lg leading-none"
      style={{ bottom: '30%', left: `${x}%`, zIndex: 20 }}
      initial={{ y: 0, opacity: 1, scale: 0.9 }}
      animate={{ y: -52, opacity: 0, scale: 1.1 }}
      exit={{}}
      transition={{ duration: 1.35, ease: [0.2, 0, 0.8, 1] }}
      onAnimationComplete={onDone}
    >
      {emoji}
    </motion.span>
  )
}

// ─── Odds formula ─────────────────────────────────────────────────────────────
// 70% favourite → ~1.54×   30% underdog → ~2.26×   50/50 → 1.9×

function computeOdds(pct) {
  if (!pct || pct <= 0) return 1.9
  const raw = 1 + (1 - pct) * 1.8
  return Math.round(Math.max(1.1, Math.min(4.5, raw)) * 100) / 100
}

// ─── Status badge styles ──────────────────────────────────────────────────────

const BET_STATUS_CLS = {
  pending: 'border-yellow-500/40 bg-yellow-500/10 text-yellow-400',
  won:     'border-green-500/40  bg-green-500/10  text-green-400',
  lost:    'border-red-500/40    bg-red-500/10    text-red-400',
}
const BET_STATUS_LABEL = { pending: '⏳ Pending', won: '🏆 Won', lost: '❌ Lost' }

const BET_AMOUNTS = [50, 100, 250, 500]

// ─── Inline BetPanel ─────────────────────────────────────────────────────────

function BetPanel({ match, userPick, homePct, awayPct, reduced }) {
  const { user }                       = useAuth()
  const { balance, getBet, placeBet }  = useCoins()

  const [amount, setAmount]   = useState(100)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [placed, setPlaced]   = useState(false)
  const [authOpen, setAuthOpen] = useState(false)

  const existingBet = getBet(match.id)

  // Default bet team = the team the user voted for
  const [betTeam, setBetTeam] = useState(userPick ?? match.home)

  // Keep betTeam in sync if userPick changes while panel is open
  useEffect(() => {
    if (userPick && !existingBet) setBetTeam(userPick)
  }, [userPick, existingBet])

  const homeOdds = computeOdds(homePct)
  const awayOdds = computeOdds(awayPct)
  const selectedOdds = betTeam === match.home ? homeOdds : awayOdds
  const payout = Math.floor(amount * selectedOdds)

  const handlePlace = useCallback(async () => {
    if (loading) return
    setError('')
    setLoading(true)
    const result = await placeBet({ matchId: match.id, teamCode: betTeam, amount, odds: selectedOdds })
    setLoading(false)
    if (result?.error) { setError(result.error); return }
    setPlaced(true)
  }, [loading, placeBet, match.id, betTeam, amount, selectedOdds])

  // ── Not logged in → subtle sign-in nudge ───────────────────────────────────
  if (!user) {
    return (
      <div className="mt-3 border-t border-line/30 pt-2.5 text-center">
        <p className="text-xs text-muted">
          🪙{' '}
          <button
            onClick={() => setAuthOpen(true)}
            className="font-semibold text-brand hover:underline focus:outline-none"
          >
            Sign in to bet coins
          </button>
        </p>
        {authOpen && <AuthModal onClose={() => setAuthOpen(false)} />}
      </div>
    )
  }

  // ── Already bet on this match ──────────────────────────────────────────────
  if (existingBet) {
    const statusCls = BET_STATUS_CLS[existingBet.status] ?? BET_STATUS_CLS.pending
    const label     = BET_STATUS_LABEL[existingBet.status] ?? '⏳'
    const potentialOrPayout =
      existingBet.status === 'won'
        ? `+🪙 ${existingBet.payout ?? Math.floor(existingBet.amount * existingBet.odds)}`
        : existingBet.status === 'pending'
        ? `→ 🪙 ${Math.floor(existingBet.amount * existingBet.odds)}`
        : `-🪙 ${existingBet.amount}`

    return (
      <div className="mt-3 border-t border-line/30 pt-2.5">
        <div className="flex items-center justify-between gap-2 text-xs">
          <span className="font-semibold text-muted">
            🪙 {existingBet.amount} on{' '}
            <span className="text-ink">{existingBet.team_code}</span>
            {' '}@ {existingBet.odds}×
          </span>
          <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-bold ${statusCls}`}>
            {label}
            <span className="ml-1">{potentialOrPayout}</span>
          </span>
        </div>
      </div>
    )
  }

  // ── Success flash ──────────────────────────────────────────────────────────
  if (placed) {
    return (
      <div className="mt-3 border-t border-line/30 pt-2.5 text-center text-xs text-green-400 font-semibold">
        🎉 Bet placed! Good luck.
      </div>
    )
  }

  // ── Bet form ───────────────────────────────────────────────────────────────
  const noFunds = balance !== null && balance < amount

  return (
    <div className="mt-3 border-t border-line/30 pt-2.5 space-y-2">
      {/* Team selector + amount buttons row */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Team toggle */}
        <div className="flex gap-1">
          {[match.home, match.away].map((code) => (
            <button
              key={code}
              type="button"
              onClick={() => setBetTeam(code)}
              className={`rounded-lg border px-2 py-0.5 text-[11px] font-bold transition-colors ${
                betTeam === code
                  ? 'border-brand/60 bg-brand/15 text-brand'
                  : 'border-line/50 bg-elevated/40 text-muted hover:border-brand/30 hover:text-ink'
              }`}
            >
              {code}
            </button>
          ))}
        </div>

        {/* Amount buttons */}
        <div className="flex gap-1 ml-auto">
          {BET_AMOUNTS.map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setAmount(v)}
              className={`rounded-md px-2 py-0.5 text-[11px] font-bold transition-colors ${
                amount === v
                  ? 'bg-brand text-white'
                  : 'bg-line/30 text-muted hover:bg-line/50 dark:bg-white/8 dark:hover:bg-white/15'
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* Odds + payout preview + place button */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] text-muted leading-tight">
          Win =&nbsp;<span className="font-bold text-ink">{selectedOdds}×</span>
          &nbsp;·&nbsp;
          <span className="font-semibold text-green-400">🪙 {payout.toLocaleString()}</span>
        </span>
        <button
          type="button"
          onClick={handlePlace}
          disabled={loading || noFunds}
          className="flex shrink-0 items-center gap-1.5 rounded-lg bg-brand-gradient px-3 py-1 text-[11px] font-bold text-white shadow-brand hover:opacity-90 disabled:opacity-40 transition-opacity"
        >
          {loading
            ? <Loader2 size={11} className={!reduced ? 'animate-spin' : ''} />
            : '🪙'}
          {noFunds ? 'No coins' : 'Place Bet'}
        </button>
      </div>

      {error && (
        <p className="text-[11px] text-red-400 leading-tight">{error}</p>
      )}
    </div>
  )
}

// ─── MatchCard ────────────────────────────────────────────────────────────────

export default function MatchCard({ match, votable = true }) {
  const reduced = useReducedMotion()
  const { votes } = useApp()
  const { countsMap, ensureLoaded, vote } = useVotes()
  const { map: reactionsMap, sendReaction, dismissReaction } = useReactions()
  const { user } = useAuth()
  const [voteAuthOpen, setVoteAuthOpen] = useState(false)
  const cardReactions = reactionsMap[match.id] ?? []
  const userPick = votes[match.id]
  const home = getTeam(match.home)
  const away = getTeam(match.away)

  const live     = match.status === 'live'
  const finished = match.status === 'finished'
  const upcoming = match.status === 'upcoming'

  const voteState       = getMatchVoteState(match)
  const showVoteBar     = live || finished || voteState === 'open'
  const effectiveVotable = votable && !live && !finished && voteState === 'open'

  // Re-evaluate vote window once a minute
  const [, setTick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setTick((n) => n + 1), 60_000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (votable && !finished) ensureLoaded(match.id)
  }, [match.id, votable, finished, ensureLoaded])

  let homePct, awayPct, total
  if (supabaseEnabled) {
    const c = countsMap[match.id] || {}
    const h = c[match.home] || 0
    const a = c[match.away] || 0
    total   = h + a
    homePct = total ? Math.round((h / total) * 100) : 50
    awayPct = total ? 100 - homePct : 50
  } else {
    const cv = communityVotes(match, userPick)
    homePct  = cv.home
    awayPct  = cv.away
    total    = cv.total
  }

  const gap       = homePct - awayPct
  const isTie     = Math.abs(gap) <= TIE_GAP
  const homeLeads = !isTie && gap > 0

  const [flashState, setFlashState] = useState(null)
  const [homeEmojis, setHomeEmojis] = useState([])
  const [awayEmojis, setAwayEmojis] = useState([])

  const momentumRef = useRef({ isTie, homeLeads })
  useEffect(() => { momentumRef.current = { isTie, homeLeads } }, [isTie, homeLeads])

  useEffect(() => {
    if (!effectiveVotable || reduced) return
    const spawn = () => {
      const { isTie: t, homeLeads: hL } = momentumRef.current
      const baseId = Date.now()
      const hx = 12 + Math.random() * 58
      const ax = 12 + Math.random() * 58
      if (t) {
        const e = pick(TIE_EMOJIS)
        setHomeEmojis((s) => [...s.slice(-2), { id: baseId + 'h', emoji: e, x: hx }])
        setAwayEmojis((s) => [...s.slice(-2), { id: baseId + 'a', emoji: e, x: ax }])
      } else if (hL) {
        setHomeEmojis((s) => [...s.slice(-2), { id: baseId + 'h', emoji: pick(WIN_EMOJIS),  x: hx }])
        setAwayEmojis((s) => [...s.slice(-2), { id: baseId + 'a', emoji: pick(LOSE_EMOJIS), x: ax }])
      } else {
        setAwayEmojis((s) => [...s.slice(-2), { id: baseId + 'a', emoji: pick(WIN_EMOJIS),  x: ax }])
        setHomeEmojis((s) => [...s.slice(-2), { id: baseId + 'h', emoji: pick(LOSE_EMOJIS), x: hx }])
      }
    }
    const initDelay = 1500 + Math.random() * 2000
    const initTimer = setTimeout(spawn, initDelay)
    const loopTimer = setInterval(spawn, 3500)
    return () => { clearTimeout(initTimer); clearInterval(loopTimer) }
  }, [effectiveVotable, reduced]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleVote = useCallback(
    (side, teamCode) => {
      if (!effectiveVotable) return
      // Require sign-in before any vote is registered
      if (supabaseEnabled && !user) { setVoteAuthOpen(true); return }
      vote(match.id, teamCode)
      setFlashState((prev) => ({ side, key: (prev?.key ?? 0) + 1 }))
      confetti({
        particleCount: 55, spread: 52, origin: { y: 0.65 },
        gravity: 1.3, scalar: 0.85,
        colors: side === 'home'
          ? ['#1a56db', '#3b82f6', '#93c5fd', '#ffffff']
          : ['#f59e0b', '#fbbf24', '#fde68a', '#ffffff'],
      })
    },
    [effectiveVotable, vote, match.id, user]
  )

  // Whether to show the inline bet panel
  // Condition: votable upcoming match + vote window open + user has voted (or Supabase shown for sign-in nudge)
  const showBetPanel = supabaseEnabled && votable && upcoming && voteState === 'open' && !!userPick

  return (
    <motion.div
      className="card p-5 sm:p-6 group"
      whileHover={!reduced ? { y: -3, boxShadow: '0 8px 30px rgba(16,24,40,0.14)' } : undefined}
      whileTap={!reduced ? { scale: 0.984, y: -1 } : undefined}
      transition={CARD_SPRING}
    >
      {/* Meta row */}
      <div className="mb-4 flex items-center justify-between">
        <span className="section-label">{match.stage}</span>
        {live ? (
          <motion.span
            className="badge-live"
            animate={!reduced ? BADGE_GLOW.animate : undefined}
            transition={BADGE_GLOW.transition}
          >
            <motion.span
              className="h-1.5 w-1.5 rounded-full bg-white/80"
              animate={!reduced ? DOT_PULSE.animate : { opacity: [1, 0.5, 1] }}
              transition={!reduced ? DOT_PULSE.transition : { duration: 1.2, repeat: Infinity }}
            />
            LIVE {match.minute ? `${match.minute}'` : ''}
          </motion.span>
        ) : finished ? (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-line/60 px-2.5 py-0.5 text-xs font-semibold text-muted">
            Full time
          </span>
        ) : (
          <span className="text-xs font-medium text-muted">
            {fmtDate(match.date)} · {fmtTime(match.date)}
          </span>
        )}
      </div>

      {/* Teams row */}
      <div className="flex items-center justify-between gap-2">

        {/* Home team */}
        <motion.button
          onClick={() => handleVote('home', match.home)}
          whileTap={effectiveVotable ? { scale: 0.96 } : undefined}
          transition={TAP_SPRING}
          className={`relative flex flex-1 items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition-colors duration-150 ${
            effectiveVotable ? 'hover:bg-brand/6 cursor-pointer dark:hover:bg-brand/10' : 'cursor-default'
          } ${
            userPick === match.home
              ? 'ring-2 ring-brand/70 bg-brand/5 dark:bg-brand/10 shadow-[0_0_12px_rgba(26,86,219,0.15)]'
              : ''
          }`}
        >
          <AnimatePresence>
            {homeEmojis.map(({ id, emoji, x }) => (
              <FloatEmoji key={id} id={id} emoji={emoji} x={x}
                onDone={() => setHomeEmojis((s) => s.filter((e) => e.id !== id))} />
            ))}
          </AnimatePresence>
          {flashState?.side === 'home' && (
            <motion.span
              key={flashState.key}
              className="pointer-events-none absolute inset-0 rounded-2xl"
              style={{ background: 'rgba(26,86,219,0.28)' }}
              initial={{ opacity: 1 }}
              animate={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.45, ease: 'easeOut' }}
              onAnimationComplete={() => setFlashState(null)}
            />
          )}
          <TeamBadge code={match.home} size={32} />
          <span className="font-bold leading-tight text-sm sm:text-base">{home.name}</span>
        </motion.button>

        {/* Score / VS */}
        <div className="shrink-0 min-w-[3.5rem] text-center">
          {live || finished ? (
            <div className="flex items-center justify-center gap-1">
              <ScoreDigit value={match.score?.home ?? 0} isLive={live}
                className={`score-num ${live ? 'text-red-500 dark:text-red-400' : 'text-ink'}`} />
              <span className="text-muted font-semibold text-lg select-none">–</span>
              <ScoreDigit value={match.score?.away ?? 0} isLive={live}
                className={`score-num ${live ? 'text-red-500 dark:text-red-400' : 'text-ink'}`} />
            </div>
          ) : (
            <div className="rounded-xl border border-line/60 bg-elevated px-3 py-1.5 dark:bg-white/5">
              <span className="text-xs font-black tracking-widest text-muted">VS</span>
            </div>
          )}
        </div>

        {/* Away team */}
        <motion.button
          onClick={() => handleVote('away', match.away)}
          whileTap={effectiveVotable ? { scale: 0.96 } : undefined}
          transition={TAP_SPRING}
          className={`relative flex flex-1 items-center justify-end gap-3 rounded-2xl px-3 py-2.5 text-right transition-colors duration-150 ${
            effectiveVotable ? 'hover:bg-gold/6 cursor-pointer dark:hover:bg-gold/8' : 'cursor-default'
          } ${
            userPick === match.away
              ? 'ring-2 ring-gold/70 bg-gold/5 dark:bg-gold/10 shadow-[0_0_12px_rgba(245,158,11,0.15)]'
              : ''
          }`}
        >
          <AnimatePresence>
            {awayEmojis.map(({ id, emoji, x }) => (
              <FloatEmoji key={id} id={id} emoji={emoji} x={x}
                onDone={() => setAwayEmojis((s) => s.filter((e) => e.id !== id))} />
            ))}
          </AnimatePresence>
          {flashState?.side === 'away' && (
            <motion.span
              key={flashState.key}
              className="pointer-events-none absolute inset-0 rounded-2xl"
              style={{ background: 'rgba(245,158,11,0.28)' }}
              initial={{ opacity: 1 }}
              animate={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.45, ease: 'easeOut' }}
              onAnimationComplete={() => setFlashState(null)}
            />
          )}
          <span className="font-bold leading-tight text-sm sm:text-base">{away.name}</span>
          <TeamBadge code={match.away} size={32} />
        </motion.button>
      </div>

      {/* Vote bar section */}
      {votable && (
        <div className="mt-5 space-y-2">
          {showVoteBar ? (
            <>
              <VoteBar
                homePct={homePct}
                awayPct={awayPct}
                userPick={userPick}
                homeCode={match.home}
                awayCode={match.away}
              />
              <p className="text-center text-xs text-muted">
                {userPick ? (
                  <>You picked <b className="text-ink font-bold">{getTeam(userPick).name}</b> · </>
                ) : supabaseEnabled && !user ? (
                  <>
                    <button
                      onClick={() => setVoteAuthOpen(true)}
                      className="font-semibold text-brand hover:underline focus:outline-none"
                    >
                      Sign in to vote
                    </button>
                    {' · '}
                  </>
                ) : (
                  <>Tap a team to predict · </>
                )}
                <span className="font-semibold">{total.toLocaleString()}</span> votes
              </p>
            </>
          ) : voteState === 'locked' ? (
            <div className="flex items-center justify-center gap-1.5 rounded-xl border border-line/50 bg-elevated/60 py-2.5 text-xs font-semibold text-muted">
              <Lock size={12} strokeWidth={2.5} />
              <span>Voting opens {fmtVotingOpens(match.date)}</span>
            </div>
          ) : (
            <div className="flex items-center justify-center py-2.5 text-xs font-semibold text-muted">
              Voting closed
            </div>
          )}
        </div>
      )}

      {/* ── Share your win (only when user picked the winning team) ─────────── */}
      <ShareWin match={match} userPick={userPick} />

      {/* ── Inline bet panel (appears after the user votes on an upcoming match) */}
      {showBetPanel && (
        <BetPanel
          match={match}
          userPick={userPick}
          homePct={homePct / 100}
          awayPct={awayPct / 100}
          reduced={!!reduced}
        />
      )}

      {/* Venue */}
      <div className="mt-4 text-center text-[11px] font-medium text-muted/70 tracking-wide">
        {match.venue}
      </div>

      {/* Reaction bar */}
      <div className="relative mt-3 border-t border-line/40 pt-2.5">
        {!reduced && (
          <div
            className="pointer-events-none absolute inset-x-0"
            style={{ bottom: '100%', height: 180, overflow: 'visible', zIndex: 30 }}
            aria-hidden
          >
            <AnimatePresence>
              {cardReactions.map(({ id, emoji, x }) => (
                <motion.span
                  key={id}
                  className="absolute select-none text-xl leading-none"
                  style={{ bottom: 0, left: `${x}%` }}
                  initial={{ y: 0, opacity: 1, scale: 1 }}
                  animate={{ y: -160, opacity: 0, scale: 1.35 }}
                  exit={{}}
                  transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1] }}
                  onAnimationComplete={() => dismissReaction(match.id, id)}
                >
                  {emoji}
                </motion.span>
              ))}
            </AnimatePresence>
          </div>
        )}
        <div className="flex items-center justify-center gap-0.5">
          {REACTION_EMOJIS.map((emoji) => (
            <motion.button
              key={emoji}
              type="button"
              onClick={() => sendReaction(match.id, emoji)}
              whileTap={!reduced ? { scale: 0.72 } : undefined}
              transition={TAP_SPRING}
              aria-label={`React with ${emoji}`}
              className="flex h-9 w-9 items-center justify-center rounded-xl text-lg transition-colors hover:bg-line/50 active:bg-brand/10 dark:hover:bg-white/8"
            >
              {emoji}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Sign-in required to vote */}
      {voteAuthOpen && <AuthModal onClose={() => setVoteAuthOpen(false)} />}
    </motion.div>
  )
}
