import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Loader2, AlertCircle, TrendingUp, LogIn } from 'lucide-react'
import { useCoins } from '../context/CoinsContext.jsx'
import { useVotes } from '../context/VotesContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'

// odds formula: backing a team with pct% vote share
// 70% favourite → 1.54×   |   30% underdog → 2.26×   |   50/50 → 1.9×
function computeOdds(pct) {
  if (!pct || pct <= 0) return 1.9
  const raw = 1 + (1 - pct) * 1.8
  return Math.round(Math.max(1.1, Math.min(4.5, raw)) * 100) / 100
}

const QUICK_AMOUNTS = [50, 100, 200, 300, 500]

const statusColors = {
  pending: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
  won:     'text-green-400  bg-green-500/10  border-green-500/30',
  lost:    'text-red-400    bg-red-500/10    border-red-500/30',
}
const statusLabel = { pending: '⏳ Pending', won: '🏆 Won', lost: '❌ Lost' }

export default function BetModal({ match, onClose, onSignIn }) {
  const { user } = useAuth()
  const { balance, placeBet, betForMatch } = useCoins()
  const { countsMap, ensureLoaded } = useVotes()

  const [team, setTeam] = useState(match.home)
  const [amount, setAmount] = useState(100)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  // Ensure vote counts are loaded so odds are accurate
  useEffect(() => { ensureLoaded(match.id) }, [match.id, ensureLoaded])

  const counts   = countsMap[match.id] || {}
  const total    = (counts[match.home] || 0) + (counts[match.away] || 0)
  const homePct  = total > 0 ? (counts[match.home] || 0) / total : 0.5
  const awayPct  = total > 0 ? (counts[match.away] || 0) / total : 0.5
  const homeOdds = computeOdds(homePct)
  const awayOdds = computeOdds(awayPct)

  const selectedOdds = team === match.home ? homeOdds : awayOdds
  const payout       = Math.floor(amount * selectedOdds)
  const existingBet  = betForMatch(match.id)

  const handleBet = async (e) => {
    e.preventDefault()
    setError('')
    if (amount < 50 || amount > 500) { setError('Amount must be 50 – 500'); return }
    if (balance !== null && balance < amount) { setError('Not enough coins'); return }
    setLoading(true)
    const result = await placeBet({ matchId: match.id, teamCode: team, amount, odds: selectedOdds })
    setLoading(false)
    if (result.error) { setError(result.error); return }
    setDone(true)
    setTimeout(onClose, 1600)
  }

  return (
    <AnimatePresence>
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div
          key="panel"
          initial={{ opacity: 0, scale: 0.95, y: 14 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 14 }}
          transition={{ type: 'spring', stiffness: 320, damping: 28 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-sm rounded-2xl border border-line/60 bg-elevated shadow-2xl dark:bg-[#0d1526] dark:border-white/10 p-6"
        >
          {/* Close */}
          <button onClick={onClose} aria-label="Close"
            className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:text-ink hover:bg-white/5 transition-colors">
            <X size={16} />
          </button>

          {/* Header */}
          <div className="mb-5">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted mb-0.5">
              Place a bet
            </p>
            <h2 className="text-xl font-extrabold text-ink tracking-tight">
              {match.home} <span className="text-muted font-normal text-base">vs</span> {match.away}
            </h2>
            <p className="text-xs text-muted">{match.stage}</p>
          </div>

          {/* Not logged in */}
          {!user && (
            <div className="flex flex-col items-center gap-4 py-4 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand/10 text-2xl">
                🪙
              </div>
              <div>
                <p className="font-semibold text-ink">Sign in to place bets</p>
                <p className="mt-1 text-xs text-muted">Logged-in users start with 1 000 free coins.</p>
              </div>
              <button
                onClick={onSignIn}
                className="flex items-center gap-2 rounded-xl bg-brand-gradient px-5 py-2.5 text-sm font-semibold text-white shadow-brand hover:opacity-90 transition-opacity"
              >
                <LogIn size={14} /> Sign in
              </button>
            </div>
          )}

          {/* Existing bet */}
          {user && existingBet && (
            <div className="space-y-3">
              <p className="text-xs font-semibold text-muted uppercase tracking-widest">Your bet</p>
              <div className={`rounded-xl border px-4 py-3 text-sm font-semibold ${statusColors[existingBet.status]}`}>
                {statusLabel[existingBet.status]}
              </div>
              <div className="rounded-xl border border-line/40 bg-white/3 dark:bg-white/5 divide-y divide-line/30 dark:divide-white/10 text-sm">
                {[
                  ['Team', existingBet.team_code],
                  ['Bet', `🪙 ${existingBet.amount}`],
                  ['Odds', `${existingBet.odds}×`],
                  existingBet.status === 'won'
                    ? ['Won', `🪙 ${existingBet.payout}`]
                    : existingBet.status === 'pending'
                    ? ['Potential', `🪙 ${Math.floor(existingBet.amount * existingBet.odds)}`]
                    : ['Lost', `–🪙 ${existingBet.amount}`],
                ].map(([label, val]) => (
                  <div key={label} className="flex justify-between px-3 py-2">
                    <span className="text-muted">{label}</span>
                    <span className="font-bold text-ink">{val}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Success flash */}
          {user && done && !existingBet && (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <span className="text-4xl">🎉</span>
              <p className="font-bold text-ink">Bet placed!</p>
              <p className="text-xs text-muted">Good luck. Results settle when the match ends.</p>
            </div>
          )}

          {/* Bet form */}
          {user && !existingBet && !done && (
            <form onSubmit={handleBet} className="space-y-5">
              {/* Team picker */}
              <div className="grid grid-cols-2 gap-2">
                {[
                  { code: match.home, pct: homePct, odds: homeOdds },
                  { code: match.away, pct: awayPct, odds: awayOdds },
                ].map(({ code, pct, odds }) => (
                  <button
                    key={code}
                    type="button"
                    onClick={() => setTeam(code)}
                    className={`rounded-xl border p-3 text-center transition-all ${
                      team === code
                        ? 'border-brand/60 bg-brand/10 ring-1 ring-brand/30'
                        : 'border-line/50 bg-white/3 hover:bg-white/8 dark:border-white/10 dark:bg-white/5'
                    }`}
                  >
                    <div className="text-base font-extrabold text-ink">{code}</div>
                    <div className={`mt-0.5 text-xs font-bold ${team === code ? 'text-brand' : 'text-muted'}`}>
                      {odds}×
                    </div>
                    <div className="mt-0.5 text-[10px] text-muted">
                      {Math.round(pct * 100)}% backed
                    </div>
                  </button>
                ))}
              </div>

              {/* Amount */}
              <div>
                <div className="mb-2 flex items-center justify-between text-xs font-semibold text-muted">
                  <span>Bet amount</span>
                  <span className="text-base font-extrabold text-ink">🪙 {amount}</span>
                </div>
                <input
                  type="range"
                  min={50} max={500} step={10}
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full accent-brand"
                />
                <div className="mt-2 flex gap-1.5">
                  {QUICK_AMOUNTS.map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setAmount(v)}
                      className={`flex-1 rounded-lg py-1 text-[11px] font-bold transition-colors ${
                        amount === v
                          ? 'bg-brand text-white'
                          : 'bg-white/5 text-muted hover:bg-white/10'
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              {/* Payout preview */}
              <div className="rounded-xl border border-line/40 dark:border-white/10 bg-white/3 dark:bg-white/5 divide-y divide-line/30 dark:divide-white/10 text-sm">
                <div className="flex justify-between px-3 py-2">
                  <span className="text-muted">If {team} wins</span>
                  <span className="font-bold text-green-400">🪙 {payout}</span>
                </div>
                <div className="flex justify-between px-3 py-2">
                  <span className="text-muted">Balance after bet</span>
                  <span className="font-semibold text-ink">
                    🪙 {balance !== null ? (balance - amount).toLocaleString() : '—'}
                  </span>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-400">
                  <AlertCircle size={13} className="shrink-0" /> {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || (balance !== null && balance < amount)}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-gradient py-2.5 text-sm font-semibold text-white shadow-brand hover:opacity-90 transition-opacity disabled:opacity-40"
              >
                {loading ? <Loader2 size={14} className="animate-spin" /> : <TrendingUp size={14} />}
                Place 🪙 {amount} on {team}
              </button>
            </form>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
