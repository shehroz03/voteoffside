import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react'
import { supabase, supabaseEnabled } from '../lib/supabase.js'

const ReactionsContext = createContext()

// Rolling window of floating reactions kept per match (mobile performance cap)
const MAX_PER_MATCH = 6
// Client-side spam throttle: one reaction per user every 2 seconds globally
const THROTTLE_MS = 2000

export function ReactionsProvider({ children }) {
  // { [matchId]: [{ id, emoji, x }] }
  const [map, setMap] = useState({})
  const lastSentAt = useRef(0)
  // Tracks row ids we inserted ourselves so we can suppress the self-echo from realtime
  const selfIds = useRef(new Set())

  // Single shared channel for ALL reaction inserts — never one per card
  useEffect(() => {
    if (!supabaseEnabled) return
    const channel = supabase
      .channel('reactions_all')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'reactions' },
        (payload) => {
          const row = payload.new
          if (!row?.match_id || !row?.emoji) return
          // Suppress self-echo (we already showed an optimistic float)
          if (selfIds.current.has(row.id)) {
            selfIds.current.delete(row.id)
            return
          }
          const x = 8 + Math.random() * 84
          setMap((prev) => {
            const current = prev[row.match_id] ?? []
            return {
              ...prev,
              [row.match_id]: [
                ...current,
                { id: `remote_${row.id}`, emoji: row.emoji, x },
              ].slice(-MAX_PER_MATCH),
            }
          })
        }
      )
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [])

  const sendReaction = useCallback((matchId, emoji) => {
    const now = Date.now()
    if (now - lastSentAt.current < THROTTLE_MS) return
    lastSentAt.current = now

    // Optimistic: local float appears immediately
    const x = 8 + Math.random() * 84
    setMap((prev) => {
      const current = prev[matchId] ?? []
      return {
        ...prev,
        [matchId]: [...current, { id: `opt_${now}`, emoji, x }].slice(-MAX_PER_MATCH),
      }
    })

    if (!supabaseEnabled) return

    // Insert and capture the row id so we can suppress the realtime self-echo
    supabase
      .from('reactions')
      .insert({ match_id: matchId, emoji })
      .select('id')
      .single()
      .then(({ data, error }) => {
        if (error) { console.error('sendReaction:', error.message); return }
        if (data?.id != null) {
          selfIds.current.add(data.id)
          // Auto-clean after 15 s to prevent unbounded Set growth
          setTimeout(() => selfIds.current.delete(data.id), 15_000)
        }
      })
  }, []) // setMap is stable; refs never change

  const dismissReaction = useCallback((matchId, id) => {
    setMap((prev) => {
      const current = prev[matchId]
      if (!current) return prev
      const next = current.filter((r) => r.id !== id)
      if (next.length === current.length) return prev
      return { ...prev, [matchId]: next }
    })
  }, [])

  return (
    <ReactionsContext.Provider value={{ map, sendReaction, dismissReaction }}>
      {children}
    </ReactionsContext.Provider>
  )
}

export const useReactions = () => useContext(ReactionsContext)
