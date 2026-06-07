import { useEffect } from 'react'
import { flag, getTeam } from '../lib/teams.js'
import { communityVotes } from '../lib/community.js'
import { supabaseEnabled } from '../lib/supabase.js'
import { useApp } from '../context/AppContext.jsx'
import { useVotes } from '../context/VotesContext.jsx'
import VoteBar from './VoteBar.jsx'

function fmtDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}
function fmtTime(iso) {
  return new Date(iso).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
}

export default function MatchCard({ match, votable = true }) {
  const { votes } = useApp()
  const { countsMap, ensureLoaded, vote } = useVotes()
  const userPick = votes[match.id]
  const home = getTeam(match.home)
  const away = getTeam(match.away)

  const live = match.status === 'live'
  const finished = match.status === 'finished'

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

  return (
    <div className="card p-4 sm:p-5 animate-fade-up">
      <div className="mb-3 flex items-center justify-between text-xs text-muted">
        <span className="font-semibold">{match.stage}</span>
        {live ? (
          <span className="inline-flex items-center gap-1.5 font-bold text-red-500">
            <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
            LIVE {match.minute ? `${match.minute}'` : ''}
          </span>
        ) : finished ? (
          <span className="font-semibold">Full time</span>
        ) : (
          <span>{fmtDate(match.date)} · {fmtTime(match.date)}</span>
        )}
      </div>

      <div className="flex items-center justify-between gap-3">
        <button
          onClick={() => votable && !finished && vote(match.id, match.home)}
          className={`flex flex-1 items-center gap-2.5 rounded-xl p-2 text-left transition-colors ${
            votable && !finished ? 'hover:bg-brand/5' : ''
          } ${userPick === match.home ? 'ring-2 ring-brand' : ''}`}
        >
          <span className="text-2xl" aria-hidden>{flag(match.home)}</span>
          <span className="font-semibold leading-tight">{home.name}</span>
        </button>

        <div className="shrink-0 px-2 text-center">
          {live || finished ? (
            <div className="text-2xl font-extrabold tabular-nums">
              {match.score?.home ?? 0}<span className="mx-1 text-muted">-</span>{match.score?.away ?? 0}
            </div>
          ) : (
            <div className="text-xs font-bold text-muted">VS</div>
          )}
        </div>

        <button
          onClick={() => votable && !finished && vote(match.id, match.away)}
          className={`flex flex-1 items-center justify-end gap-2.5 rounded-xl p-2 text-right transition-colors ${
            votable && !finished ? 'hover:bg-gold/5' : ''
          } ${userPick === match.away ? 'ring-2 ring-gold' : ''}`}
        >
          <span className="font-semibold leading-tight">{away.name}</span>
          <span className="text-2xl" aria-hidden>{flag(match.away)}</span>
        </button>
      </div>

      {votable && (
        <div className="mt-4">
          <VoteBar
            homePct={homePct}
            awayPct={awayPct}
            userPick={userPick}
            homeCode={match.home}
            awayCode={match.away}
          />
          <p className="mt-2 text-center text-xs text-muted">
            {userPick ? (
              <>You picked <b className="text-ink">{getTeam(userPick).name}</b> · </>
            ) : (
              <>Tap a team to predict · </>
            )}
            {total.toLocaleString()} votes
          </p>
        </div>
      )}

      <div className="mt-3 text-center text-[11px] text-muted">{match.venue}</div>
    </div>
  )
}
