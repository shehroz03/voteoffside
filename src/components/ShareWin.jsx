import { useRef, useState } from 'react'
import { toPng } from 'html-to-image'
import { Share2, Download, X, Loader2, Trophy } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useApp } from '../context/AppContext.jsx'
import { getTeam, flag } from '../lib/teams.js'

// Story format (9:16) — 540×960 base, captured at 2× → 1080×1920
const CARD_W = 540
const CARD_H = 960

// ─── Win-card inline styles (html-to-image safe) ─────────────────────────────

const s = {
  card: {
    width: CARD_W, height: CARD_H, position: 'relative', overflow: 'hidden',
    background: 'linear-gradient(165deg, #04122e 0%, #0a2272 42%, #1234a0 70%, #050c20 100%)',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    color: '#fff', display: 'flex', flexDirection: 'column',
  },
  dotGrid: {
    position: 'absolute', inset: 0, opacity: 0.08,
    backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.95) 1px, transparent 0)',
    backgroundSize: '26px 26px',
  },
  orbGold:  { position: 'absolute', top: -110, right: -90, width: 380, height: 380, borderRadius: '50%', background: 'rgba(245,158,11,0.30)', filter: 'blur(90px)' },
  orbBlue:  { position: 'absolute', bottom: -120, left: -100, width: 400, height: 400, borderRadius: '50%', background: 'rgba(59,130,246,0.30)', filter: 'blur(100px)' },
  topStripe: { position: 'absolute', top: 0, left: 0, right: 0, height: 5, background: 'linear-gradient(90deg, #f59e0b 0%, #fbbf24 50%, #f59e0b 100%)' },

  content: { position: 'relative', flex: 1, display: 'flex', flexDirection: 'column', padding: '40px 38px 34px' },

  // Header
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  logoRow: { display: 'flex', alignItems: 'center', gap: 11 },
  logoIcon: { width: 42, height: 42, borderRadius: 12, background: 'linear-gradient(135deg, #3b6bf6 0%, #1a56db 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 21 },
  logoText: { fontSize: 25, fontWeight: 900, letterSpacing: '-0.02em' },
  wcBadge: { background: 'rgba(245,158,11,0.18)', border: '1px solid rgba(245,158,11,0.5)', borderRadius: 22, padding: '6px 14px', fontSize: 12, fontWeight: 800, letterSpacing: '0.09em', textTransform: 'uppercase', color: '#fbbf24' },

  // Hero
  hero: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' },
  calledTag: { display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(34,197,94,0.16)', border: '1px solid rgba(34,197,94,0.5)', color: '#4ade80', borderRadius: 30, padding: '8px 18px', fontSize: 15, fontWeight: 900, letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 26 },
  bigFlag: { fontSize: 120, lineHeight: 1, marginBottom: 8, filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.45))' },
  winnerLabel: { fontSize: 15, fontWeight: 800, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', marginBottom: 6 },
  teamName: { fontSize: 46, fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1.02, marginBottom: 22, textShadow: '0 4px 30px rgba(0,0,0,0.4)' },

  // Score badge
  scoreBadge: { display: 'inline-flex', alignItems: 'center', gap: 14, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.16)', borderRadius: 18, padding: '14px 24px' },
  scoreSide: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 17, fontWeight: 800 },
  scoreSideDim: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 17, fontWeight: 700, color: 'rgba(255,255,255,0.45)' },
  scoreNums: { display: 'flex', alignItems: 'center', gap: 8, padding: '0 6px' },
  scoreNum: { fontSize: 34, fontWeight: 900, lineHeight: 1 },
  scoreNumDim: { fontSize: 34, fontWeight: 900, lineHeight: 1, color: 'rgba(255,255,255,0.45)' },
  scoreDash: { fontSize: 22, fontWeight: 700, color: 'rgba(255,255,255,0.35)' },
  ftTag: { marginTop: 14, fontSize: 12, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)' },

  // Attribution
  attribution: { textAlign: 'center', fontSize: 16, fontWeight: 600, color: 'rgba(255,255,255,0.62)', marginBottom: 18 },
  attrName: { color: '#fbbf24', fontWeight: 900 },

  // CTA bar
  ctaBar: { background: 'linear-gradient(135deg, #1a56db 0%, #3b6bf6 100%)', borderRadius: 18, padding: '18px 22px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, boxShadow: '0 10px 30px rgba(26,86,219,0.4)' },
  ctaTop: { fontSize: 19, fontWeight: 900, letterSpacing: '-0.01em' },
  ctaBottom: { fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.85)' },
}

