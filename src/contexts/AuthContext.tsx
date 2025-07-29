import React, { createContext, useContext, useEffect, useState } from 'react'
import { AuthUser, UserRole, signInWithEmail, signUpWithEmail, signOut, getCurrentUser, SignupData } from '@/lib/auth'

interface AuthContextType {
  user: AuthUser | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<boolean>
  signUp: (email: string, password: string, signupData: SignupData, role: 'admin' | 'recruiter' | 'user' | 'affiliate', adminKey?: string) => Promise<{ success: boolean; user?: AuthUser }>
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
      throw error
    }
  }

  const signUp = async (email: string, password: string, signupData: SignupData, role: 'admin' | 'recruiter' | 'user', adminKey?: string): Promise<{ success: boolean; user?: AuthUser }> => {
    try {
      const result = await signUpWithEmail(email, password, signupData, role, adminKey)
      // Don't automatically set user - let the success page handle it
      return result
    } catch (error) {
      console.error('Sign up error:', error)
      throw error
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