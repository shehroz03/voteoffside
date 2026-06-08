import { useEffect, useState } from 'react'
import { Trophy, Medal, Flame, Info } from 'lucide-react'
import { motion } from 'framer-motion'
import { useApp } from '../context/AppContext.jsx'
import AdSlot from '../components/AdSlot.jsx'
import { StaggerList, StaggerItem } from '../motion.jsx'
import { fetchLeaderboard, fetchPredictorOfDay } from '../lib/votesApi.js'
import { supabaseEnabled } from '../lib/supabase.js'

// ─── Demo data ────────────────────────────────────────────────────────────────

const DEMO_NAMES = [
  'EagleKing_2207', 'StormBaller_4419', 'ViperAce_1180', 'PhoenixPro_7732',
  'CobraChamp_5561', 'ThunderHero_3098', 'FalconBoss_8842', 'RocketLegend_6610',
  'BlazeNinja_2934', 'SharkMaster_1457', 'WolfStar_9923', 'CometCaptain_3376',
]

const DEMO_STREAKS = [5, 3, 0, 4, 0, 2, 0, 0, 0, 3, 0, 1]

const DEMO_POTD = {
  username: 'EagleKing_2207',
  day_points: 240,
  day_correct: 4,
  matchday: '2026-06-07',
}

function makeDemoRows(username) {
  const base = DEMO_NAMES.map((name, i) => ({
    name,
    correct: 58 - i * 3 - (i % 2),
    played:  64,
    points:  2340 - i * 172 - (i % 3) * 28,
    streak:  DEMO_STREAKS[i] ?? 0,
  }))
  base.splice(6, 0, { name: username, correct: 31, played: 40, points: 1260, you: true, streak: 3 })
  return base
    .map((r) => ({ ...r, acc: Math.round((r.correct / r.played) * 100) }))
    .sort((a, b) => b.points - a.points)
}

// ─── Rank decorations ─────────────────────────────────────────────────────────

const RANK_STYLES = [
  { bg: 'bg-gold/10 dark:bg-gold/15',  num: 'text-gold-500',  icon: <Trophy size={16} className="text-gold-500" /> },
  { bg: 'bg-line/40 dark:bg-white/5',  num: 'text-muted',     icon: <Medal  size={16} className="text-muted" /> },
  { bg: 'bg-brand/8 dark:bg-brand/12', num: 'text-brand/80',  icon: <Medal  size={16} className="text-brand/80" /> },
]

// ─── Beat the Crowd tooltip ───────────────────────────────────────────────────