// Confetti dots baked into the image
const CONFETTI = Array.from({ length: 26 }, (_, i) => {
  const colors = ['#fbbf24', '#3b6bf6', '#4ade80', '#ffffff', '#f59e0b', '#60a5fa']
  return {
    left: `${(i * 37) % 100}%`,
    top: `${(i * 53) % 70 + 8}%`,
    size: 6 + (i % 4) * 2,
    color: colors[i % colors.length],
    rot: (i * 41) % 360,
  }
})

function WinCardTemplate({ cardRef, team, opp, teamScore, oppScore, username }) {
  return (
    <div style={s.card} ref={cardRef}>
      <div style={s.dotGrid} />
      <div style={s.orbGold} />
      <div style={s.orbBlue} />
      <div style={s.topStripe} />

      {/* confetti */}
      {CONFETTI.map((c, i) => (
        <div key={i} style={{
          position: 'absolute', left: c.left, top: c.top,
          width: c.size, height: c.size * 1.6, background: c.color,
          borderRadius: 2, transform: `rotate(${c.rot}deg)`, opacity: 0.85,
        }} />
      ))}

      <div style={s.content}>
        {/* Header */}
        <div style={s.header}>
          <div style={s.logoRow}>
            <div style={s.logoIcon}>⚽</div>
            <span style={s.logoText}>VoteOffside</span>
          </div>
          <div style={s.wcBadge}>🏆 WC 2026</div>
        </div>

        {/* Hero */}
        <div style={s.hero}>
          <div style={s.calledTag}>🎯 I called it!</div>
          <div style={s.bigFlag}>{flag(team.code)}</div>
          <div style={s.winnerLabel}>Winner</div>
          <div style={s.teamName}>{team.name}</div>

          {/* Score badge */}
          <div style={s.scoreBadge}>
            <div style={s.scoreSide}>
              <span style={{ fontSize: 22 }}>{flag(team.code)}</span>
              <span>{team.code}</span>
            </div>
            <div style={s.scoreNums}>
              <span style={s.scoreNum}>{teamScore}</span>
              <span style={s.scoreDash}>–</span>
              <span style={s.scoreNumDim}>{oppScore}</span>
            </div>
            <div style={s.scoreSideDim}>
              <span>{opp.code}</span>
              <span style={{ fontSize: 22 }}>{flag(opp.code)}</span>
            </div>
          </div>
          <div style={s.ftTag}>Full time · {opp.name}</div>
        </div>

        {/* Attribution */}
        <div style={s.attribution}>
          <span style={s.attrName}>{username}</span> predicted this win 🔥
        </div>

        {/* CTA */}
        <div style={s.ctaBar}>
          <div style={s.ctaTop}>Think you can beat me?</div>
          <div style={s.ctaBottom}>Predict free at voteoffside.com →</div>
        </div>
      </div>
    </div>
  )
}

// ─── Main trigger + modal ─────────────────────────────────────────────────────

