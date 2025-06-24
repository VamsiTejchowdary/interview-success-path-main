import React, { createContext, useContext, useEffect, useState } from 'react'
import { AuthUser, UserRole, signInWithEmail, signUpWithEmail, signOut, getCurrentUser } from '@/lib/auth'

interface AuthContextType {
  user: AuthUser | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<boolean>
  signUp: (email: string, password: string, name: string, role: 'recruiter' | 'user') => Promise<boolean>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: React.ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check for existing session on app load
    const checkUser = async () => {
      try {
        const currentUser = await getCurrentUser()
        setUser(currentUser)
      } catch (error) {
        console.error('Error checking user session:', error)
      } finally {
        setLoading(false)
      }
    }

    checkUser()
  }, [])

  const signIn = async (email: string, password: string): Promise<boolean> => {
    try {
      const authUser = await signInWithEmail(email, password)
      if (authUser) {
        setUser(authUser)
        return true
      }
      return false
    } catch (error) {
      console.error('Sign in error:', error)
      return false
    }
  }

  const signUp = async (email: string, password: string, name: string, role: 'recruiter' | 'user'): Promise<boolean> => {
    try {
      const authUser = await signUpWithEmail(email, password, name, role)
      if (authUser) {
        setUser(authUser)
        return true
      }
      return false
    } catch (error) {
      console.error('Sign up error:', error)
      return false
    }
  }

  const logout = async (): Promise<void> => {
    try {
      await signOut()
      setUser(null)
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const value = {
    user,
    loading,
    signIn,
    signUp,
    logout,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
} 