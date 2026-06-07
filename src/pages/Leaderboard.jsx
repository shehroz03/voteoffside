import { useMemo } from 'react'
import { Trophy } from 'lucide-react'
import { useApp } from '../context/AppContext.jsx'
import AdSlot from '../components/AdSlot.jsx'

// Demo leaderboard. In production this comes from the backend, ranking real
// anonymous users by correct predictions.
const NAMES = [
  'EagleKing_2207', 'StormBaller_4419', 'ViperAce_1180', 'PhoenixPro_7732',
  'CobraChamp_5561', 'ThunderHero_3098', 'FalconBoss_8842', 'RocketLegend_6610',
  'BlazeNinja_2934', 'SharkMaster_1457', 'WolfStar_9923', 'CometCaptain_3376',
]

export default function Leaderboard() {
  const { username } = useApp()

  const rows = useMemo(() => {
    const base = NAMES.map((name, i) => ({
      name,
      correct: 58 - i * 3 - (i % 2),
      played: 64,
    }))
    // insert the current user somewhere in the middle
    base.splice(6, 0, { name: username, correct: 31, played: 40, you: true })
    return base
      .map((r) => ({ ...r, acc: Math.round((r.correct / r.played) * 100) }))
      .sort((a, b) => b.correct - a.correct)
  }, [username])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Leaderboard</h1>
        <p className="text-sm text-muted">Top predictors worldwide</p>
      </div>

      <AdSlot label="Ad" />

      <div className="card divide-y divide-line overflow-hidden">
        {rows.map((r, i) => (
          <div
            key={r.name}
            className={`flex items-center gap-3 px-4 py-3 ${r.you ? 'bg-brand/5' : ''}`}
          >
            <div className="w-7 text-center font-extrabold tabular-nums">
              {i === 0 ? (
                <Trophy size={18} className="mx-auto text-gold-500" />
              ) : (
                <span className={i < 3 ? 'text-brand' : 'text-muted'}>{i + 1}</span>
              )}
            </div>
            <div className="flex-1 truncate font-semibold">
              {r.name}
              {r.you && <span className="ml-2 text-xs font-bold text-brand">YOU</span>}
            </div>
            <div className="text-right">
              <div className="font-extrabold tabular-nums">{r.correct}</div>
              <div className="text-[11px] text-muted">{r.acc}% acc</div>
            </div>
          </div>
        ))}
      </div>

      <p className="rounded-xl border border-line bg-elevated p-3 text-center text-xs text-muted">
        Demo standings. Wire to your backend to rank real users by correct predictions.
      </p>
    </div>
  )
}
