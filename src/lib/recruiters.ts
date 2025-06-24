import { supabase } from './supabase'

export interface Recruiter {
  recruiter_id: string
  name: string
  email: string
  phone?: string
  address?: string
}

export const getApprovedRecruiters = async (): Promise<Recruiter[]> => {
  try {
    const { data, error } = await supabase
      .from('recruiters')
      .select('recruiter_id, name, email, phone, address')
      .eq('status', 'approved')
      .order('name')

    if (error) {
      console.error('Error fetching recruiters:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error fetching recruiters:', error)
    return []
  }
} 