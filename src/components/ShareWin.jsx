import { useRef, useState, useEffect } from 'react'
import { toPng } from 'html-to-image'
import { Share2, Download, X, Loader2, Trophy, Check } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useApp } from '../context/AppContext.jsx'
import { getTeam, flag } from '../lib/teams.js'
import { teamGradient, teamAccent } from '../lib/teamColors.js'

// Story format (9:16) — 540×960 base, captured at 2× → 1080×1920
const CARD_W = 540
const CARD_H = 960

// ─── Style presets (He / She) ────────────────────────────────────────────────
// Each preset re-skins the same data with its own mood, typography & motifs.

const PRESETS = {
  he: {
    label: 'He',
    icon: '🔥',
    overlay: 'radial-gradient(circle at 80% 0%, rgba(59,130,246,0.35) 0%, transparent 55%)',
    tag: { bg: 'rgba(34,197,94,0.16)', border: 'rgba(34,197,94,0.55)', color: '#4ade80' },
    tagText: '🎯 I CALLED IT',
    nameStyle: { fontStyle: 'italic', textTransform: 'uppercase', letterSpacing: '-0.02em' },
    motif: 'bolt',     // electric bolts in corners
    ctaGrad: 'linear-gradient(135deg, #1a56db 0%, #3b6bf6 100%)',
  },
  she: {
    label: 'She',
    icon: '✨',
    overlay: 'radial-gradient(circle at 20% 5%, rgba(244,114,182,0.40) 0%, transparent 55%), radial-gradient(circle at 90% 90%, rgba(251,191,36,0.30) 0%, transparent 50%)',
    tag: { bg: 'rgba(244,114,182,0.18)', border: 'rgba(244,114,182,0.6)', color: '#f9a8d4' },
    tagText: '✨ I CALLED IT',
    nameStyle: { fontStyle: 'normal', textTransform: 'none', letterSpacing: '-0.02em' },
    motif: 'sparkle',  // sparkles scattered
    ctaGrad: 'linear-gradient(135deg, #db2777 0%, #f472b6 100%)',
  },
}

// ─── Accent options (default = team colours) ─────────────────────────────────

const ACCENTS = [
  { key: 'team',    label: 'Team',    swatch: null },
  { key: 'gold',    label: 'Gold',    swatch: '#f59e0b', grad: 'linear-gradient(165deg, #3a2a05 0%, #b45309 55%, #1a1203 100%)' },
  { key: 'rose',    label: 'Rose',    swatch: '#f472b6', grad: 'linear-gradient(165deg, #3a0a23 0%, #be185d 55%, #1a0411 100%)' },
  { key: 'emerald', label: 'Emerald', swatch: '#10b981', grad: 'linear-gradient(165deg, #052e22 0%, #047857 55%, #021a13 100%)' },
  { key: 'night',   label: 'Night',   swatch: '#3b6bf6', grad: 'linear-gradient(165deg, #04122e 0%, #1234a0 60%, #050c20 100%)' },
]

// Decorative confetti (baked into image)
const CONFETTI = Array.from({ length: 28 }, (_, i) => {
  const colors = ['#fbbf24', '#3b6bf6', '#4ade80', '#ffffff', '#f472b6', '#60a5fa']
  return {
    left: `${(i * 37) % 100}%`, top: `${(i * 53) % 76 + 6}%`,
    size: 5 + (i % 4) * 2, color: colors[i % colors.length], rot: (i * 41) % 360,
  }
})

const SPARKLES = ['✨', '⭐', '💫']

// ─── The card (also the capture target) ──────────────────────────────────────

