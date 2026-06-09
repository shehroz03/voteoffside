import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase, supabaseEnabled } from '../lib/supabase.js'
import { useAuth } from './AuthContext.jsx'
import { fetchBalance, fetchMyBets, placeBetRemote } from '../lib/coinsApi.js'

const CoinsContext = createContext()

export function CoinsProvider({ children }) {
  const { user } = useAuth()
  const [balance, setBalance] = useState(null)   // null = not loaded yet
  const [bets, setBets] = useState([])
  const [loading, setLoading] = useState(false)

  // Load balance + bets whenever the logged-in user changes
  useEffect(() => {
    if (!user) {
      setBalance(null)
      setBets([])
      return
    }
    setLoading(true)
    Promise.all([fetchBalance(user.id), fetchMyBets(user.id)]).then(([bal, b]) => {
      if (bal !== null) setBalance(bal)
      setBets(b)
      setLoading(false)
    })
  }, [user])

  // Realtime: keep balance in sync when it changes server-side (e.g. after settle_match)
  useEffect(() => {
    if (!supabaseEnabled || !user) return
    const channel = supabase
      .channel(`user_coins_${user.id}`)
      .on('postgres_changes', {
        event:  'UPDATE',
        schema: 'public',
        table:  'user_coins',
        filter: `user_id=eq.${user.id}`,
      }, (payload) => {
        if (payload.new?.balance !== undefined) setBalance(payload.new.balance)
      })
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [user])

  // Realtime: update settled bets when settle_match runs
  useEffect(() => {
    if (!supabaseEnabled || !user) return
    const channel = supabase
      .channel(`coin_bets_${user.id}`)
      .on('postgres_changes', {
        event:  'UPDATE',
        schema: 'public',
        table:  'coin_bets',
        filter: `user_id=eq.${user.id}`,
      }, (payload) => {
        if (!payload.new) return
        setBets((prev) =>
          prev.map((b) => (b.id === payload.new.id ? { ...b, ...payload.new } : b))
        )
      })
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [user])

  const placeBet = useCallback(
    async ({ matchId, teamCode, amount, odds }) => {
      if (!user) return { error: 'Not logged in' }
      const result = await placeBetRemote({ userId: user.id, matchId, teamCode, amount, odds })
      if (result.error) return { error: result.error }
      // Optimistic update — server confirms via realtime
      setBalance(result.data.new_balance)
      setBets((prev) => [
        {
          id:         result.data.bet_id,
          user_id:    user.id,
          match_id:   matchId,
          team_code:  teamCode,
          amount,
          odds,
          status:     'pending',
          payout:     null,
          created_at: new Date().toISOString(),
        },
        ...prev,
      ])
      return { success: true }
    },
    [user]
  )

  // Returns the bet for a given match, or null
  const betForMatch = useCallback(
    (matchId) => bets.find((b) => b.match_id === matchId) ?? null,
    [bets]
  )

  return (
    <CoinsContext.Provider value={{ balance, bets, loading, placeBet, betForMatch }}>
      {children}
    </CoinsContext.Provider>
  )
}

export const useCoins = () => useContext(CoinsContext)
