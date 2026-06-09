import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { useCoins } from '../context/CoinsContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useApp } from '../context/AppContext.jsx'
import { supabaseEnabled } from '../lib/supabase.js'

const statusBadge = {
  pending: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/30',
  won:     'bg-green-500/10  text-green-400  border border-green-500/30',
  lost:    'bg-red-500/10    text-red-400    border border-red-500/30',
}
const statusIcon = { pending: '⏳', won: '🏆', lost: '❌' }

function BetRow({ bet, match }) {
  const payout     = bet.status === 'won'  ? bet.payout : null
  const potential  = bet.status === 'pending' ? Math.floor(bet.amount * bet.odds) : null

  return (
    <div className="flex items-center gap-3 py-2.5 px-3 text-sm border-b border-line/30 dark:border-white/8 last:border-0">
      {/* Match + team */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-ink truncate">
          {match ? `${match.home} vs ${match.away}` : `Match ${bet.match_id}`}
        </p>
        <p className="text-xs text-muted mt-0.5">
          🪙 {bet.amount} on <span className="font-bold text-ink">{bet.team_code}</span>
          {' '}@ {bet.odds}×
        </p>
      </div>

      {/* Status + payout */}
      <div className="text-right shrink-0">
        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${statusBadge[bet.status]}`}>
          {statusIcon[bet.status]}
          {bet.status === 'won'     && `+🪙 ${payout}`}
          {bet.status === 'lost'    && `–🪙 ${bet.amount}`}
          {bet.status === 'pending' && `→ 🪙 ${potential}`}
        </span>
      </div>
    </div>
  )
}

export default function MyBets({ onOpenAuth }) {
  const { user } = useAuth()
  const { balance, bets, loading } = useCoins()
  const { matches } = useApp()
  const [open, setOpen] = useState(true)

  if (!supabaseEnabled) return null

  // Tease for logged-out users
  if (!user) {
    return (
      <div className="card p-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🪙</span>
          <div>
            <p className="font-semibold text-sm text-ink">Coins &amp; Betting</p>
            <p className="text-xs text-muted">Sign in to get 1 000 free coins and bet on matches.</p>
          </div>
        </div>
        <button
          onClick={onOpenAuth}
          className="shrink-0 rounded-xl border border-brand/40 bg-brand/10 px-3 py-1.5 text-xs font-semibold text-brand hover:bg-brand/20 transition-colors"
        >
          Sign in
        </button>
      </div>
    )
  }

  const matchById = Object.fromEntries(matches.map((m) => [m.id, m]))
  const pendingBets = bets.filter((b) => b.status === 'pending')
  const settledBets = bets.filter((b) => b.status !== 'pending')
  const totalWon    = settledBets.filter((b) => b.status === 'won').reduce((s, b) => s + (b.payout ?? 0), 0)

  return (
    <div className="card overflow-hidden">
      {/* Header row */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/3 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-xl">🪙</span>
          <div className="text-left">
            <p className="text-sm font-bold text-ink">
              My Bets
              {bets.length > 0 && (
                <span className="ml-2 rounded-full bg-brand/15 px-1.5 py-0.5 text-[11px] font-semibold text-brand">
                  {bets.length}
                </span>
              )}
            </p>
            <p className="text-xs text-muted">
              Balance: <span className="font-bold text-ink">
                {loading ? '…' : `🪙 ${(balance ?? 0).toLocaleString()}`}
              </span>
              {totalWon > 0 && (
                <span className="ml-2 text-green-400 font-semibold">+🪙 {totalWon.toLocaleString()} won</span>
              )}
            </p>
          </div>
        </div>
        {open ? <ChevronUp size={16} className="text-muted" /> : <ChevronDown size={16} className="text-muted" />}
      </button>

      {open && (
        <>
          {loading && (
            <p className="px-4 py-3 text-xs text-muted">Loading bets…</p>
          )}

          {!loading && bets.length === 0 && (
            <p className="px-4 py-4 text-xs text-center text-muted">
              No bets yet. Click <strong>Bet</strong> on any upcoming match.
            </p>
          )}

          {!loading && pendingBets.length > 0 && (
            <div className="border-t border-line/30 dark:border-white/8">
              <p className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-widest text-muted">
                Active ({pendingBets.length})
              </p>
              {pendingBets.map((b) => (
                <BetRow key={b.id} bet={b} match={matchById[b.match_id]} />
              ))}
            </div>
          )}

          {!loading && settledBets.length > 0 && (
            <div className="border-t border-line/30 dark:border-white/8">
              <p className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-widest text-muted">
                Settled ({settledBets.length})
              </p>
              {settledBets.map((b) => (
                <BetRow key={b.id} bet={b} match={matchById[b.match_id]} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
