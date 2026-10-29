import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { createClient, type Session, type SupabaseClient, type User } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim()
  .replace(/\/rest\/v1\/?$/i, '')
  .replace(/\/+$/, '')
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim()
const supabase: SupabaseClient | null = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey, {
    auth: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: true },
  })
  : null

interface AuthContextValue {
  configured: boolean
  ready: boolean
  authError: string | null
  session: Session | null
  user: User | null
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<boolean>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [authError, setAuthError] = useState<string | null>(null)
  const [ready, setReady] = useState(!supabase)

  useEffect(() => {
    if (!supabase) return
    let active = true
    supabase.auth.getSession().then(({ data, error }) => {
      if (!active) return
      if (error) {
        console.error('Could not restore the Supabase session', error.message)
        setAuthError(authMessage(error.message))
      }
      setSession(data.session)
      setReady(true)
    }).catch((error: unknown) => {
      if (!active) return
      console.error('Could not restore the Supabase session', error)
      setAuthError('Could not complete the sign-in link. Open it in the same browser where you signed up, or request a new confirmation email.')
      setReady(true)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      if (nextSession) setAuthError(null)
      setReady(true)
    })
    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  const value = useMemo<AuthContextValue>(() => ({
    configured: Boolean(supabase),
    ready,
    authError,
    session,
    user: session?.user ?? null,
    async signIn(email, password) {
      if (!supabase) throw new Error('Supabase authentication is not configured. Set the frontend Supabase URL and publishable key.')
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw new Error(authMessage(error.message))
    },
    async signUp(email, password) {
      if (!supabase) throw new Error('Supabase authentication is not configured. Set the frontend Supabase URL and publishable key.')
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/auth` },
      })
      if (error) throw new Error(authMessage(error.message))
      return Boolean(data.session)
    },
    async signOut() {
      if (!supabase) return
      const { error } = await supabase.auth.signOut()
      if (error) throw new Error(authMessage(error.message))
    },
  }), [authError, ready, session])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}

export function getSupabaseClient() {
  return supabase
}

function authMessage(message: string) {
  if (/invalid login credentials/i.test(message)) return 'Email or password is incorrect.'
  if (/email not confirmed/i.test(message)) return 'Confirm your email address before signing in.'
  if (/password should be at least/i.test(message)) return 'Choose a password with at least 6 characters.'
  if (/code verifier|flow state|code challenge|pkce/i.test(message)) return 'This confirmation link must be opened in the same browser where you signed up. Request a new confirmation email if needed.'
  if (/expired|invalid.*token|token.*invalid/i.test(message)) return 'This confirmation link is invalid or expired. Request a new confirmation email.'
  return message
}
