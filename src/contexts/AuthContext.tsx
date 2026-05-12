import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { supabase } from '../services/supabaseClient'
import type { User, Session } from '@supabase/supabase-js'
import type { ProfileWithRole, Role } from '../types/database'

interface AuthContextType {
  user: User | null
  profile: ProfileWithRole | null
  session: Session | null
  role: Role | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
  isAdmin: boolean
  hasPageAccess: (pageName: string) => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<ProfileWithRole | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*, roles(*)')
        .eq('id', userId)
        .single()

      if (!error && data) {
        setProfile(data as ProfileWithRole)
      } else {
        setProfile(null)
      }
    } catch (err) {
      console.error('Profile fetch error:', err)
      setProfile(null)
    }
  }

  useEffect(() => {
    // 1. Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      // Profile fetch is handled by the other useEffect below
      if (!session?.user) {
        setLoading(false)
      }
    }).catch(() => {
      setLoading(false)
    })

    // 2. Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        if (!session?.user) {
          setProfile(null)
          setLoading(false)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  // Profile management effect
  useEffect(() => {
    if (user) {
      setLoading(true)
      fetchProfile(user.id).finally(() => {
        setLoading(false)
      })
    }
  }, [user?.id])

  const signIn = async (email: string, password: string) => {
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setLoading(false)
    return { error: error as Error | null }
  }

  const signOut = async () => {
    setLoading(true)
    await supabase.auth.signOut()
    setProfile(null)
    setUser(null)
    setSession(null)
    setLoading(false)
  }

  const hasPageAccess = (pageName: string) => {
    if (!profile?.roles) return false
    if (profile.roles.name === 'Admin') return true

    const allowedPages = profile.roles.allowed_pages as string[]
    return Array.isArray(allowedPages) && allowedPages.includes(pageName)
  }

  const value: AuthContextType = {
    user,
    profile,
    session,
    role: profile?.roles ?? null,
    loading,
    signIn,
    signOut,
    isAdmin: profile?.roles?.name === 'Admin',
    hasPageAccess
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
