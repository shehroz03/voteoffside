import { useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Heart } from 'lucide-react'

function PartnerPhoto({ photo, name }) {
  const [failed, setFailed] = useState(false)
  const initials = name ? name.split(' ').map(w => w[0]).slice(0, 2).join('') : '?'
  if (!photo || failed) {
    return (
      <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-500/25 to-purple-500/25 text-2xl font-black text-pink-400 ring-2 ring-pink-500/20">
        {initials}
      </div>
    )
  }
  return (
    <img
      src={photo}
      alt={name}
      onError={() => setFailed(true)}
      referrerPolicy="no-referrer"
      className="h-24 w-24 shrink-0 rounded-2xl object-cover ring-2 ring-pink-500/30"
    />
  )
}

export default function PersonalLifeModal({ life, playerName, onClose }) {
  return createPortal(
    <AnimatePresence>
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div
          key="modal"
          initial={{ opacity: 0, scale: 0.94, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          onClick={e => e.stopPropagation()}
          className="relative w-full max-w-lg max-h-[88vh] overflow-y-auto rounded-3xl border border-pink-500/20 bg-[#0d1526] shadow-2xl"
          style={{ scrollbarWidth: 'thin' }}
        >
          {/* Header */}
          <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-pink-500/15 bg-[#0d1526]/95 backdrop-blur-sm px-6 py-4">
            <div className="flex items-center gap-2">
              <Heart size={16} className="text-pink-500 fill-pink-500" />
              <h2 className="text-sm font-black uppercase tracking-wider text-pink-400">Personal Life & Family</h2>
            </div>
            <span className="mr-6 text-xs text-muted font-medium">{playerName}</span>
            <button
              onClick={onClose}
              className="absolute right-4 top-3.5 flex h-8 w-8 items-center justify-center rounded-xl text-muted hover:text-ink hover:bg-white/8 transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          <div className="p-6 space-y-6">

            {/* Partner */}
            {life.partner && (
              <div className="flex items-start gap-4 rounded-2xl border border-pink-500/15 bg-pink-500/5 p-4">
                <PartnerPhoto photo={life.partner.photo} name={life.partner.name} />
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-black text-ink leading-tight">{life.partner.name}</h3>
                  <div className="flex flex-wrap items-center gap-2 mt-1.5">
                    <span className="rounded-full border border-pink-500/25 bg-pink-500/10 px-2.5 py-0.5 text-[11px] font-bold text-pink-400">
                      {life.partner.role}
                    </span>
                    {life.partner.since && life.partner.since !== '—' && (
                      <span className="text-[11px] text-muted">❤️ Since {life.partner.since}</span>
                    )}
                  </div>
                  {life.partner.note && (
                    <p className="mt-2 text-xs text-muted leading-relaxed">{life.partner.note}</p>
                  )}
                </div>
              </div>
            )}

            {/* Marriage */}
            {life.marriages && life.marriages.some(m => m.date !== '—') && (
              <div>
                <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-muted">💍 Marriage</p>
                {life.marriages.map((m, i) => (
                  <div key={i} className="flex flex-wrap items-center gap-3 rounded-xl border border-line/40 bg-elevated/30 px-4 py-3 dark:border-white/8">
                    <span className="font-bold text-sm text-ink">{m.name}</span>
                    {m.date !== '—' && <span className="text-xs text-muted">📅 {m.date}</span>}
                    {m.place !== '—' && <span className="text-xs text-muted">📍 {m.place}</span>}
                    <span className={`ml-auto text-[11px] font-bold rounded-full px-2.5 py-0.5 ${
                      m.status.includes('✅') ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-elevated text-muted border border-line/40'
                    }`}>{m.status}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Children */}
            {life.children && life.children.length > 0 && (
              <div>
                <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-muted">
                  👶 Children ({life.children.length})
                </p>
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                  {life.children.map((child, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex flex-col items-center gap-2 rounded-xl border border-line/40 bg-elevated/30 p-3 dark:border-white/8 hover:border-pink-500/20 transition-colors"
                    >
                      {child.photo ? (
                        <img src={child.photo} alt={child.name} className="h-14 w-14 rounded-full object-cover ring-2 ring-pink-500/10" referrerPolicy="no-referrer" onError={(e) => { e.target.style.display='none'; e.target.nextSibling.style.display='flex' }} />
                      ) : null}
                      <div className={`flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-pink-500/15 to-purple-500/15 text-3xl ring-2 ring-pink-500/10 ${child.photo ? 'hidden' : ''}`}>
                        {child.emoji}
                      </div>
                      <div className="text-center w-full">
                        <div className="text-xs font-bold text-ink leading-tight">{child.name}</div>
                        <div className="text-[10px] text-muted mt-0.5">Born {child.born}</div>
                        <div className="text-[10px] text-muted/60 mt-0.5 truncate">w/ {child.with}</div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {life.children?.length === 0 && (
              <p className="rounded-xl border border-dashed border-line/50 py-4 text-center text-xs text-muted">
                No children publicly known
              </p>
            )}

            {/* Relationship History */}
            {life.relationshipHistory && life.relationshipHistory.length > 0 && (
              <div>
                <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-muted">
                  💔 Relationship History
                </p>
                <div className="space-y-2">
                  {life.relationshipHistory.map((r, i) => (
                    <div key={i} className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-white/4 transition-colors">
                      {r.photo ? (
                        <img src={r.photo} alt={r.name} referrerPolicy="no-referrer" onError={e => { e.target.style.display='none'; e.target.nextSibling.style.display='flex' }}
                          className="h-9 w-9 shrink-0 rounded-full object-cover ring-1 ring-white/15" />
                      ) : null}
                      <div className={`h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/8 text-xs font-bold text-muted ring-1 ring-white/10 ${r.photo ? 'hidden' : 'flex'}`}>
                        {r.name.split(' ').map(w=>w[0]).slice(0,2).join('')}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-semibold text-ink">{r.name}</span>
                        <div className="text-[10px] text-muted">{r.years}</div>
                      </div>
                      <span className={`shrink-0 text-[11px] font-bold rounded-full px-2.5 py-0.5 ${
                        r.status.includes('Current') || r.status.includes('Wife')
                          ? 'bg-pink-500/10 text-pink-400 border border-pink-500/20'
                          : 'bg-white/5 text-muted'
                      }`}>{r.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  )
}
