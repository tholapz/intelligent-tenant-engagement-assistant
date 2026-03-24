import { createContext, useContext, useEffect, useState } from 'react'
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth'
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import type { ReactNode } from 'react'
import type { User } from 'firebase/auth'
import type { UserProfile, UserRole } from '@/types'
import { CPN_DOMAIN, auth, db, googleProvider } from '@/lib/firebase'

interface AuthContextValue {
  user: User | null
  userProfile: UserProfile | null
  role: UserRole | null
  loading: boolean
  signInWithGoogle: () => Promise<void>
  logout: () => Promise<void>
  authError: string | null
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState<string | null>(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const profile = await loadOrCreateUserProfile(firebaseUser)
        setUser(firebaseUser)
        setUserProfile(profile)
      } else {
        setUser(null)
        setUserProfile(null)
      }
      setLoading(false)
    })
    return unsubscribe
  }, [])

  const signInWithGoogle = async () => {
    setAuthError(null)
    try {
      const result = await signInWithPopup(auth, googleProvider)
      const email = result.user.email ?? ''
      if (!email.endsWith(`@${CPN_DOMAIN}`)) {
        await signOut(auth)
        setAuthError('Access restricted to CPN accounts.')
        return
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setAuthError(err.message)
      } else {
        setAuthError('Sign-in failed. Please try again.')
      }
    }
  }

  const logout = async () => {
    await signOut(auth)
    setUser(null)
    setUserProfile(null)
  }

  const role = userProfile?.role ?? null

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        role,
        loading,
        signInWithGoogle,
        logout,
        authError,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

async function loadOrCreateUserProfile(user: User): Promise<UserProfile> {
  const ref = doc(db, 'users', user.uid)
  const snap = await getDoc(ref)
  if (snap.exists()) {
    return snap.data() as UserProfile
  }
  const profile: Omit<UserProfile, 'createdAt'> & {
    createdAt: ReturnType<typeof serverTimestamp>
  } = {
    uid: user.uid,
    email: user.email ?? '',
    displayName: user.displayName ?? '',
    role: 'agent',
    createdAt: serverTimestamp(),
  }
  await setDoc(ref, profile)
  return { ...profile, createdAt: null } as unknown as UserProfile
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
