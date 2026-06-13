import { useState, useRef, useEffect } from 'react'
import { NavLink, Link } from 'react-router-dom'
import { Moon, Sun, Trophy, ChevronDown, LogOut, Menu, X } from 'lucide-react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { useTheme } from '../context/ThemeContext.jsx'
import { useApp } from '../context/AppContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useCoins } from '../context/CoinsContext.jsx'
import { supabaseEnabled } from '../lib/supabase.js'
import AuthModal from './AuthModal.jsx'

const LINKS = [
  { to: '/schedule',    label: 'Schedule' },
  { to: '/live',        label: 'Live' },
  { to: '/predictions', label: 'Predict' },
  { to: '/teams',       label: 'Teams' },
  { to: '/players',     label: 'Players' },
  { to: '/compare',     label: 'Compare' },
  { to: '/leaderboard', label: 'Leaderboard' },
]

// ── Avatar ────────────────────────────────────────────────────────────────────

function Avatar({ user }) {
  const initial = (user?.user_metadata?.full_name || user?.email || '?')[0].toUpperCase()
  return (
    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-gradient text-xs font-bold text-white select-none">
      {initial}
    </span>
  )
}

// ── User dropdown ─────────────────────────────────────────────────────────────

function UserDropdown({ user, onSignOut }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const displayName = user?.user_metadata?.full_name || user?.email || ''

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-full border border-line/70 bg-elevated px-2 py-1.5 text-xs font-semibold text-muted hover:text-ink transition-colors dark:bg-white/5 dark:border-white/10 hover:border-brand/30"
      >
        <Avatar user={user} />
        <span className="hidden max-w-[120px] truncate sm:block">{displayName}</span>
        <ChevronDown size={12} className={`transition-transform duration-150 ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -6 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute right-0 top-full mt-2 w-48 rounded-2xl border border-line/60 bg-elevated shadow-xl dark:bg-[#0d1526] dark:border-white/10 py-1.5 z-50 overflow-hidden"
          >
            <div className="px-3.5 py-2.5 border-b border-line/40 dark:border-white/10">
              <p className="text-xs font-semibold text-ink truncate">{displayName}</p>
              {user?.email && <p className="text-[11px] text-muted truncate mt-0.5">{user.email}</p>}
            </div>
            <button
              onClick={() => { setOpen(false); onSignOut() }}
              className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-xs text-muted hover:text-red-400 hover:bg-red-500/5 transition-colors"
            >
              <LogOut size={13} /> Sign out
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Animated coin balance pill ─────────────────────────────────────────────────

function CoinPill({ balance, loading }) {
  const reduced = useReducedMotion()
  const prevRef = useRef(balance)
  const [flashKey, setFlashKey] = useState(0)
  const [flashDir, setFlashDir] = useState(null)

  useEffect(() => {
    if (balance === null || prevRef.current === null) { prevRef.current = balance; return }
    if (balance !== prevRef.current) {
      setFlashDir(balance > prevRef.current ? 'up' : 'down')
      setFlashKey((k) => k + 1)
    }
    prevRef.current = balance
  }, [balance])

  const displayValue = loading && balance === null ? '—' : (balance ?? 0).toLocaleString()

  return (
    <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-yellow-500/40 bg-gradient-to-r from-yellow-500/10 to-amber-500/8 px-3 py-1 text-xs font-bold text-yellow-400 overflow-hidden shadow-[0_1px_6px_rgba(245,158,11,0.12)]">
      🪙
      <motion.span
        key={flashKey}
        initial={flashDir && !reduced ? { opacity: 0.6, y: flashDir === 'up' ? 5 : -5 } : false}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        style={flashDir && !reduced ? { textShadow: '0 0 10px rgba(234,179,8,0.9)' } : {}}
        onAnimationComplete={() => setFlashDir(null)}
      >
        {displayValue}
      </motion.span>
    </span>
  )
}

// ── Mobile drawer ─────────────────────────────────────────────────────────────

function MobileDrawer({ open, onClose, user, onSignIn, onSignOut, dark, toggleTheme, balance, coinsLoading }) {
  const reduced = useReducedMotion()

  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Drawer panel */}
          <motion.div
            initial={!reduced ? { x: '100%' } : { opacity: 0 }}
            animate={!reduced ? { x: 0 } : { opacity: 1 }}
            exit={!reduced ? { x: '100%' } : { opacity: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-72 bg-elevated shadow-2xl dark:bg-[#0b1228] flex flex-col"
          >
            {/* Drawer header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-line/50 dark:border-white/8">
              <Link to="/" onClick={onClose} className="flex items-center gap-2 font-extrabold tracking-tight">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-gradient shadow-brand">
                  <Trophy size={15} className="text-white" />
                </span>
                <span className="text-base">
                  Vote<span className="bg-brand-gradient bg-clip-text text-transparent">Offside</span>
                </span>
              </Link>
              <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-xl border border-line/60 text-muted hover:text-ink transition-colors dark:border-white/10">
                <X size={16} />
              </button>
            </div>

            {/* User info / sign in */}
            {supabaseEnabled && (
              <div className="px-5 py-4 border-b border-line/40 dark:border-white/8">
                {user ? (
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-gradient text-sm font-bold text-white">
                      {(user?.user_metadata?.full_name || user?.email || '?')[0].toUpperCase()}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-ink truncate">
                        {user?.user_metadata?.full_name || user?.email}
                      </p>
                      <div className="mt-0.5 inline-flex items-center gap-1 rounded-full bg-yellow-500/10 border border-yellow-500/30 px-2 py-0.5 text-[11px] font-bold text-yellow-400">
                        🪙 {coinsLoading && balance === null ? '—' : (balance ?? 0).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => { onSignIn(); onClose() }}
                    className="btn-primary w-full py-2.5 text-sm"
                  >
                    Sign in to bet
                  </button>
                )}
              </div>
            )}

            {/* Nav links */}
            <nav className="flex-1 overflow-y-auto px-3 py-3">
              {LINKS.map(({ to, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold mb-0.5 transition-colors ${
                      isActive
                        ? 'bg-brand/10 text-brand dark:bg-brand/15 dark:text-brand-300'
                        : 'text-muted hover:text-ink hover:bg-line/40 dark:hover:bg-white/5'
                    }`
                  }
                >
                  {label}
                </NavLink>
              ))}
            </nav>

            {/* Footer actions */}
            <div className="border-t border-line/40 dark:border-white/8 px-4 py-4 flex items-center justify-between gap-3">
              <button
                onClick={toggleTheme}
                className="flex items-center gap-2 rounded-xl border border-line/60 px-3 py-2 text-xs font-semibold text-muted hover:text-ink transition-colors dark:border-white/10"
              >
                {dark ? <Sun size={14} /> : <Moon size={14} />}
                {dark ? 'Light mode' : 'Dark mode'}
              </button>
              {user && (
                <button
                  onClick={() => { onSignOut(); onClose() }}
                  className="flex items-center gap-2 rounded-xl border border-red-500/30 px-3 py-2 text-xs font-semibold text-red-400 hover:bg-red-500/5 transition-colors"
                >
                  <LogOut size={14} /> Sign out
                </button>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// ─── TopNav ───────────────────────────────────────────────────────────────────

export default function TopNav() {
  const { dark, toggle } = useTheme()
  const { username } = useApp()
  const { user, signOut } = useAuth()
  const { balance, loading } = useCoins()
  const reduced = useReducedMotion()
  const [authOpen, setAuthOpen] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [hovered, setHovered] = useState(null)

  return (
    <>
      <motion.header
        initial={reduced ? { opacity: 0 } : { y: -72, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 240, damping: 26 }}
        className="sticky top-0 z-40 border-b border-line/60 bg-elevated/85 backdrop-blur-md dark:bg-[rgba(6,10,24,0.88)] dark:border-[rgba(24,36,68,0.7)]"
      >
        {/* Brand accent line — animated aurora */}
        <div className="absolute top-0 inset-x-0 h-[2px] bg-aurora bg-[length:300%_auto] animate-gradient-shift opacity-90" />

        <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4">

          {/* Logo */}
          <Link to="/" className="group flex items-center gap-2.5 font-extrabold tracking-tight shrink-0">
            <span className="relative flex h-9 w-9 items-center justify-center">
              {/* pulsing glow halo */}
              <span aria-hidden className="pointer-events-none absolute inset-0 rounded-xl bg-brand-gradient blur-md opacity-50 motion-safe:animate-glow-pulse" />
              <span className="sheen relative flex h-9 w-9 items-center justify-center rounded-xl bg-brand-gradient shadow-brand transition-transform duration-200 group-hover:scale-110 group-hover:-rotate-6">
                <Trophy size={18} className="text-white drop-shadow" />
              </span>
            </span>
            <span className="text-lg leading-none">
              Vote<span className="text-aurora">Offside</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav
            className="ml-3 hidden items-center gap-0.5 lg:flex"
            onMouseLeave={() => setHovered(null)}
          >
            {LINKS.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                onMouseEnter={() => setHovered(l.to)}
                className={({ isActive }) =>
                  `relative rounded-full px-4 py-2 text-sm font-bold transition-colors duration-200 ${
                    isActive
                      ? 'text-white'
                      : 'text-muted hover:text-ink dark:hover:text-ink'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {/* Filled glowing gradient pill on the active link */}
                    {isActive && (
                      <motion.span
                        layoutId="nav-active-pill"
                        className="absolute inset-0 rounded-full bg-aurora bg-[length:200%_auto] animate-gradient-shift shadow-[0_4px_16px_rgba(26,86,219,0.55)]"
                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                      />
                    )}
                    {/* Gliding hover pill on inactive links */}
                    {hovered === l.to && !isActive && (
                      <motion.span
                        layoutId="nav-hover-pill"
                        className="absolute inset-0 rounded-full bg-brand/10 dark:bg-white/8"
                        transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                      />
                    )}
                    <span className="relative z-10">{l.label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            {/* Auth area */}
            {supabaseEnabled && (
              user ? (
                <>
                  <CoinPill balance={balance} loading={loading} />
                  <UserDropdown user={user} onSignOut={signOut} />
                </>
              ) : (
                <>
                  <span className="hidden items-center gap-1.5 rounded-full border border-line/70 bg-elevated px-3 py-1.5 text-xs font-semibold text-muted sm:inline-flex dark:bg-white/5 dark:border-white/10">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.6)]" />
                    {username}
                  </span>
                  <button
                    onClick={() => setAuthOpen(true)}
                    className="sheen rounded-xl border border-brand/40 bg-brand/10 px-3.5 py-1.5 text-xs font-bold text-brand hover:bg-brand/20 hover:border-brand/60 hover:shadow-[0_0_14px_rgba(26,86,219,0.35)] transition-all duration-200"
                  >
                    Sign in
                  </button>
                </>
              )
            )}

            {!supabaseEnabled && (
              <span className="hidden items-center gap-1.5 rounded-full border border-line/70 bg-elevated px-3 py-1.5 text-xs font-semibold text-muted sm:inline-flex dark:bg-white/5 dark:border-white/10">
                <span className="h-1.5 w-1.5 rounded-full bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.6)]" />
                {username}
              </span>
            )}

            {/* Theme toggle — desktop, animated icon swap */}
            <button
              onClick={toggle}
              aria-label="Toggle dark mode"
              className="relative hidden lg:flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl border border-line/70 text-muted hover:text-ink hover:border-brand/40 hover:bg-brand/5 transition-all duration-150 dark:border-white/10 dark:hover:bg-white/5"
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={dark ? 'sun' : 'moon'}
                  initial={reduced ? { opacity: 0 } : { y: -16, opacity: 0, rotate: -90 }}
                  animate={{ y: 0, opacity: 1, rotate: 0 }}
                  exit={reduced ? { opacity: 0 } : { y: 16, opacity: 0, rotate: 90 }}
                  transition={{ duration: 0.22, ease: 'easeOut' }}
                  className="flex items-center justify-center"
                >
                  {dark ? <Sun size={16} /> : <Moon size={16} />}
                </motion.span>
              </AnimatePresence>
            </button>

            {/* Mobile hamburger */}
            <button
              onClick={() => setDrawerOpen(true)}
              aria-label="Open menu"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-line/70 text-muted hover:text-ink hover:border-brand/40 hover:bg-brand/5 transition-all lg:hidden dark:border-white/10 dark:hover:bg-white/5"
            >
              <Menu size={18} />
            </button>
          </div>
        </div>
      </motion.header>

      {/* Mobile drawer */}
      <MobileDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        user={user}
        onSignIn={() => setAuthOpen(true)}
        onSignOut={signOut}
        dark={dark}
        toggleTheme={toggle}
        balance={balance}
        coinsLoading={loading}
      />

      {authOpen && <AuthModal onClose={() => setAuthOpen(false)} />}
    </>
  )
}
