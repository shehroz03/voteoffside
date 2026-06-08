import { createContext, useContext, useEffect, useState } from 'react'
import { supabase, supabaseEnabled } from '../lib/supabase.js'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(supabaseEnabled)

  useEffect(() => {
    if (!supabaseEnabled) return

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signInWithEmail = (email, password) => {
    if (!supabaseEnabled) return
    return supabase.auth.signInWithPassword({ email, password })
  }

  const signUpWithEmail = (email, password, metadata = {}) => {
    if (!supabaseEnabled) return
    return supabase.auth.signUp({ email, password, options: { data: metadata } })
  }

  const signOut = () => {
    if (!supabaseEnabled) return
    return supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ user, loading, signInWithEmail, signUpWithEmail, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
