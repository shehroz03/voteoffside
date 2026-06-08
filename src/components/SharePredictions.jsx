import { useRef, useState } from 'react'
import { toPng } from 'html-to-image'
import { Share2, Download, X, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useApp } from '../context/AppContext.jsx'
import { getTeam, flag } from '../lib/teams.js'

// ─── Inline-style constants (safe for html-to-image capture) ─────────────────

const CARD_W = 600
const CARD_H = 600

const s = {
  card: {
    width: CARD_W,
    height: CARD_H,
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 24,
    background: 'linear-gradient(150deg, #05101f 0%, #0b1c4e 38%, #1234a0 68%, #081330 100%)',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    color: '#fff',
    display: 'flex',
    flexDirection: 'column',
  },
  // Decorative layers
  dotGrid: {
    position: 'absolute', inset: 0, opacity: 0.09,
    backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.95) 1px, transparent 0)',
    backgroundSize: '20px 20px',
  },
  orbTopRight: {
    position: 'absolute', top: -80, right: -80,
    width: 320, height: 320, borderRadius: '50%',
    background: 'rgba(96,141,250,0.22)', filter: 'blur(72px)',
  },
  orbBottomLeft: {
    position: 'absolute', bottom: -70, left: -70,
    width: 340, height: 340, borderRadius: '50%',
    background: 'rgba(245,158,11,0.18)', filter: 'blur(80px)',
  },
  // Gold top stripe
  topStripe: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 3,
    background: 'linear-gradient(90deg, transparent 0%, #f59e0b 30%, #fbbf24 50%, #f59e0b 70%, transparent 100%)',
  },
  // Content wrapper
  content: {
    position: 'relative',
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    padding: '28px 32px 24px',
  },
  // Header row
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 22,
  },
  logoRow: { display: 'flex', alignItems: 'center', gap: 10 },
  logoIcon: {
    width: 36, height: 36, borderRadius: 10,
    background: 'linear-gradient(135deg, #3b6bf6 0%, #1a56db 100%)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 18, flexShrink: 0,
  },
  logoText: { fontSize: 22, fontWeight: 900, letterSpacing: '-0.02em', lineHeight: 1 },
  wcBadge: {
    background: 'rgba(245,158,11,0.18)',
    border: '1px solid rgba(245,158,11,0.45)',
    borderRadius: 20, padding: '4px 12px',
    fontSize: 11, fontWeight: 700, letterSpacing: '0.09em',
    textTransform: 'uppercase', color: '#fbbf24',
    display: 'flex', alignItems: 'center', gap: 5,
  },
  // User block
  username: { fontSize: 28, fontWeight: 900, letterSpacing: '-0.025em', lineHeight: 1.08, marginBottom: 4 },
  userSub: { fontSize: 13, color: 'rgba(255,255,255,0.55)', fontWeight: 500, marginBottom: 18 },
  // Progress
  progRow: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.5)', marginBottom: 7,
  },
  progTrack: {
    height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.1)',
    overflow: 'hidden', marginBottom: 20,
  },
  progFill: (pct) => ({
    height: '100%', borderRadius: 3, width: `${pct}%`,
    background: 'linear-gradient(90deg, #3b6bf6 0%, #f59e0b 100%)',
  }),
  // Section label
  sectionLabel: {
    fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.38)', marginBottom: 8,
  },
  // Fav teams
  favRow: { display: 'flex', gap: 7, flexWrap: 'wrap', marginBottom: 18 },
  favChip: {
    background: 'rgba(255,255,255,0.09)', borderRadius: 8, padding: '5px 10px',
    display: 'flex', alignItems: 'center', gap: 6,
    fontSize: 12, fontWeight: 700,
  },
  // Picks
  picksList: { display: 'flex', flexDirection: 'column', gap: 5, flex: 1 },
  pickRow: {
    display: 'flex', alignItems: 'center',
    background: 'rgba(255,255,255,0.055)', borderRadius: 10,
    padding: '7px 11px', gap: 6,
  },
  pickSide: (picked) => ({
    display: 'flex', alignItems: 'center', gap: 6, flex: 1,
    color: picked ? '#fbbf24' : 'rgba(255,255,255,0.52)',
    fontWeight: picked ? 800 : 500,
  }),
  pickSideRight: (picked) => ({
    display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
    gap: 6, flex: 1,
    color: picked ? '#fbbf24' : 'rgba(255,255,255,0.52)',
    fontWeight: picked ? 800 : 500,
  }),
  pickName: { fontSize: 12, lineHeight: 1 },
  pickEmoji: { fontSize: 16, lineHeight: 1 },
  pickBadge: {
    fontSize: 9, fontWeight: 800, letterSpacing: '0.05em',
    background: 'rgba(245,158,11,0.22)', color: '#fbbf24',
    borderRadius: 4, padding: '2px 5px',
  },
  pickVs: {
    fontSize: 10, color: 'rgba(255,255,255,0.25)', fontWeight: 700,
    padding: '0 4px', flexShrink: 0,
  },
  // Empty state
  empty: {
    flex: 1, display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', gap: 10,
  },
  emptyIcon: { fontSize: 44, lineHeight: 1 },
  emptyTitle: { fontSize: 15, fontWeight: 700, color: 'rgba(255,255,255,0.65)' },
  emptyHint: { fontSize: 12, color: 'rgba(255,255,255,0.38)', textAlign: 'center' },
  // Footer
  footer: {
    marginTop: 14, paddingTop: 12,
    borderTop: '1px solid rgba(255,255,255,0.09)',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    flexShrink: 0,
  },
  footerLeft: { fontSize: 11, color: 'rgba(255,255,255,0.35)', fontWeight: 600, letterSpacing: '0.02em' },
  footerRight: { fontSize: 11, color: 'rgba(255,255,255,0.35)', fontWeight: 600 },
}

