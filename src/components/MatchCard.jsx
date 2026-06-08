import { useEffect, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence, useAnimation, useReducedMotion } from 'framer-motion'
import { Lock } from 'lucide-react'
import confetti from 'canvas-confetti'
import { getTeam } from '../lib/teams.js'
import { getMatchVoteState } from '../lib/matches.js'
import TeamBadge from './TeamBadge.jsx'
import { communityVotes } from '../lib/community.js'
import { supabaseEnabled } from '../lib/supabase.js'
import { useApp } from '../context/AppContext.jsx'
import { useVotes } from '../context/VotesContext.jsx'
import { useReactions } from '../context/ReactionsContext.jsx'
import VoteBar from './VoteBar.jsx'

function fmtDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}
function fmtTime(iso) {
  return new Date(iso).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
}
function fmtVotingOpens(iso) {
  return new Date(iso).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })
}

// Animates a score digit: scale-pops + green glow when the value changes during a live match.
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

const TAP_SPRING  = { type: 'spring', stiffness: 420, damping: 28 }
const CARD_SPRING = { type: 'spring', stiffness: 340, damping: 30 }

// Continuous pulse variants for the live dot and badge glow
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

// ─── Live reaction bar ────────────────────────────────────────────────────────

const REACTION_EMOJIS = ['🔥', '⚽', '😱', '👏', '💪']

// ─── Floating emoji sets ──────────────────────────────────────────────────────

const WIN_EMOJIS  = ['🔥', '🏆', '⚡', '💪']
const LOSE_EMOJIS = ['💔', '😭', '😰', '❌']
const TIE_EMOJIS  = ['🔥', '⚽', '⚡', '🤝']

const TIE_GAP = 5

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

// ─── Single floating emoji ────────────────────────────────────────────────────

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

// ─── MatchCard ────────────────────────────────────────────────────────────────

