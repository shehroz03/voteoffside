import { useState, useMemo } from 'react'
import { matches } from '../lib/matches.js'

export default function Admin() {
  const [password, setPassword] = useState('')
  const [authenticated, setAuthenticated] = useState(false)
  const [settleModal, setSettleModal] = useState(null)
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Use local date for "today"
  const todayStr = new Date().toISOString().split('T')[0]
  
  const todaysMatches = useMemo(() => {
    return matches.filter(m => m.date.startsWith(todayStr))
  }, [todayStr])

  const handleLogin = (e) => {
    e.preventDefault()
    if (password.trim().length > 0) {
      setAuthenticated(true)
    } else {
      alert('Please enter a password')
    }
  }

  const handleSettle = async (matchId, winnerTeamCode) => {
    setIsLoading(true)
    setMessage('')
    try {
      const res = await fetch('/api/admin/settle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': password
        },
        body: JSON.stringify({ matchId, winnerTeamCode })
      })
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || 'Request failed')
      }
      
      setMessage(`Match ${matchId} settled successfully!`)
      setSettleModal(null)
    } catch (err) {
      setMessage(`Error settling match: ${err.message}`)
      if (err.message === 'Unauthorized') {
        setAuthenticated(false)
      }
    } finally {
      setIsLoading(false)
    }
  }

  if (!authenticated) {
    return (
      <div className="p-8 max-w-sm mx-auto">
        <h1 className="text-2xl font-bold mb-4">Admin Login</h1>
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <input
            type="password"
            placeholder="Enter Admin Password"
            className="p-2 border rounded bg-surface border-line text-text"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button type="submit" className="bg-brand text-white p-2 rounded">Login</button>
        </form>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Admin - Settle Matches</h1>
      {message && <div className="mb-4 p-4 bg-surface border border-line rounded">{message}</div>}
      
      <h2 className="text-xl mb-2">Today's Matches ({todayStr})</h2>
      {todaysMatches.length === 0 ? (
        <p>No matches scheduled for today.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {todaysMatches.map(m => (
            <div key={m.id} className="p-4 border rounded border-line flex justify-between items-center bg-surface">
              <div>
                <strong>{m.id}</strong>: {m.home} vs {m.away}
                <div className="text-sm text-muted">{m.stage} - {m.venue}</div>
              </div>
              <button 
                onClick={() => setSettleModal(m)}
                className="bg-brand text-white px-4 py-2 rounded"
              >
                Settle Result
              </button>
            </div>
          ))}
        </div>
      )}

      {settleModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-surface p-6 rounded max-w-sm w-full border border-line">
            <h3 className="text-xl font-bold mb-4">Settle Match {settleModal.id}</h3>
            <p className="mb-4">Select the winner for {settleModal.home} vs {settleModal.away}:</p>
            <div className="flex flex-col gap-2 mb-4">
              <button 
                onClick={() => handleSettle(settleModal.id, settleModal.home)}
                disabled={isLoading}
                className="bg-surface border border-line p-2 rounded hover:bg-brand hover:text-white"
              >
                {settleModal.home} (Home)
              </button>
              <button 
                onClick={() => handleSettle(settleModal.id, 'DRAW')}
                disabled={isLoading}
                className="bg-surface border border-line p-2 rounded hover:bg-brand hover:text-white"
              >
                DRAW
              </button>
              <button 
                onClick={() => handleSettle(settleModal.id, settleModal.away)}
                disabled={isLoading}
                className="bg-surface border border-line p-2 rounded hover:bg-brand hover:text-white"
              >
                {settleModal.away} (Away)
              </button>
            </div>
            <button 
              onClick={() => setSettleModal(null)}
              disabled={isLoading}
              className="text-muted w-full p-2"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      
      {/* For testing since June 9th might not have matches */}
      <div className="mt-12">
        <h2 className="text-xl mb-2 text-muted">All Matches (Debug)</h2>
        <div className="flex flex-col gap-2">
          {matches.slice(0, 5).map(m => (
             <div key={m.id} className="p-2 border rounded border-line flex justify-between items-center text-sm">
             <div>{m.date.split('T')[0]} - {m.home} vs {m.away}</div>
             <button onClick={() => setSettleModal(m)} className="underline text-brand">Settle</button>
           </div>
          ))}
          <div className="text-muted text-sm">...showing first 5 only</div>
        </div>
      </div>
    </div>
  )
}