function WinCard({ cardRef, team, opp, teamScore, oppScore, username, presetKey, accentKey, caption }) {
  const preset = PRESETS[presetKey]
  const accentObj = ACCENTS.find((a) => a.key === accentKey) || ACCENTS[0]
  const baseGrad = accentKey === 'team' ? teamGradient(team.code) : accentObj.grad
  const accentColor = accentKey === 'team' ? teamAccent(team.code) : accentObj.swatch

  return (
    <div ref={cardRef} style={{
      width: CARD_W, height: CARD_H, position: 'relative', overflow: 'hidden',
      background: baseGrad,
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      color: '#fff', display: 'flex', flexDirection: 'column',
    }}>
      {/* mood overlay */}
      <div style={{ position: 'absolute', inset: 0, background: preset.overlay }} />
      {/* dot grid */}
      <div style={{ position: 'absolute', inset: 0, opacity: 0.08,
        backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.95) 1px, transparent 0)',
        backgroundSize: '26px 26px' }} />
      {/* glow orbs tinted by accent */}
      <div style={{ position: 'absolute', top: -110, right: -90, width: 360, height: 360, borderRadius: '50%', background: accentColor, opacity: 0.28, filter: 'blur(95px)' }} />
      <div style={{ position: 'absolute', bottom: -120, left: -100, width: 380, height: 380, borderRadius: '50%', background: accentColor, opacity: 0.22, filter: 'blur(105px)' }} />
      {/* top stripe */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 5,
        background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)` }} />

      {/* motif decorations */}
      {preset.motif === 'sparkle' && SPARKLES.concat(SPARKLES).map((sp, i) => (
        <div key={i} style={{ position: 'absolute', left: `${(i * 29) % 92 + 4}%`, top: `${(i * roamY(i)) % 80 + 8}%`, fontSize: 18 + (i % 3) * 8, opacity: 0.85 }}>{sp}</div>
      ))}
      {CONFETTI.map((c, i) => (
        <div key={i} style={{ position: 'absolute', left: c.left, top: c.top, width: c.size, height: c.size * 1.6,
          background: c.color, borderRadius: 2, transform: `rotate(${c.rot}deg)`, opacity: 0.8 }} />
      ))}

      {/* content */}
      <div style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column', padding: '40px 38px 34px' }}>
        {/* header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: 'linear-gradient(135deg, #3b6bf6 0%, #1a56db 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 21 }}>⚽</div>
            <span style={{ fontSize: 25, fontWeight: 900, letterSpacing: '-0.02em' }}>VoteOffside</span>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.25)', borderRadius: 22, padding: '6px 14px', fontSize: 12, fontWeight: 800, letterSpacing: '0.09em', textTransform: 'uppercase' }}>🏆 WC 2026</div>
        </div>

        {/* hero */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: preset.tag.bg, border: `1px solid ${preset.tag.border}`, color: preset.tag.color, borderRadius: 30, padding: '9px 20px', fontSize: 16, fontWeight: 900, letterSpacing: '0.04em', marginBottom: 26 }}>
            {preset.tagText}
          </div>
          <div style={{ fontSize: 120, lineHeight: 1, marginBottom: 8, filter: 'drop-shadow(0 8px 26px rgba(0,0,0,0.5))' }}>{flag(team.code)}</div>
          <div style={{ fontSize: 15, fontWeight: 800, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.55)', marginBottom: 6 }}>Winner</div>
          <div style={{ fontSize: 46, fontWeight: 900, lineHeight: 1.02, marginBottom: 22, textShadow: '0 4px 30px rgba(0,0,0,0.45)', ...preset.nameStyle }}>{team.name}</div>

          {/* score badge */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 14, background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.18)', borderRadius: 18, padding: '14px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 17, fontWeight: 800 }}>
              <span style={{ fontSize: 22 }}>{flag(team.code)}</span><span>{team.code}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 6px' }}>
              <span style={{ fontSize: 34, fontWeight: 900, lineHeight: 1, color: accentColor }}>{teamScore}</span>
              <span style={{ fontSize: 22, fontWeight: 700, color: 'rgba(255,255,255,0.35)' }}>–</span>
              <span style={{ fontSize: 34, fontWeight: 900, lineHeight: 1, color: 'rgba(255,255,255,0.45)' }}>{oppScore}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 17, fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>
              <span>{opp.code}</span><span style={{ fontSize: 22 }}>{flag(opp.code)}</span>
            </div>
          </div>
          <div style={{ marginTop: 14, fontSize: 12, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)' }}>Full time · {opp.name}</div>
        </div>

        {/* caption (editable) */}
        <div style={{ textAlign: 'center', fontSize: 17, fontWeight: 700, color: 'rgba(255,255,255,0.72)', marginBottom: 18, lineHeight: 1.3 }}>
          {caption?.trim()
            ? caption
            : <><span style={{ color: accentColor, fontWeight: 900 }}>{username}</span> predicted this win 🔥</>}
        </div>

        {/* CTA */}
        <div style={{ background: preset.ctaGrad, borderRadius: 18, padding: '18px 22px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, boxShadow: '0 10px 30px rgba(0,0,0,0.35)' }}>
          <div style={{ fontSize: 19, fontWeight: 900, letterSpacing: '-0.01em' }}>Think you can beat me?</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.9)' }}>Predict free at voteoffside.com →</div>
        </div>
      </div>
    </div>
  )
}

// pseudo-random vertical spread for sparkles
function roamY(i) { return 17 + (i * 7) % 23 }

// ─── Editor modal + trigger ──────────────────────────────────────────────────

export default function ShareWin({ match, userPick }) {
  const { username } = useApp()
  const cardRef = useRef(null)
  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState('idle')

  // Persisted preferences
  const [presetKey, setPresetKey] = useState(() => localStorage.getItem('vo_card_style') || 'he')
  const [accentKey, setAccentKey] = useState(() => localStorage.getItem('vo_card_accent') || 'team')
  const [caption, setCaption] = useState('')

  useEffect(() => { localStorage.setItem('vo_card_style', presetKey) }, [presetKey])
  useEffect(() => { localStorage.setItem('vo_card_accent', accentKey) }, [accentKey])

  // ── Winner detection (must run before any early return guards below) ──
  if (match?.status !== 'finished' || !match.score) return null
  const { home: hg, away: ag } = match.score
  if (hg === ag) return null
  const winnerCode = hg > ag ? match.home : match.away
  if (userPick !== winnerCode) return null

  const team = getTeam(winnerCode)
  const oppCode = winnerCode === match.home ? match.away : match.home
  const opp = getTeam(oppCode)
  const teamScore = winnerCode === match.home ? hg : ag
  const oppScore = winnerCode === match.home ? ag : hg

  async function capture() {
    if (!cardRef.current) return null
    return toPng(cardRef.current, { pixelRatio: 2, cacheBust: true, width: CARD_W, height: CARD_H })
  }

  async function handleShare() {
    if (status === 'busy') return
    setStatus('busy')
    try {
      const dataUrl = await capture()
      const res = await fetch(dataUrl)
      const blob = await res.blob()
      const file = new File([blob], `${team.code}-win.png`, { type: 'image/png' })
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: 'I called it! 🎯',
          text: `I predicted ${team.name} to win on VoteOffside! 🏆 Think you can beat me? voteoffside.com`,
          files: [file],
        })
      } else {
        downloadUrl(dataUrl)
      }
      setStatus('idle')
    } catch (err) {
      if (err?.name === 'AbortError') { setStatus('idle'); return }
      console.error('ShareWin share failed', err)
      setStatus('idle')
    }
  }

  async function handleDownload() {
    if (status === 'busy') return
    setStatus('busy')
    try {
      const dataUrl = await capture()
      downloadUrl(dataUrl)
    } catch (err) {
      console.error('ShareWin download failed', err)
    }
    setStatus('idle')
  }

  function downloadUrl(dataUrl) {
    const a = document.createElement('a')
    a.href = dataUrl
    a.download = `${team.code}-win-voteoffside.png`
    a.click()
  }

  const busy = status === 'busy'
  // preview scale: card is 540 wide, fit into ~232px
  const previewScale = 232 / CARD_W

  return (
    <>
      {/* Pulsing trigger */}
      <motion.button
        onClick={() => setOpen(true)}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        whileTap={{ scale: 0.96 }}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 px-4 py-2.5 text-sm font-black text-white shadow-lg shadow-green-500/30"
      >
        <motion.span
          animate={{ scale: [1, 1.12, 1] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
          className="flex items-center gap-2"
        >
          <Trophy size={15} /> 🎉 You called it — Share your win
        </motion.span>
      </motion.button>

      {/* Editor modal */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              key="backdrop"
              className="fixed inset-0 z-40 bg-black/75 backdrop-blur-sm"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }} onClick={() => !busy && setOpen(false)}
            />
            <motion.div
              key="sheet"
              className="fixed inset-x-0 bottom-0 z-50 mx-auto max-h-[94vh] max-w-md overflow-y-auto rounded-t-3xl bg-surface px-5 pb-8 pt-4 shadow-pop"
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 34 }}
            >
              <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-line/70" />
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-lg font-extrabold tracking-tight">🎉 Design your win card</h3>
                <button onClick={() => !busy && setOpen(false)} className="rounded-full p-1.5 text-muted hover:bg-elevated">
                  <X size={18} />
                </button>
              </div>

              {/* Live preview */}
              <div className="mb-4 flex justify-center">
                <div style={{ width: CARD_W * previewScale, height: CARD_H * previewScale, position: 'relative' }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, transform: `scale(${previewScale})`, transformOrigin: 'top left' }}>
                    <WinCard
                      cardRef={cardRef} team={team} opp={opp}
                      teamScore={teamScore} oppScore={oppScore} username={username}
                      presetKey={presetKey} accentKey={accentKey} caption={caption}
                    />
                  </div>
                </div>
              </div>

              {/* ── Controls ── */}
              {/* Style: He / She */}
              <p className="mb-1.5 text-[11px] font-black uppercase tracking-widest text-muted">Card style</p>
              <div className="mb-3 grid grid-cols-2 gap-2">
                {Object.entries(PRESETS).map(([key, p]) => (
                  <button
                    key={key}
                    onClick={() => setPresetKey(key)}
                    className={`flex items-center justify-center gap-2 rounded-xl border-2 px-4 py-2.5 text-sm font-black transition-colors ${
                      presetKey === key
                        ? 'border-brand bg-brand/10 text-brand dark:text-brand-300'
                        : 'border-line/60 text-muted hover:border-brand/40 dark:border-white/10'
                    }`}
                  >
                    <span className="text-base">{p.icon}</span> {p.label}
                    {presetKey === key && <Check size={14} />}
                  </button>
                ))}
              </div>

              {/* Accent colour */}
              <p className="mb-1.5 text-[11px] font-black uppercase tracking-widest text-muted">Background</p>
              <div className="mb-3 flex flex-wrap gap-2">
                {ACCENTS.map((a) => (
                  <button
                    key={a.key}
                    onClick={() => setAccentKey(a.key)}
                    className={`flex items-center gap-1.5 rounded-full border-2 px-3 py-1.5 text-xs font-bold transition-colors ${
                      accentKey === a.key
                        ? 'border-brand text-ink'
                        : 'border-line/60 text-muted hover:border-brand/40 dark:border-white/10'
                    }`}
                  >
                    <span
                      className="h-3.5 w-3.5 rounded-full border border-white/30"
                      style={{ background: a.key === 'team' ? teamGradient(team.code, 135) : a.swatch }}
                    />
                    {a.label}
                  </button>
                ))}
              </div>

              {/* Custom caption */}
              <p className="mb-1.5 text-[11px] font-black uppercase tracking-widest text-muted">Your message <span className="font-medium normal-case text-muted/60">(optional)</span></p>
              <input
                type="text"
                value={caption}
                maxLength={60}
                onChange={(e) => setCaption(e.target.value)}
                placeholder={`${username} predicted this win 🔥`}
                className="mb-4 w-full rounded-xl border border-line/60 bg-elevated px-4 py-2.5 text-sm font-semibold text-ink outline-none focus:border-brand dark:border-white/10 dark:bg-white/5"
              />

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={handleShare} disabled={busy}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand py-3 text-sm font-black text-white shadow-brand hover:bg-brand-700 disabled:opacity-60"
                >
                  {busy ? <Loader2 size={15} className="animate-spin" /> : <Share2 size={15} />}
                  {busy ? 'Creating…' : 'Share to status'}
                </button>
                <button
                  onClick={handleDownload} disabled={busy}
                  className="flex items-center justify-center gap-2 rounded-xl border border-line bg-elevated px-5 py-3 text-sm font-bold hover:bg-line/30 disabled:opacity-60"
                >
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