// ─── Off-screen card captured by html-to-image ───────────────────────────────

function ShareCardTemplate({ cardRef, username, votes, matches, favorites }) {
  const predicted = Object.keys(votes).length
  const total     = matches.length
  const pct       = total ? Math.round((predicted / total) * 100) : 0
  const picks     = matches.filter((m) => votes[m.id]).slice(0, 6)
  const favTeams  = (favorites?.teams ?? []).slice(0, 5)

  return (
    <div style={s.card} ref={cardRef}>
      {/* Decorative layers */}
      <div style={s.dotGrid} />
      <div style={s.orbTopRight} />
      <div style={s.orbBottomLeft} />
      <div style={s.topStripe} />

      {/* Content */}
      <div style={s.content}>

        {/* Header */}
        <div style={s.header}>
          <div style={s.logoRow}>
            <div style={s.logoIcon}>⚽</div>
            <span style={s.logoText}>VoteOffside</span>
          </div>
          <div style={s.wcBadge}>
            <span>🏆</span>
            <span>WC 2026</span>
          </div>
        </div>

        {/* Username */}
        <div style={s.username}>{username}</div>
        <div style={s.userSub}>World Cup 2026 Predictions</div>

        {/* Progress */}
        <div style={s.progRow}>
          <span>Predictions</span>
          <span>{predicted} / {total} · {pct}%</span>
        </div>
        <div style={s.progTrack}>
          <div style={s.progFill(pct)} />
        </div>

        {/* Favourite teams */}
        {favTeams.length > 0 && (
          <>
            <div style={s.sectionLabel}>Favourites</div>
            <div style={s.favRow}>
              {favTeams.map((code) => (
                <div key={code} style={s.favChip}>
                  <span style={{ fontSize: 18 }}>{flag(code)}</span>
                  <span>{getTeam(code).name}</span>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Picks */}
        {picks.length > 0 ? (
          <>
            <div style={s.sectionLabel}>My picks</div>
            <div style={s.picksList}>
              {picks.map((m) => {
                const pickedHome = votes[m.id] === m.home
                const home = getTeam(m.home)
                const away = getTeam(m.away)
                return (
                  <div key={m.id} style={s.pickRow}>
                    {/* Home */}
                    <div style={s.pickSide(pickedHome)}>
                      <span style={s.pickEmoji}>{flag(m.home)}</span>
                      <span style={s.pickName}>{home.name}</span>
                      {pickedHome && <span style={s.pickBadge}>✓ PICK</span>}
                    </div>
                    {/* VS */}
                    <span style={s.pickVs}>VS</span>
                    {/* Away */}
                    <div style={s.pickSideRight(!pickedHome)}>
                      {!pickedHome && <span style={s.pickBadge}>✓ PICK</span>}
                      <span style={s.pickName}>{away.name}</span>
                      <span style={s.pickEmoji}>{flag(m.away)}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        ) : (
          <div style={s.empty}>
            <div style={s.emptyIcon}>⚽</div>
            <div style={s.emptyTitle}>No predictions yet</div>
            <div style={s.emptyHint}>Head to Predictions to make your picks!</div>
          </div>
        )}

        {/* Footer */}
        <div style={s.footer}>
          <span style={s.footerLeft}>voteoffside.com</span>
          <span style={s.footerRight}>Make your predictions →</span>
        </div>

      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

/**
 * compact=false  → full banner card (used on Home page)
 * compact=true   → small inline button (used on Predictions page)
 */
export default function SharePredictions({ compact = false }) {
  const { username, votes, matches, favorites } = useApp()
  const cardRef    = useRef(null)
  const [status,   setStatus]   = useState('idle')   // idle | busy | error
  const [imageUrl, setImageUrl] = useState(null)
  const [open,     setOpen]     = useState(false)
  const predicted = Object.keys(votes).length

  async function generate() {
    if (!cardRef.current || status === 'busy') return
    setStatus('busy')
    try {
      const dataUrl = await toPng(cardRef.current, {
        pixelRatio: 2,
        cacheBust: true,
        width:  CARD_W,
        height: CARD_H,
      })
      setImageUrl(dataUrl)
      setOpen(true)
      setStatus('idle')
    } catch (err) {
      console.error('SharePredictions: capture failed', err)
      setStatus('error')
      setTimeout(() => setStatus('idle'), 2500)
    }
  }

  async function handleShare() {
    if (!imageUrl) return
    // Try native share sheet (mobile)
    try {
      const res  = await fetch(imageUrl)
      const blob = await res.blob()
      const file = new File([blob], 'my-wc2026-predictions.png', { type: 'image/png' })
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: 'My World Cup 2026 Predictions',
          text: `I've predicted ${predicted}/${matches.length} World Cup 2026 matches on VoteOffside! 🏆`,
          files: [file],
        })
        return
      }
    } catch (err) {
      if (err?.name === 'AbortError') return  // user cancelled
    }
    // Fallback: download
    handleDownload()
  }

  function handleDownload() {
    if (!imageUrl) return
    const a = document.createElement('a')
    a.href     = imageUrl
    a.download = 'my-wc2026-predictions.png'
    a.click()
  }

  function closeModal() {
    setOpen(false)
    // keep imageUrl cached so re-open is instant
  }

  const busy      = status === 'busy'
  const hasError  = status === 'error'
  const canShare  = predicted > 0

  return (
    <>
      {/* ── Off-screen card (always in DOM so html-to-image can capture it) ── */}
      <div
        aria-hidden="true"
        style={{ position: 'fixed', top: -9999, left: -9999, zIndex: -1 }}
      >
        <ShareCardTemplate
          cardRef={cardRef}
          username={username}
          votes={votes}
          matches={matches}
          favorites={favorites}
        />
      </div>

      {/* ── Trigger ─────────────────────────────────────────────────────────── */}
      {compact ? (
        /* Small button — used on Predictions page */
        <button
          onClick={generate}
          disabled={busy || !canShare}
          className="inline-flex items-center gap-2 rounded-xl border border-brand/30 bg-brand/8 px-4 py-2 text-sm font-bold text-brand transition-colors hover:bg-brand/14 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-brand/12 dark:hover:bg-brand/20"
        >
          {busy
            ? <Loader2 size={15} className="animate-spin" />
            : <Share2 size={15} />
          }
          {hasError ? 'Failed — retry?' : busy ? 'Generating…' : 'Share picks'}
        </button>
      ) : (
        /* Banner card — used on Home page */
        <div className="card flex items-center justify-between gap-4 p-5">
          <div className="min-w-0">
            <p className="font-extrabold leading-tight tracking-tight">Share your predictions</p>
            <p className="mt-0.5 text-sm text-muted">
              {canShare
                ? `${predicted} pick${predicted !== 1 ? 's' : ''} ready — generate a shareable card`
                : 'Make some predictions first, then share your card'}
            </p>
          </div>
          <button
            onClick={generate}
            disabled={busy || !canShare}
            className="shrink-0 inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-black text-white shadow-brand transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {busy
              ? <Loader2 size={15} className="animate-spin" />
              : <Share2 size={15} />
            }
            {hasError ? 'Failed' : busy ? 'Generating…' : 'Share'}
          </button>
        </div>
      )}

      {/* ── Modal (bottom sheet) ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {open && imageUrl && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={closeModal}
            />

            {/* Sheet */}
            <motion.div
              key="sheet"
              className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-md rounded-t-3xl bg-surface px-5 pb-10 pt-5 shadow-pop"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 34 }}
            >
              {/* Drag handle */}
              <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-line/70" />

              {/* Header */}
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-extrabold tracking-tight">Your predictions card</h3>
                <button
                  onClick={closeModal}
                  className="rounded-full p-1.5 text-muted transition-colors hover:bg-elevated"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Card preview */}
              <div className="mb-5 mx-auto max-w-[280px]">
                <img
                  src={imageUrl}
                  alt="Your predictions card preview"
                  className="w-full rounded-2xl border border-line/50 shadow-pop"
                />
              </div>

              {/* Action buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleShare}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand py-3 text-sm font-black text-white shadow-brand transition-colors hover:bg-brand-700"
                >
                  <Share2 size={15} />
                  Share
                </button>
                <button
                  onClick={handleDownload}
                  className="flex items-center justify-center gap-2 rounded-xl border border-line bg-elevated px-5 py-3 text-sm font-bold transition-colors hover:bg-line/30"
                >
                  <Download size={15} />
                  Save PNG
                </button>
              </div>

              {/* Hint */}
              <p className="mt-3 text-center text-[11px] text-muted">
                1200 × 1200 px · perfect for Instagram, X, WhatsApp
              </p>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