export default function MatchCard({ match, votable = true }) {
  const reduced = useReducedMotion()
  const { votes } = useApp()
  const { countsMap, ensureLoaded, vote } = useVotes()
  const { map: reactionsMap, sendReaction, dismissReaction } = useReactions()
  const cardReactions = reactionsMap[match.id] ?? []
  const userPick = votes[match.id]
  const home = getTeam(match.home)
  const away = getTeam(match.away)

  const live = match.status === 'live'
  const finished = match.status === 'finished'

  const voteState = getMatchVoteState(match)
  const showVoteBar = live || finished || voteState === 'open'
  const effectiveVotable = votable && !live && !finished && voteState === 'open'

  // Re-evaluate vote window once a minute as real time passes
  const [, setTick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setTick((n) => n + 1), 60_000)
    return () => clearInterval(id)
  }, [])

  // Load real counts when this card is an open, votable match
  useEffect(() => {
    if (votable && !finished) ensureLoaded(match.id)
  }, [match.id, votable, finished, ensureLoaded])

  // Derive percentages: real data from Supabase, or demo fallback
  let homePct, awayPct, total
  if (supabaseEnabled) {
    const c = countsMap[match.id] || {}
    const h = c[match.home] || 0
    const a = c[match.away] || 0
    total = h + a
    homePct = total ? Math.round((h / total) * 100) : 50
    awayPct = total ? 100 - homePct : 50
  } else {
    const cv = communityVotes(match, userPick)
    homePct = cv.home
    awayPct = cv.away
    total = cv.total
  }

  // Momentum state (mirrors VoteBar logic so emojis reflect same data)
  const gap = homePct - awayPct
  const isTie = Math.abs(gap) <= TIE_GAP
  const homeLeads = !isTie && gap > 0

  // Flash state: { side: 'home'|'away', key: number } — drives the ripple overlay
  const [flashState, setFlashState] = useState(null)

  // Floating emojis state — keep max 2 visible per side
  const [homeEmojis, setHomeEmojis] = useState([])
  const [awayEmojis, setAwayEmojis] = useState([])

  // Ref so the interval callback reads current momentum without deps triggering restarts
  const momentumRef = useRef({ isTie, homeLeads })
  useEffect(() => {
    momentumRef.current = { isTie, homeLeads }
  }, [isTie, homeLeads])

  // Emoji spawner — fires every 3.5 s on votable, upcoming matches only
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

    // Stagger initial spawn so not all cards fire at the same time
    const initDelay = 1500 + Math.random() * 2000
    const initTimer = setTimeout(spawn, initDelay)
    const loopTimer = setInterval(spawn, 3500)
    return () => {
      clearTimeout(initTimer)
      clearInterval(loopTimer)
    }
  }, [effectiveVotable, reduced]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleVote = useCallback(
    (side, teamCode) => {
      if (!effectiveVotable) return
      vote(match.id, teamCode)

      // Ripple flash
      setFlashState((prev) => ({ side, key: (prev?.key ?? 0) + 1 }))

      // Confetti burst — non-blocking, fires and forgets
      confetti({
        particleCount: 55,
        spread: 52,
        origin: { y: 0.65 },
        gravity: 1.3,
        scalar: 0.85,
        colors:
          side === 'home'
            ? ['#1a56db', '#3b82f6', '#93c5fd', '#ffffff']
            : ['#f59e0b', '#fbbf24', '#fde68a', '#ffffff'],
      })
    },
    [effectiveVotable, vote, match.id]
  )

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
            effectiveVotable
              ? 'hover:bg-brand/6 cursor-pointer dark:hover:bg-brand/10'
              : 'cursor-default'
          } ${
            userPick === match.home
              ? 'ring-2 ring-brand/70 bg-brand/5 dark:bg-brand/10 shadow-[0_0_12px_rgba(26,86,219,0.15)]'
              : ''
          }`}
        >
          {/* Floating emojis — home side */}
          <AnimatePresence>
            {homeEmojis.map(({ id, emoji, x }) => (
              <FloatEmoji
                key={id}
                id={id}
                emoji={emoji}
                x={x}
                onDone={() => setHomeEmojis((s) => s.filter((e) => e.id !== id))}
              />
            ))}
          </AnimatePresence>

          {/* Ripple overlay */}
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
              <ScoreDigit
                value={match.score?.home ?? 0}
                isLive={live}
                className={`score-num ${live ? 'text-red-500 dark:text-red-400' : 'text-ink'}`}
              />
              <span className="text-muted font-semibold text-lg select-none">–</span>
              <ScoreDigit
                value={match.score?.away ?? 0}
                isLive={live}
                className={`score-num ${live ? 'text-red-500 dark:text-red-400' : 'text-ink'}`}
              />
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
            effectiveVotable
              ? 'hover:bg-gold/6 cursor-pointer dark:hover:bg-gold/8'
              : 'cursor-default'
          } ${
            userPick === match.away
              ? 'ring-2 ring-gold/70 bg-gold/5 dark:bg-gold/10 shadow-[0_0_12px_rgba(245,158,11,0.15)]'
              : ''
          }`}
        >
          {/* Floating emojis — away side */}
          <AnimatePresence>
            {awayEmojis.map(({ id, emoji, x }) => (
              <FloatEmoji
                key={id}
                id={id}
                emoji={emoji}
                x={x}
                onDone={() => setAwayEmojis((s) => s.filter((e) => e.id !== id))}
              />
            ))}
          </AnimatePresence>

          {/* Ripple overlay */}
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

      {/* Venue */}
      <div className="mt-4 text-center text-[11px] font-medium text-muted/70 tracking-wide">
        {match.venue}
      </div>

      {/* Reaction bar — visible on all match states */}
      <div className="relative mt-3 border-t border-line/40 pt-2.5">

        {/* Floater zone: sits above the reaction buttons, pointers disabled */}
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

        {/* Emoji buttons */}
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
    </motion.div>
  )
}
