import { useEffect, useMemo, useState } from 'react'
import { groupKeys } from '../lib/teams.js'
import { useApp } from '../context/AppContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useCoins } from '../context/CoinsContext.jsx'
import MatchCard from '../components/MatchCard.jsx'
import AdSlot from '../components/AdSlot.jsx'
import SharePredictions from '../components/SharePredictions.jsx'
import AuthModal from '../components/AuthModal.jsx'
import { StaggerList, StaggerItem } from '../motion.jsx'
import { fetchMyStreak } from '../lib/votesApi.js'
import { getMatchVoteState } from '../lib/matches.js'

// ─── Status badge styles (My Bets tab) ───────────────────────────────────────
const STATUS_CLS = {
  pending: 'border-yellow-500/30 bg-yellow-500/10 text-yellow-400',
  won:     'border-green-500/30  bg-green-500/10  text-green-400',
  lost:    'border-red-500/30    bg-red-500/10    text-red-400',
}
const STATUS_LABEL = { pending: '⏳ Pending', won: '🏆 Won', lost: '❌ Lost' }

function BetRow({ bet, match }) {
  const matchLabel = match ? `${match.home} vs ${match.away}` : `Match ${bet.match_id}`
  const potentialOrPayout =
    bet.status === 'won'
      ? `+🪙 ${bet.payout ?? Math.floor(bet.amount * bet.odds)}`
      : bet.status === 'pending'
      ? `→ 🪙 ${Math.floor(bet.amount * bet.odds)}`
      : `-🪙 ${bet.amount}`

  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-line/30 dark:border-white/8 last:border-0 text-sm">
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-ink truncate">{matchLabel}</p>
        <p className="mt-0.5 text-xs text-muted">
          🪙 <span className="font-bold">{bet.amount}</span> on{' '}
          <span className="font-bold text-ink">{bet.team_code}</span>
          {' '}@ <span>{bet.odds}×</span>
        </p>
      </div>
      <div className="text-right shrink-0">
        <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${STATUS_CLS[bet.status] ?? STATUS_CLS.pending}`}>
          {STATUS_LABEL[bet.status] ?? '⏳'}
          <span className="ml-1 opacity-80">{potentialOrPayout}</span>
        </span>
      </div>
    </div>
  )
}

// ─── My Bets tab content ──────────────────────────────────────────────────────
function MyBetsTab() {
  const { bets, balance, loading } = useCoins()
  const { matches } = useApp()
  const matchById = useMemo(
    () => Object.fromEntries(matches.map((m) => [m.id, m])),
    [matches]
  )

  const pendingBets = bets.filter((b) => b.status === 'pending')
  const settledBets = bets.filter((b) => b.status !== 'pending')
  const totalWon    = settledBets
    .filter((b) => b.status === 'won')
    .reduce((s, b) => s + (b.payout ?? 0), 0)

  if (loading) {
    return (
      <div className="py-12 text-center text-sm text-muted">Loading bets…</div>
    )
  }

  if (bets.length === 0) {
    return (
      <div className="card p-10 text-center space-y-2">
        <p className="text-4xl">🪙</p>
        <p className="font-semibold text-ink">No bets placed yet</p>
        <p className="text-sm text-muted">Vote on a match to unlock betting.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Summary strip */}
      <div className="card p-4 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted">Balance</p>
          <p className="text-2xl font-extrabold text-ink">🪙 {(balance ?? 0).toLocaleString()}</p>
        </div>
        {totalWon > 0 && (
          <div className="text-right">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted">Total won</p>
            <p className="text-xl font-extrabold text-green-400">+🪙 {totalWon.toLocaleString()}</p>
          </div>
        )}
      </div>

      {pendingBets.length > 0 && (
        <div className="card overflow-hidden">
          <p className="px-4 pt-3 pb-1.5 text-[10px] font-bold uppercase tracking-widest text-muted">
            Active ({pendingBets.length})
          </p>
          {pendingBets.map((b) => (
            <BetRow key={b.id} bet={b} match={matchById[b.match_id]} />
          ))}
        </div>
      )}

      {settledBets.length > 0 && (
        <div className="card overflow-hidden">
          <p className="px-4 pt-3 pb-1.5 text-[10px] font-bold uppercase tracking-widest text-muted">
            Settled ({settledBets.length})
          </p>
          {settledBets.map((b) => (
            <BetRow key={b.id} bet={b} match={matchById[b.match_id]} />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Predictions page ─────────────────────────────────────────────────────────

export default function Predictions() {
  const { votes, matches, username } = useApp()
  const { user } = useAuth()

  const [group, setGroup]       = useState('all')
  const [onlyOpen, setOnlyOpen] = useState(false)
  const [openNow, setOpenNow]   = useState(false)
  const [streak, setStreak]     = useState(0)
  const [view, setView]         = useState('matches') // 'matches' | 'bets'
  const [authOpen, setAuthOpen] = useState(false)

  useEffect(() => {
    if (!username) return
    fetchMyStreak(username).then(setStreak)
  }, [username])

  // Reset to 'matches' view on logout
  useEffect(() => {
    if (!user) setView('matches')
  }, [user])

  const list = useMemo(() => {
    return matches.filter((m) => {
      if (group !== 'all' && m.group !== group) return false
      if (onlyOpen && votes[m.id]) return false
      if (openNow && getMatchVoteState(m) !== 'open') return false
      return true
    })
  }, [group, onlyOpen, openNow, votes, matches])

  const predicted = Object.keys(votes).length

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Predictions</h1>
        <div className="mt-1.5 flex flex-wrap items-center gap-2.5">
          <p className="text-sm text-muted">
            You've predicted <b className="text-brand">{predicted}</b> of {matches.length} matches
          </p>
          {streak >= 2 && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-orange-400/40 bg-orange-500/10 px-2.5 py-0.5 text-xs font-black text-orange-500 dark:text-orange-400">
              🔥 {streak} in a row!
            </span>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="card p-4">
        <div className="mb-2 flex justify-between text-xs font-semibold text-muted">
          <span>Your progress</span>
          <span>{Math.round((predicted / matches.length) * 100)}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-line">
          <div
            className="vote-fill h-full rounded-full bg-brand"
            style={{ width: `${(predicted / matches.length) * 100}%` }}
          />
        </div>
        {streak >= 1 && (
          <div className={`mt-3 flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold ${
            streak >= 5
              ? 'bg-orange-500/12 text-orange-500 dark:text-orange-400'
              : streak >= 3
              ? 'bg-orange-400/10 text-orange-500 dark:text-orange-400'
              : 'bg-orange-400/8 text-orange-400'
          }`}>
            <span className="text-base leading-none">🔥</span>
            <span>
              {streak >= 5
                ? `${streak}-match streak — you're on fire!`
                : streak >= 3
                ? `${streak}-match streak — keep it going!`
                : `${streak} correct in a row`}
            </span>
          </div>
        )}
      </div>

      <SharePredictions compact />

      {/* Filter chips — My Bets tab added for logged-in users */}
      <div className="flex flex-wrap items-center gap-2">
        {/* My Bets tab — only for logged-in users */}
        {user && (
          <button
            onClick={() => setView(view === 'bets' ? 'matches' : 'bets')}
            className={`chip ${view === 'bets' ? 'chip-active' : ''}`}
          >
            🪙 My Bets
          </button>
        )}

        {/* Standard filters — only relevant in matches view */}
        {view === 'matches' && (
          <>
            <button onClick={() => setGroup('all')} className={`chip ${group === 'all' ? 'chip-active' : ''}`}>
              All
            </button>
            {groupKeys.map((g) => (
              <button key={g} onClick={() => setGroup(g)} className={`chip ${group === g ? 'chip-active' : ''}`}>
                {g}
              </button>
            ))}
            <button onClick={() => setOpenNow((v) => !v)} className={`chip ml-auto ${openNow ? 'chip-active' : ''}`}>
              Open now
            </button>
            <button onClick={() => setOnlyOpen((v) => !v)} className={`chip ${onlyOpen ? 'chip-active' : ''}`}>
              Not predicted yet
            </button>
          </>
        )}

        {/* Sign-in nudge for coins when logged out */}
        {!user && (
          <button
            onClick={() => setAuthOpen(true)}
            className="chip ml-auto"
          >
            🪙 Sign in to bet
          </button>
        )}
      </div>

      {/* ── My Bets tab content ─────────────────────────────────────────────── */}
      {view === 'bets' && user && <MyBetsTab />}

      {/* ── Matches view ────────────────────────────────────────────────────── */}
      {view === 'matches' && (
        <>
          <AdSlot label="Ad · below vote results" />

          <StaggerList className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {list.map((m) => (
              <StaggerItem key={m.id}>
                <MatchCard match={m} />
              </StaggerItem>
            ))}
          </StaggerList>

          {list.length === 0 && (
            <p className="py-12 text-center text-muted">
              {onlyOpen ? 'You predicted everything here. 🎉' : 'No matches found.'}
            </p>
          )}
        </>
      )}

      {authOpen && <AuthModal onClose={() => setAuthOpen(false)} />}
    </div>
  )
}
