import { supabase } from './supabase'

export type UserRole = 'admin' | 'recruiter' | 'user' | 'affiliate' | 'email_marketer' | null

export interface AuthUser {
  id: string
  email: string
  role: UserRole
  first_name: string
  last_name: string
  status?: string
  phone?: string
  address?: string
  recruiter_id?: string
  resume_url: string
  linkedin_url?: string
  subscription_fee: number
}

export interface SignupData {
  email: string
  first_name: string
  last_name: string
  phone: string
  address: string
  recruiter_id?: string
  resume_url: string
  linkedin_url?: string
  subscription_fee?: number
  name?: string
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
        // Block sign-in for users/recruiters/affiliates with status 'pending' or 'rejected'
        if (userInfo.role === 'recruiter') {
          if (userInfo.status !== 'approved') {
            if (userInfo.status === 'pending') {
              throw new Error('Your recruiter account is pending admin approval. Please wait for approval before signing in.')
            } else if (userInfo.status === 'rejected') {
              throw new Error('Your recruiter account has been rejected. Please contact support for more information.')
            } else {
              throw new Error('Your recruiter account is not active. Please contact support.')
            }
          }
        } else if (userInfo.role === 'user') {
          if (userInfo.status === 'pending') {
            throw new Error('Your account is pending admin approval. Please wait for approval before signing in.')
          } else if (userInfo.status === 'rejected') {
            throw new Error('Your account has been deactivated. Please contact us at support@jobsmartly.com for more information.')
          } else if (userInfo.status !== 'approved' && userInfo.status !== 'on_hold') {
            throw new Error('Your account is not active. Please contact support.')
          }
        } else if (userInfo.role === 'affiliate') {
          if (userInfo.status !== 'approved') {
            if (userInfo.status === 'pending') {
              throw new Error('Your affiliate account is pending admin approval. Please wait for approval before signing in.')
            } else if (userInfo.status === 'rejected') {
              throw new Error('Your affiliate account has been rejected. Please contact support for more information.')
            } else {
              throw new Error('Your affiliate account is not active. Please contact support.')
            }
          }
        } else if (userInfo.role === 'email_marketer') {
          if (userInfo.status !== 'approved') {
            if (userInfo.status === 'pending') {
              throw new Error('Your email marketer account is pending admin approval. Please wait for approval before signing in.')
            } else if (userInfo.status === 'rejected') {
              throw new Error('Your email marketer account has been rejected. Please contact support for more information.')
            } else {
              throw new Error('Your email marketer account is not active. Please contact support.')
            }
          }
        }
        return {
          id: data.user.id,
          email: data.user.email!,
          role: userInfo.role,
          first_name: userInfo.first_name,
          last_name: userInfo.last_name,
          status: userInfo.status,
          phone: userInfo.phone,
          address: userInfo.address,
          recruiter_id: userInfo.recruiter_id,
          resume_url: userInfo.resume_url,
          linkedin_url: userInfo.linkedin_url,
          subscription_fee: userInfo.subscription_fee
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
  role: 'admin' | 'recruiter' | 'user' | 'affiliate',
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

    // Check if email exists in any table
    const { data: emailExists, error: emailCheckError } = await supabase.rpc('check_email_exists_across_tables', { check_email: email });
    if (emailCheckError) {
      console.error('Error checking email existence:', emailCheckError)
      throw emailCheckError
    }
    if (emailExists && emailExists.length > 0) {
      throw new Error('already registered')
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
      } else if (role === 'affiliate') {
        const { error: insertError } = await supabase
          .from('affiliates')
          .insert([
            {
              email: email,
              name: signupData.name,
              phone: signupData.phone,
              status: 'pending'
            }
          ])
        if (insertError) {
          console.error('Error inserting affiliate:', insertError)
          throw insertError
        }
      } else {
        const { error: insertError } = await supabase
          .from('users')
          .insert([
            {
              email: email,
              first_name: signupData.first_name,
              last_name: signupData.last_name,
              phone: signupData.phone,
              address: signupData.address,
              recruiter_id: signupData.recruiter_id,
              resume_url: signupData.resume_url,
              linkedin_url: signupData.linkedin_url,
              subscription_fee: signupData.subscription_fee ?? 250,
              status: 'on_hold'
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
          first_name: role === 'admin' ? (signupData.name || '') : signupData.first_name,
          last_name: role === 'admin' ? '' : signupData.last_name,
          status: role === 'admin' ? 'active' : 'pending',
          phone: signupData.phone,
          address: signupData.address,
          recruiter_id: signupData.recruiter_id,
          resume_url: signupData.resume_url,
          linkedin_url: signupData.linkedin_url,
          subscription_fee: signupData.subscription_fee ?? 200
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
      throw error
    }
    console.log('✅ Successfully signed out')
  } catch (error) {
    console.error('Sign out error:', error)
    throw error
  }
}

export const getCurrentUser = async (): Promise<AuthUser | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      const userInfo = await getUserInfo(user.email!)
      if (userInfo) {
        // Check if user is approved (for recruiters, users, and affiliates)
        if (
          userInfo.role !== 'admin' &&
          (userInfo.status === 'pending' || userInfo.status === 'rejected')
        ) {
          // Sign out pending or rejected users to prevent automatic login
          await supabase.auth.signOut()
          return null
        }

        return {
          id: user.id,
          email: user.email!,
          role: userInfo.role,
          first_name: userInfo.first_name,
          last_name: userInfo.last_name,
          status: userInfo.status,
          phone: userInfo.phone,
          address: userInfo.address,
          recruiter_id: userInfo.recruiter_id,
          resume_url: userInfo.resume_url,
          linkedin_url: userInfo.linkedin_url,
          subscription_fee: userInfo.subscription_fee
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
  user_id?: string;
  role: UserRole;
  first_name: string;
  last_name: string;
  status?: string;
  phone?: string;
  address?: string;
  recruiter_id?: string;
  resume_url: string;
  linkedin_url?: string;
  subscription_fee: number;
} | null> => {
  try {
    // Check admins table
    const { data: adminData } = await supabase
      .from('admins')
      .select('admin_id, name')
      .eq('email', email)
      .single()

    if (adminData) {
      return { role: 'admin', first_name: adminData.name, last_name: '', resume_url: '', subscription_fee: 0 }
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
        first_name: recruiterData.name,
        last_name: '',
        status: recruiterData.status,
        phone: recruiterData.phone,
        address: recruiterData.address,
        resume_url: '',
        subscription_fee: 0
      }
    }

    // Check affiliates table
    const { data: affiliateData } = await supabase
      .from('affiliates')
      .select('affiliate_user_id, name, status, phone')
      .eq('email', email)
      .single()

    if (affiliateData) {
      return {
        user_id: affiliateData.affiliate_user_id,
        role: 'affiliate',
        first_name: affiliateData.name,
        last_name: '',
        status: affiliateData.status,
        phone: affiliateData.phone,
        address: '',
        resume_url: '',
        subscription_fee: 0
      }
    }

    // Check email_marketers table
    const { data: emailMarketerData } = await supabase
      .from('email_marketers')
      .select('email_marketer_id, name, status, phone')
      .eq('email', email)
      .single()

    if (emailMarketerData) {
      return {
        user_id: emailMarketerData.email_marketer_id,
        role: 'email_marketer',
        first_name: emailMarketerData.name,
        last_name: '',
        status: emailMarketerData.status,
        phone: emailMarketerData.phone,
        address: '',
        resume_url: '',
        subscription_fee: 0
      }
    }

    // Check users table
    const { data: userData } = await supabase
      .from('users')
      .select('user_id, first_name, last_name, status, phone, address, recruiter_id, resume_url, linkedin_url, subscription_fee')
      .eq('email', email)
      .single()

    if (userData) {
      return {
        user_id: userData.user_id,
        role: 'user',
        first_name: userData.first_name,
        last_name: userData.last_name,
        status: userData.status,
        phone: userData.phone,
        address: userData.address,
        recruiter_id: userData.recruiter_id,
        resume_url: userData.resume_url,
        linkedin_url: userData.linkedin_url,
        subscription_fee: userData.subscription_fee
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
  return userInfo?.first_name || ''
} 