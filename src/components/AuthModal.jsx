import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Mail, Lock, User, Globe, Loader2, AlertCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import { supabaseEnabled } from '../lib/supabase.js'

const COUNTRIES = [
  'Afghanistan','Albania','Algeria','Andorra','Angola','Argentina','Armenia','Australia',
  'Austria','Azerbaijan','Bahrain','Bangladesh','Belarus','Belgium','Bolivia','Bosnia and Herzegovina',
  'Brazil','Bulgaria','Cambodia','Cameroon','Canada','Chile','China','Colombia','Costa Rica',
  'Croatia','Cuba','Czech Republic','Denmark','Ecuador','Egypt','El Salvador','Estonia',
  'Ethiopia','Finland','France','Georgia','Germany','Ghana','Greece','Guatemala','Honduras',
  'Hungary','India','Indonesia','Iran','Iraq','Ireland','Israel','Italy','Jamaica','Japan',
  'Jordan','Kazakhstan','Kenya','Kuwait','Latvia','Lebanon','Libya','Lithuania','Luxembourg',
  'Malaysia','Mexico','Moldova','Morocco','Mozambique','Netherlands','New Zealand','Nigeria',
  'North Korea','Norway','Oman','Pakistan','Palestine','Panama','Paraguay','Peru','Philippines',
  'Poland','Portugal','Qatar','Romania','Russia','Saudi Arabia','Senegal','Serbia','Singapore',
  'Slovakia','Slovenia','Somalia','South Africa','South Korea','Spain','Sri Lanka','Sudan',
  'Sweden','Switzerland','Syria','Taiwan','Tanzania','Thailand','Tunisia','Turkey','Uganda',
  'Ukraine','United Arab Emirates','United Kingdom','United States','Uruguay','Uzbekistan',
  'Venezuela','Vietnam','Yemen','Zimbabwe',
]

const inputCls = 'w-full rounded-xl border border-line/60 bg-white/5 py-2.5 pl-9 pr-4 text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand/40 dark:border-white/10 dark:bg-white/5'
const iconCls = 'absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none'

export default function AuthModal({ onClose }) {
  const { signInWithEmail, signUpWithEmail } = useAuth()
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [country, setCountry] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  if (!supabaseEnabled) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setInfo('')
    setLoading(true)
    try {
      if (mode === 'login') {
        const { error: err } = await signInWithEmail(email, password)
        if (err) setError(err.message)
        else onClose()
      } else {
        const { error: err } = await signUpWithEmail(email, password, {
          full_name: name.trim(),
          country,
        })
        if (err) setError(err.message)
        else setInfo('Account created! Check your email to confirm.')
      }
    } catch (ex) {
      setError(ex.message)
    } finally {
      setLoading(false)
    }
  }

  const switchMode = () => {
    setMode((m) => (m === 'login' ? 'signup' : 'login'))
    setError('')
    setInfo('')
  }

  return (
    <AnimatePresence>
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div
          key="modal"
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 12 }}
          transition={{ type: 'spring', stiffness: 320, damping: 28 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-sm rounded-2xl border border-line/60 bg-elevated shadow-2xl dark:bg-[#0d1526] dark:border-white/10 p-7 max-h-[90vh] overflow-y-auto"
        >
          <button
            onClick={onClose}
            aria-label="Close"
            className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:text-ink hover:bg-white/5 transition-colors"
          >
            <X size={16} />
          </button>

          <h2 className="mb-1 text-lg font-bold text-ink">
            {mode === 'login' ? 'Welcome back' : 'Create account'}
          </h2>
          <p className="mb-6 text-xs text-muted">
            {mode === 'login'
              ? 'Sign in to save your predictions across devices.'
              : 'Sign up to sync your predictions and unlock more features.'}
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            {/* Name + Country — signup only */}
            {mode === 'signup' && (
              <>
                <div className="relative">
                  <User size={14} className={iconCls} />
                  <input
                    type="text"
                    required
                    autoComplete="name"
                    placeholder="Full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={inputCls}
                  />
                </div>

                <div className="relative">
                  <Globe size={14} className={iconCls} />
                  <select
                    required
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className={`${inputCls} appearance-none`}
                  >
                    <option value="" disabled>Select your country</option>
                    {COUNTRIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </>
            )}

            <div className="relative">
              <Mail size={14} className={iconCls} />
              <input
                type="email"
                required
                autoComplete="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputCls}
              />
            </div>

            <div className="relative">
              <Lock size={14} className={iconCls} />
              <input
                type="password"
                required
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputCls}
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-400">
                <AlertCircle size={13} className="shrink-0" />
                {error}
              </div>
            )}

            {info && (
              <div className="rounded-lg bg-green-500/10 px-3 py-2 text-xs text-green-400">
                {info}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-1 flex items-center justify-center gap-2 rounded-xl bg-brand-gradient py-2.5 text-sm font-semibold text-white shadow-brand hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading && <Loader2 size={14} className="animate-spin" />}
              {mode === 'login' ? 'Sign in' : 'Create account'}
            </button>
          </form>

          <p className="mt-4 text-center text-xs text-muted">
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button onClick={switchMode} className="font-semibold text-brand hover:underline">
              {mode === 'login' ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
