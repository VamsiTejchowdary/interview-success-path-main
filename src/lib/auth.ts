import { supabase } from './supabase'

export type UserRole = 'admin' | 'recruiter' | 'user' | null

export interface AuthUser {
  id: string
  email: string
  role: UserRole
  name: string
  status?: string
  phone?: string
  address?: string
  recruiter_id?: string
}

export interface SignupData {
  email: string
  name: string
  phone?: string
  address?: string
  recruiter_id?: string
}

export const signInWithEmail = async (email: string, password: string): Promise<AuthUser | null> => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      console.error('Sign in error:', error)
      // Provide specific error messages based on the error type
      if (error.message === 'Invalid login credentials') {
        throw new Error('Invalid email or password. Please check your credentials and try again.')
      } else if (error.message === 'Email not confirmed') {
        throw new Error('Please verify your email address before signing in.')
      } else if (error.message.includes('Too many requests')) {
        throw new Error('Too many login attempts. Please try again later.')
      } else {
        throw new Error(error.message || 'An error occurred during sign in')
      }
    }

    if (data.user) {
      // Check user role and status in our custom tables
      const userInfo = await getUserInfo(data.user.email!)
      if (userInfo) {
        // Check if user is approved (for recruiters and users)
        if (userInfo.role !== 'admin' && userInfo.status === 'pending') {
          throw new Error('Your account is pending admin approval. Please wait for approval before signing in.')
        }
        
        return {
          id: data.user.id,
          email: data.user.email!,
          role: userInfo.role,
          name: userInfo.name,
          status: userInfo.status,
          phone: userInfo.phone,
          address: userInfo.address,
          recruiter_id: userInfo.recruiter_id
        }
      } else {
        throw new Error('User profile not found. Please contact support.')
      }
    }

    return null
  } catch (error) {
    console.error('Authentication error:', error)
    throw error
  }
}

export const signUpWithEmail = async (
  email: string, 
  password: string, 
  signupData: SignupData,
  role: 'admin' | 'recruiter' | 'user',
  adminKey?: string
): Promise<{ success: boolean; user?: AuthUser }> => {
  try {
    // Validate admin key if signing up as admin
    if (role === 'admin') {
      const envAdminKey = import.meta.env.VITE_ADMIN_KEY
      if (!adminKey || adminKey !== envAdminKey) {
        throw new Error('Invalid admin key')
      }
    }

    // Get the redirect URL from environment variables
    const redirectUrl = import.meta.env.VITE_AUTH_REDIRECT_URL || window.location.origin

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${redirectUrl}/auth/callback`
      }
    })

    if (error) {
      console.error('Sign up error:', error)
      throw error
    }

    if (data.user) {
      // Insert user into appropriate table based on role
      if (role === 'admin') {
        const { error: insertError } = await supabase
          .from('admins')
          .insert([
            {
              email: email,
              name: signupData.name
            }
          ])
        
        if (insertError) {
          console.error('Error inserting admin:', insertError)
          throw insertError
        }
      } else if (role === 'recruiter') {
        const { error: insertError } = await supabase
          .from('recruiters')
          .insert([
            {
              email: email,
              name: signupData.name,
              phone: signupData.phone,
              address: signupData.address,
              status: 'pending'
            }
          ])
        
        if (insertError) {
          console.error('Error inserting recruiter:', insertError)
          throw insertError
        }
      } else {
        const { error: insertError } = await supabase
          .from('users')
          .insert([
            {
              email: email,
              name: signupData.name,
              phone: signupData.phone,
              address: signupData.address,
              recruiter_id: signupData.recruiter_id,
              status: 'pending'
            }
          ])
        
        if (insertError) {
          console.error('Error inserting user:', insertError)
          throw insertError
        }
      }

      // Return success but don't automatically log in
      return {
        success: true,
        user: {
          id: data.user.id,
          email: data.user.email!,
          role,
          name: signupData.name,
          status: role === 'admin' ? 'active' : 'pending',
          phone: signupData.phone,
          address: signupData.address,
          recruiter_id: signupData.recruiter_id
        }
      }
    }

    return { success: false }
  } catch (error) {
    console.error('Registration error:', error)
    throw error
  }
}

export const signOut = async (): Promise<void> => {
  try {
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error('Sign out error:', error)
    }
  } catch (error) {
    console.error('Sign out error:', error)
  }
}

export const getCurrentUser = async (): Promise<AuthUser | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      const userInfo = await getUserInfo(user.email!)
      if (userInfo) {
        return {
          id: user.id,
          email: user.email!,
          role: userInfo.role,
          name: userInfo.name,
          status: userInfo.status,
          phone: userInfo.phone,
          address: userInfo.address,
          recruiter_id: userInfo.recruiter_id
        }
      }
    }
    
    return null
  } catch (error) {
    console.error('Get current user error:', error)
    return null
  }
}

export const getUserInfo = async (email: string): Promise<{ 
  role: UserRole; 
  name: string; 
  status?: string;
  phone?: string;
  address?: string;
  recruiter_id?: string;
} | null> => {
  try {
    // Check admins table
    const { data: adminData } = await supabase
      .from('admins')
      .select('admin_id, name')
      .eq('email', email)
      .single()

    if (adminData) {
      return { role: 'admin', name: adminData.name }
    }

    // Check recruiters table
    const { data: recruiterData } = await supabase
      .from('recruiters')
      .select('recruiter_id, name, status, phone, address')
      .eq('email', email)
      .single()

    if (recruiterData) {
      return { 
        role: 'recruiter', 
        name: recruiterData.name, 
        status: recruiterData.status,
        phone: recruiterData.phone,
        address: recruiterData.address
      }
    }

    // Check users table
    const { data: userData } = await supabase
      .from('users')
      .select('user_id, name, status, phone, address, recruiter_id')
      .eq('email', email)
      .single()

    if (userData) {
      return { 
        role: 'user', 
        name: userData.name, 
        status: userData.status,
        phone: userData.phone,
        address: userData.address,
        recruiter_id: userData.recruiter_id
      }
    }

    return null
  } catch (error) {
    console.error('Error getting user info:', error)
    return null
  }
}

const getUserRole = async (email: string): Promise<UserRole> => {
  const userInfo = await getUserInfo(email)
  return userInfo?.role || null
}

const getUserName = async (email: string, role: UserRole): Promise<string> => {
  const userInfo = await getUserInfo(email)
  return userInfo?.name || ''
} 