export default function ShareWin({ match, userPick }) {
  const { username } = useApp()
  const cardRef = useRef(null)
  const [status, setStatus] = useState('idle')
  const [imageUrl, setImageUrl] = useState(null)
  const [open, setOpen] = useState(false)

  // Determine winner from score
  if (match?.status !== 'finished' || !match.score) return null
  const { home: hg, away: ag } = match.score
  if (hg === ag) return null // draw — nothing to brag about
  const winnerCode = hg > ag ? match.home : match.away
  // Only show when the USER picked the winning team
  if (userPick !== winnerCode) return null

  const team = getTeam(winnerCode)
  const oppCode = winnerCode === match.home ? match.away : match.home
  const opp = getTeam(oppCode)
  const teamScore = winnerCode === match.home ? hg : ag
  const oppScore = winnerCode === match.home ? ag : hg

  async function generate() {
    if (!cardRef.current || status === 'busy') return
    setStatus('busy')
    try {
      const dataUrl = await toPng(cardRef.current, {
        pixelRatio: 2, cacheBust: true, width: CARD_W, height: CARD_H,
      })
      setImageUrl(dataUrl)
      setOpen(true)
      setStatus('idle')
    } catch (err) {
      console.error('ShareWin: capture failed', err)
      setStatus('error')
      setTimeout(() => setStatus('idle'), 2500)
    }
  }

  async function handleShare() {
    if (!imageUrl) return
    try {
      const res = await fetch(imageUrl)
      const blob = await res.blob()
      const file = new File([blob], `${team.code}-win.png`, { type: 'image/png' })
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: 'I called it! 🎯',
          text: `I predicted ${team.name} to win on VoteOffside! 🏆 Think you can beat me? voteoffside.com`,
          files: [file],
        })
        return
      }
    } catch (err) {
      if (err?.name === 'AbortError') return
    }
    handleDownload()
  }

  function handleDownload() {
    if (!imageUrl) return
    const a = document.createElement('a')
    a.href = imageUrl
    a.download = `${team.code}-win-voteoffside.png`
    a.click()
  }

  const busy = status === 'busy'

  return (
    <>
      {/* Off-screen capture target */}
      <div aria-hidden="true" style={{ position: 'fixed', top: -9999, left: -9999, zIndex: -1 }}>
        <WinCardTemplate
          cardRef={cardRef} team={team} opp={opp}
          teamScore={teamScore} oppScore={oppScore} username={username}
        />
      </div>

      {/* Pulsing trigger button */}
      <motion.button
        onClick={generate}
        disabled={busy}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        whileTap={{ scale: 0.96 }}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 px-4 py-2.5 text-sm font-black text-white shadow-lg shadow-green-500/30 disabled:opacity-60"
      >
        <motion.span
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
          className="flex items-center gap-2"
        >
          {busy ? <Loader2 size={15} className="animate-spin" /> : <Trophy size={15} />}
          {busy ? 'Creating…' : '🎉 You called it — Share your win'}
        </motion.span>
      </motion.button>

      {/* Modal */}
      <AnimatePresence>
        {open && imageUrl && (
          <>
            <motion.div
              key="backdrop"
              className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }} onClick={() => setOpen(false)}
            />
            <motion.div
              key="sheet"
              className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-md rounded-t-3xl bg-surface px-5 pb-10 pt-5 shadow-pop"
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 34 }}
            >
              <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-line/70" />
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-extrabold tracking-tight">🎉 Share your win</h3>
                <button onClick={() => setOpen(false)} className="rounded-full p-1.5 text-muted hover:bg-elevated">
                  <X size={18} />
                </button>
              </div>

              <div className="mb-5 mx-auto max-w-[230px]">
                <img src={imageUrl} alt="Your winning card" className="w-full rounded-2xl border border-line/50 shadow-pop" />
              </div>

              <div className="flex gap-3">
                <button onClick={handleShare} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand py-3 text-sm font-black text-white shadow-brand hover:bg-brand-700">
                  <Share2 size={15} /> Share to status
                </button>
                <button onClick={handleDownload} className="flex items-center justify-center gap-2 rounded-xl border border-line bg-elevated px-5 py-3 text-sm font-bold hover:bg-line/30">
                  <Download size={15} /> Save
                </button>
              </div>
              <p className="mt-3 text-center text-[11px] text-muted">1080 × 1920 · perfect for WhatsApp & Instagram story</p>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
