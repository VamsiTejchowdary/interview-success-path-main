import { supabase } from './supabase'

export const loginEmailMarketer = async (email: string, password: string): Promise<boolean> => {
  try {
    // Use Supabase Auth for login
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (authError || !authData.user) {
      return false
    }

    // Check if user is an approved email marketer
    const { data, error } = await supabase
      .from('email_marketers')
      .select('email_marketer_id, email, name, status')
      .eq('email', email)
      .eq('status', 'approved')
      .limit(1)

    if (error || !data || data.length === 0) {
      // Not an approved email marketer, sign out
      await supabase.auth.signOut()
      return false
    }

    return true
  } catch (error) {
    console.error('Email marketer login error:', error)
    return false
  }
}

export const getEmailMarketerSession = async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) return null

    // Verify this is an email marketer
    const { data } = await supabase
      .from('email_marketers')
      .select('email_marketer_id, email, name, status')
      .eq('email', session.user.email)
      .eq('status', 'approved')
      .single()

    if (!data) return null

    return {
      email_marketer_id: data.email_marketer_id,
      email: data.email,
      name: data.name,
      role: 'email_marketer'
    }
  } catch {
    return null
  }
}

export const logoutEmailMarketer = async () => {
  await supabase.auth.signOut()
}

export const isEmailMarketerLoggedIn = async (): Promise<boolean> => {
  const session = await getEmailMarketerSession()
  return session !== null
}
