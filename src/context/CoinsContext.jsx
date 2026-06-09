import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react'
import { supabase, supabaseEnabled } from '../lib/supabase.js'
import { useAuth } from './AuthContext.jsx'
import { fetchBalance, fetchMyBets, placeBet as placeBetApi } from '../lib/coinsApi.js'

const CoinsContext = createContext()

export function CoinsProvider({ children }) {
  const { user } = useAuth()
  const [balance, setBalance]   = useState(null)   // null = not loaded
  const [betsMap, setBetsMap]   = useState(() => new Map()) // matchId → bet object
  const [loading, setLoading]   = useState(false)
  const placing = useRef(new Set()) // matchIds currently in-flight (debounce)

  // ── Load on user change ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) {
      setBalance(null)
      setBetsMap(new Map())
      placing.current.clear()
      return
    }
    setLoading(true)
    Promise.all([fetchBalance(user.id), fetchMyBets(user.id)]).then(([bal, arr]) => {
      if (bal !== null) setBalance(bal)
      const m = new Map()
      for (const b of arr) m.set(b.match_id, b)
      setBetsMap(m)
      setLoading(false)
    })
  }, [user])

  // ── Realtime: balance updates (e.g. after match settles) ─────────────────────
  useEffect(() => {
    if (!supabaseEnabled || !user) return
    const ch = supabase
      .channel(`user_coins_${user.id}`)
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'user_coins',
        filter: `user_id=eq.${user.id}`,
      }, (payload) => {
        if (payload.new?.balance !== undefined) setBalance(payload.new.balance)
      })
      .subscribe()
    return () => supabase.removeChannel(ch)
  }, [user])

  // ── Realtime: bet status updates (pending → won/lost) ───────────────────────
  useEffect(() => {
    if (!supabaseEnabled || !user) return
    const ch = supabase
      .channel(`coin_bets_${user.id}`)
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'coin_bets',
        filter: `user_id=eq.${user.id}`,
      }, (payload) => {
        if (!payload.new?.match_id) return
        setBetsMap((prev) => {
          const next = new Map(prev)
          next.set(payload.new.match_id, {
            ...(prev.get(payload.new.match_id) ?? {}),
            ...payload.new,
          })
          return next
        })
      })
      .subscribe()
    return () => supabase.removeChannel(ch)
  }, [user])

  // ── Place bet ────────────────────────────────────────────────────────────────
  const placeBet = useCallback(async ({ matchId, teamCode, amount, odds }) => {
    if (!user)                          return { error: 'Sign in to place bets' }
    if (betsMap.has(matchId))           return { error: 'You already bet on this match' }
    if (placing.current.has(matchId))   return { error: 'Already placing a bet, please wait' }
    if (balance !== null && balance < amount) return { error: 'Not enough coins' }

    placing.current.add(matchId)

    // Optimistic: deduct balance and add pending bet immediately
    const prevBalance = balance
    setBalance((b) => (b !== null ? b - amount : b))
    const optimistic = {
      id:         `opt-${Date.now()}`,
      user_id:    user.id,
      match_id:   matchId,
      team_code:  teamCode,
      amount,
      odds,
      status:     'pending',
      payout:     null,
      created_at: new Date().toISOString(),
    }
    setBetsMap((prev) => new Map(prev).set(matchId, optimistic))

    try {
      const result = await placeBetApi(user.id, matchId, teamCode, amount, odds)
      if (result === null) {
        // Supabase disabled — roll back
        setBalance(prevBalance)
        setBetsMap((prev) => { const n = new Map(prev); n.delete(matchId); return n })
        placing.current.delete(matchId)
        return { error: 'Supabase not configured' }
      }
      // Confirm with real IDs from server
      setBalance(result.new_balance)
      setBetsMap((prev) => {
        const n = new Map(prev)
        n.set(matchId, { ...optimistic, id: result.bet_id })
        return n
      })
      placing.current.delete(matchId)
      return { success: true }
    } catch (err) {
      // Roll back on error
      setBalance(prevBalance)
      setBetsMap((prev) => { const n = new Map(prev); n.delete(matchId); return n })
      placing.current.delete(matchId)
      const msg = err.message || 'Failed to place bet'
      const friendly = msg.includes('balance')   ? 'Not enough coins'
                     : msg.includes('already')   ? 'Already bet on this match'
                     : msg.includes('closed')    ? 'Betting closed for this match'
                     : msg
      return { error: friendly }
    }
  }, [user, betsMap, balance])

  // ── Derived helpers ──────────────────────────────────────────────────────────
  const getBet      = useCallback((matchId) => betsMap.get(matchId) ?? null, [betsMap])
  const hasBet      = useCallback((matchId) => betsMap.has(matchId),         [betsMap])
  const betForMatch = getBet // backward-compat alias

  // bets as plain array for MyBets / list rendering
  const bets = [...betsMap.values()].sort(
    (a, b) => new Date(b.created_at) - new Date(a.created_at)
  )

  return (
    <CoinsContext.Provider value={{
      balance, bets, loading,
      placeBet, getBet, hasBet, betForMatch,
    }}>
      {children}
    </CoinsContext.Provider>
  )
}

export const useCoins = () => useContext(CoinsContext)
