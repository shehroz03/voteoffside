import { useEffect, useMemo, useState } from 'react'
import { groupKeys } from '../lib/teams.js'
import { useApp } from '../context/AppContext.jsx'
import MatchCard from '../components/MatchCard.jsx'
import AdSlot from '../components/AdSlot.jsx'
import SharePredictions from '../components/SharePredictions.jsx'
import { StaggerList, StaggerItem } from '../motion.jsx'
import { fetchMyStreak } from '../lib/votesApi.js'
import { getMatchVoteState } from '../lib/matches.js'

export default function Predictions() {
  const { votes, matches, username } = useApp()
  const [group, setGroup] = useState('all')
  const [onlyOpen, setOnlyOpen] = useState(false)
  const [openNow, setOpenNow] = useState(false)
  const [streak, setStreak] = useState(0)

  // Fetch current user's prediction streak (0 in demo mode)
  useEffect(() => {
    if (!username) return
    fetchMyStreak(username).then(setStreak)
  }, [username])

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

        {/* Streak callout inside the progress card — only when on a streak */}
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

      {/* Filter chips */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setGroup('all')}
          className={`chip ${group === 'all' ? 'chip-active' : ''}`}
        >
          All
        </button>
        {groupKeys.map((g) => (
          <button
            key={g}
            onClick={() => setGroup(g)}
            className={`chip ${group === g ? 'chip-active' : ''}`}
          >
            {g}
          </button>
        ))}
        <button
          onClick={() => setOpenNow((v) => !v)}
          className={`chip ml-auto ${openNow ? 'chip-active' : ''}`}
        >
          Open now
        </button>
        <button
          onClick={() => setOnlyOpen((v) => !v)}
          className={`chip ${onlyOpen ? 'chip-active' : ''}`}
        >
          Not predicted yet
        </button>
      </div>

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
    </div>
  )
}
