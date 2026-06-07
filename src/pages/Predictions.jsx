import { useMemo, useState } from 'react'
import { groupKeys } from '../lib/teams.js'
import { useApp } from '../context/AppContext.jsx'
import MatchCard from '../components/MatchCard.jsx'
import AdSlot from '../components/AdSlot.jsx'

export default function Predictions() {
  const { votes, matches } = useApp()
  const [group, setGroup] = useState('all')
  const [onlyOpen, setOnlyOpen] = useState(false)

  const list = useMemo(() => {
    return matches.filter((m) => {
      if (group !== 'all' && m.group !== group) return false
      if (onlyOpen && votes[m.id]) return false
      return true
    })
  }, [group, onlyOpen, votes])

  const predicted = Object.keys(votes).length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Predictions</h1>
        <p className="text-sm text-muted">
          You've predicted <b className="text-brand">{predicted}</b> of {matches.length} matches
        </p>
      </div>

      {/* progress */}
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
      </div>

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
          onClick={() => setOnlyOpen((v) => !v)}
          className={`chip ml-auto ${onlyOpen ? 'chip-active' : ''}`}
        >
          Not predicted yet
        </button>
      </div>

      <AdSlot label="Ad · below vote results" />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {list.map((m) => (
          <MatchCard key={m.id} match={m} />
        ))}
      </div>

      {list.length === 0 && (
        <p className="py-12 text-center text-muted">
          {onlyOpen ? 'You predicted everything here. 🎉' : 'No matches found.'}
        </p>
      )}
    </div>
  )
}
