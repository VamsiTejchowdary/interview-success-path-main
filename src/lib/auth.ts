import { supabase } from './supabase'

export type UserRole = 'admin' | 'recruiter' | 'user' | null

export interface AuthUser {
  id: string
  email: string
  role: UserRole
  name: string
}

export const signInWithEmail = async (email: string, password: string): Promise<AuthUser | null> => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      console.error('Sign in error:', error)
      return null
    }

    if (data.user) {
      // Check user role in our custom tables
      const role = await getUserRole(data.user.email!)
      if (role) {
        return {
          id: data.user.id,
          email: data.user.email!,
          role,
          name: await getUserName(data.user.email!, role)
        }
      }
    }

    return null
  } catch (error) {
    console.error('Authentication error:', error)
    return null
  }
}

export const signUpWithEmail = async (email: string, password: string, name: string, role: 'recruiter' | 'user'): Promise<AuthUser | null> => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
      console.error('Sign up error:', error)
      return null
    }

    if (data.user) {
      // Insert user into appropriate table based on role
      if (role === 'recruiter') {
        const { error: insertError } = await supabase
          .from('recruiters')
          .insert([
            {
              email: email,
              name: name,
              status: 'pending'
            }
          ])
        
        if (insertError) {
          console.error('Error inserting recruiter:', insertError)
          return null
        }
      } else {
        const { error: insertError } = await supabase
          .from('users')
          .insert([
            {
              email: email,
              name: name,
              status: 'pending'
            }
          ])
        
        if (insertError) {
          console.error('Error inserting user:', insertError)
          return null
        }
      }

      return {
        id: data.user.id,
        email: data.user.email!,
        role,
        name
      }
    }

    return null
  } catch (error) {
    console.error('Registration error:', error)
    return null
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
      const role = await getUserRole(user.email!)
      if (role) {
        return {
          id: user.id,
          email: user.email!,
          role,
          name: await getUserName(user.email!, role)
        }
      }
    }
    
    return null
  } catch (error) {
    console.error('Get current user error:', error)
    return null
  }
}

const getUserRole = async (email: string): Promise<UserRole> => {
  try {
    // Check admins table
    const { data: adminData } = await supabase
      .from('admins')
      .select('admin_id')
      .eq('email', email)
      .single()

    if (adminData) {
      return 'admin'
    }

    // Check recruiters table
    const { data: recruiterData } = await supabase
      .from('recruiters')
      .select('recruiter_id')
      .eq('email', email)
      .single()

    if (recruiterData) {
      return 'recruiter'
    }

    // Check users table
    const { data: userData } = await supabase
      .from('users')
      .select('user_id')
      .eq('email', email)
      .single()

    if (userData) {
      return 'user'
    }

    return null
  } catch (error) {
    console.error('Error getting user role:', error)
    return null
  }
}

const getUserName = async (email: string, role: UserRole): Promise<string> => {
  try {
    if (role === 'admin') {
      const { data } = await supabase
        .from('admins')
        .select('name')
        .eq('email', email)
        .single()
      return data?.name || ''
    }

    if (role === 'recruiter') {
      const { data } = await supabase
        .from('recruiters')
        .select('name')
        .eq('email', email)
        .single()
      return data?.name || ''
    }

    if (role === 'user') {
      const { data } = await supabase
        .from('users')
        .select('name')
        .eq('email', email)
        .single()
      return data?.name || ''
    }

    return ''
  } catch (error) {
    console.error('Error getting user name:', error)
    return ''
  }
} 