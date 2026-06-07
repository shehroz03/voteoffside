import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react'
import { supabase, supabaseEnabled } from '../lib/supabase.js'
import { fetchCounts, castVoteRemote } from '../lib/votesApi.js'
import { useApp } from './AppContext.jsx'

const VotesContext = createContext()

export function VotesProvider({ children }) {
  const { fingerprint, username, castVote: castLocal } = useApp()
  const [countsMap, setCountsMap] = useState({}) // { matchId: { team: count } }
  const requested = useRef(new Set())

  // A single realtime channel for the whole app — not one per card.
  useEffect(() => {
    if (!supabaseEnabled) return
    const channel = supabase
      .channel('vote_counts_all')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'vote_counts' },
        (payload) => {
          const row = payload.new
          if (!row || !row.match_id) return
          setCountsMap((prev) => ({
            ...prev,
            [row.match_id]: { ...(prev[row.match_id] || {}), [row.team_code]: row.count },
          }))
        }
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  // Load a match's counts once (called by cards when they mount)
  const ensureLoaded = useCallback(async (matchId) => {
    if (!supabaseEnabled || requested.current.has(matchId)) return
    requested.current.add(matchId)
    const c = await fetchCounts(matchId)
    if (c) setCountsMap((prev) => ({ ...prev, [matchId]: c }))
  }, [])

  // Vote: optimistic local pick + persisted remotely
  const vote = useCallback(
    async (matchId, teamCode) => {
      castLocal(matchId, teamCode)
      if (!supabaseEnabled) return
      const data = await castVoteRemote({ fingerprint, matchId, teamCode, username })
      if (data) setCountsMap((prev) => ({ ...prev, [matchId]: data }))
    },
    [castLocal, fingerprint, username]
  )

  return (
    <VotesContext.Provider value={{ countsMap, ensureLoaded, vote }}>
      {children}
    </VotesContext.Provider>
  )
}

export const useVotes = () => useContext(VotesContext)