function BeatTheCrowdLegend() {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative inline-block">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="How points are calculated"
        className="inline-flex items-center gap-1 rounded-full border border-gold-500/40 bg-gold/8 px-2.5 py-1 text-[11px] font-bold text-gold-500 transition-colors hover:bg-gold/14"
      >
        <Flame size={11} />
        Beat the Crowd
        <Info size={11} className="opacity-70" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full z-20 mt-2 w-72 rounded-2xl border border-gold-500/30 bg-surface p-4 shadow-pop">
            <p className="mb-2 flex items-center gap-2 text-sm font-extrabold text-gold-500">
              <Flame size={14} /> Beat the Crowd scoring
            </p>
            <p className="text-xs text-muted leading-relaxed">
              Correctly backing an underdog the crowd doubted scores <strong className="text-ink">much higher</strong> than backing the favourite.
            </p>
            <div className="mt-3 space-y-1.5 rounded-xl bg-elevated px-3 py-2.5 text-xs font-mono">
              <p className="font-sans text-[10px] font-bold uppercase tracking-widest text-muted mb-1.5">Formula</p>
              <p className="text-ink font-semibold">Points = 10 + (100 − winner's vote %)</p>
            </div>
            <div className="mt-3 space-y-1 text-xs text-muted">
              <div className="flex justify-between"><span>70% backed the winner</span><span className="font-bold text-ink">40 pts</span></div>
              <div className="flex justify-between"><span>50% backed the winner</span><span className="font-bold text-ink">60 pts</span></div>
              <div className="flex justify-between"><span>30% backed the winner</span><span className="font-bold text-gold-500 font-black">80 pts 🔥</span></div>
              <div className="flex justify-between"><span>10% backed the winner</span><span className="font-bold text-gold-500 font-black">100 pts ⚡</span></div>
              <div className="flex justify-between text-muted/60"><span>Wrong pick</span><span>0 pts</span></div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ─── Predictor of the Day card ────────────────────────────────────────────────

function PredictorOfDay({ potd, currentUsername, isLive }) {
  if (!potd) {
    return (
      <div className="rounded-3xl border border-dashed border-gold-500/30 bg-gold/5 px-6 py-8 text-center dark:bg-gold/3">
        <p className="text-2xl mb-2">👑</p>
        <p className="font-bold text-gold-600 dark:text-gold-400">Predictor of the Day</p>
        <p className="mt-1 text-xs text-muted">Will appear once the first matchday is settled</p>
      </div>
    )
  }

  const isYou = potd.username === currentUsername
  const dayLabel = potd.matchday
    ? new Date(potd.matchday + 'T12:00:00Z').toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    : null

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden rounded-3xl border border-gold-500/40 bg-gradient-to-br from-amber-500/12 via-yellow-500/8 to-orange-500/10 p-6 dark:from-amber-500/10 dark:via-yellow-500/6 dark:to-orange-500/8"
    >
      {/* Background glow orbs */}
      <div className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full bg-gold/25 blur-3xl" aria-hidden />
      <div className="pointer-events-none absolute -left-6 -bottom-8 h-32 w-32 rounded-full bg-orange-400/15 blur-2xl" aria-hidden />

      {/* Header */}
      <div className="relative mb-5 flex items-center gap-2">
        <span className="text-xl leading-none">👑</span>
        <span className="section-label text-[11px] text-gold-600 dark:text-gold-400 tracking-[0.14em]">
          Predictor of the Day
        </span>
        {!isLive && (
          <span className="ml-1 rounded-full border border-gold-500/30 px-1.5 py-0.5 text-[9px] font-bold text-gold-500/70 uppercase tracking-wide">
            demo
          </span>
        )}
        {dayLabel && (
          <span className="ml-auto text-xs font-medium text-muted">{dayLabel}</span>
        )}
      </div>

      {/* Main content */}
      <div className="relative flex items-center gap-4">
        {/* Avatar */}
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gold-500/20 text-3xl shadow-[0_0_18px_rgba(251,191,36,0.2)]">
          ⚽
        </div>

        {/* Name + stats */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="truncate text-xl font-black text-ink">{potd.username}</span>
            {isYou && (
              <span className="shrink-0 rounded-full bg-brand px-2 py-0.5 text-[10px] font-black text-white tracking-wide">
                YOU
              </span>
            )}
          </div>
          <div className="mt-0.5 text-xs text-muted">
            {Number(potd.day_correct)} correct pick{Number(potd.day_correct) !== 1 ? 's' : ''} today
          </div>
        </div>

        {/* Points earned today */}
        <div className="shrink-0 text-right">
          <div className="text-3xl font-black tabular-nums text-gold-500 leading-none">
            +{Number(potd.day_points)}
          </div>
          <div className="mt-0.5 text-[11px] font-semibold text-gold-600/70 dark:text-gold-400/70">
            pts today
          </div>
        </div>
      </div>

      {/* "That's you!" banner */}
      {isYou && (
        <div className="relative mt-4 rounded-2xl border border-gold-500/30 bg-gold/12 py-2 text-center text-sm font-bold text-gold-600 dark:text-gold-400">
          That's you! 🎉 Amazing prediction day!
        </div>
      )}
    </motion.div>
  )
}

// ─── Streak badge ─────────────────────────────────────────────────────────────

function StreakBadge({ streak }) {
  if (streak < 1) return null
  const hot = streak >= 5
  const warm = streak >= 3
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-black leading-none ${
        hot
          ? 'bg-orange-500/18 text-orange-500 dark:text-orange-400'
          : warm
          ? 'bg-orange-400/14 text-orange-500 dark:text-orange-400'
          : 'bg-orange-400/10 text-orange-400/90'
      }`}
    >
      🔥 ×{streak}
    </span>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Leaderboard() {
  const { username } = useApp()

  const [rows,    setRows]    = useState(() => makeDemoRows(username))
  const [potd,    setPotd]    = useState(!supabaseEnabled ? DEMO_POTD : null)
  const [isLive,  setIsLive]  = useState(false)
  const [loading, setLoading] = useState(supabaseEnabled)

  useEffect(() => {
    if (!supabaseEnabled) return
    Promise.all([fetchLeaderboard(50), fetchPredictorOfDay()]).then(([leaderData, potdData]) => {
      if (leaderData && leaderData.length > 0) {
        const mapped = leaderData.map((r) => ({
          name:    r.username,
          points:  Number(r.total_points),
          correct: Number(r.correct_ct),
          played:  Number(r.played_ct),
          acc:     r.accuracy ?? 0,
          streak:  Number(r.current_streak ?? 0),
          you:     r.username === username,
        }))
        if (!mapped.some((r) => r.you)) {
          mapped.push({ name: username, points: 0, correct: 0, played: 0, acc: 0, streak: 0, you: true })
          mapped.sort((a, b) => b.points - a.points)
        }
        setRows(mapped)
        setIsLive(true)
      }
      setPotd(potdData ?? null)
      setLoading(false)
    })
  }, [username])

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Leaderboard</h1>
          <p className="mt-1 text-sm text-muted">
            {isLive ? 'Live standings · ranked by Beat the Crowd points' : 'Top predictors worldwide'}
          </p>
        </div>
        <BeatTheCrowdLegend />
      </div>

      {/* Predictor of the Day */}
      <PredictorOfDay potd={potd} currentUsername={username} isLive={isLive} />

      <AdSlot label="Ad" />

      {/* Column headers */}
      <div className="flex items-center gap-4 px-5 text-[10px] font-bold uppercase tracking-widest text-muted">
        <div className="w-8 shrink-0 text-center">#</div>
        <div className="flex-1">Player</div>
        <div className="w-20 text-right shrink-0">Points</div>
        <div className="w-16 text-right shrink-0 hidden sm:block">Correct</div>
        <div className="w-14 text-right shrink-0 hidden sm:block">Acc</div>
      </div>

      {/* Table card */}
      <StaggerList className="card overflow-hidden divide-y divide-line/50">
        {rows.map((r, i) => {
          const rank = RANK_STYLES[i] ?? null
          return (
            <StaggerItem
              key={r.name}
              className={`flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-brand/3 dark:hover:bg-white/3 ${
                r.you
                  ? 'bg-brand/6 dark:bg-brand/12 border-l-2 border-brand'
                  : rank?.bg ?? ''
              }`}
            >
              {/* Rank */}
              <div className="w-8 shrink-0 text-center">
                {rank?.icon ? (
                  <span className="flex justify-center">{rank.icon}</span>
                ) : (
                  <span className={`text-sm font-extrabold tabular-nums ${i < 3 ? 'text-brand' : 'text-muted'}`}>
                    {i + 1}
                  </span>
                )}
              </div>

              {/* Name + streak badge */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className={`font-bold truncate ${r.you ? 'text-brand dark:text-brand-300' : 'text-ink'}`}>
                    {r.name}
                  </span>
                  {r.you && (
                    <span className="shrink-0 rounded-full bg-brand px-2 py-0.5 text-[10px] font-black text-white tracking-wide">
                      YOU
                    </span>
                  )}
                  <StreakBadge streak={r.streak} />
                </div>
              </div>

              {/* Points */}
              <div className="w-20 text-right shrink-0">
                <div className={`text-xl font-black tabular-nums ${
                  i === 0 ? 'text-gold-500' : r.you ? 'text-brand' : 'text-ink'
                }`}>
                  {r.points.toLocaleString()}
                </div>
                <div className="text-[10px] font-semibold text-muted">pts</div>
              </div>

              {/* Correct — hidden on mobile */}
              <div className="w-16 text-right shrink-0 hidden sm:block">
                <div className="text-base font-black tabular-nums text-ink">{r.correct}</div>
                <div className="text-[10px] font-semibold text-muted">correct</div>
              </div>

              {/* Accuracy — hidden on mobile */}
              <div className="w-14 text-right shrink-0 hidden sm:block">
                <div className="text-base font-black tabular-nums text-ink">{r.acc}%</div>
                <div className="text-[10px] font-semibold text-muted">acc</div>
              </div>
            </StaggerItem>
          )
        })}
      </StaggerList>

      {/* Status footer */}
      {isLive ? (
        <p className="rounded-2xl border border-green-500/30 bg-green-500/8 dark:bg-green-500/10 px-4 py-3 text-center text-xs font-semibold text-green-600 dark:text-green-400">
          ● Live rankings · updates when matches are settled
        </p>
      ) : (
        <p className="rounded-2xl border border-line/60 bg-elevated px-4 py-3 text-center text-xs text-muted dark:bg-white/3 dark:border-white/8">
          {loading
            ? 'Loading live standings…'
            : 'Demo standings · connect Supabase and run the schema to rank real users'}
        </p>
      )}

    </div>
  )
}
