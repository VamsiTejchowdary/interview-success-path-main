import { supabase } from './supabase'

export interface DashboardStats {
  activeStudents: number
  recruiterAgents: number
  monthlyRevenue: number
  conversionRate: number
  pendingUsers: number
  approvedUsers: number
}

export interface RecruiterData {
  recruiter_id: string
  name: string
  email: string
  phone: string | null
  address: string | null
  status: 'pending' | 'approved' | 'rejected'
  approved_at: string | null
  created_at: string
  user_count: number
}

export interface UserData {
  user_id: string
  first_name: string
  last_name: string
  email: string
  phone: string | null
  address: string | null
  status: 'pending' | 'approved' | 'rejected' | 'on_hold'
  approved_at: string | null
  created_at: string
  recruiter_id: string | null
  recruiter_name: string | null
  resume_url: string
  linkedin_url?: string
  subscription_fee: number
}

export const getDashboardStats = async (): Promise<DashboardStats> => {
  try {
    // Get active students (users with approved status)
    const { data: activeStudents, error: studentsError } = await supabase
      .from('users')
      .select('user_id')
      .eq('status', 'approved')

    if (studentsError) throw studentsError

    // Get recruiter agents (recruiters with approved status)
    const { data: recruiterAgents, error: recruitersError } = await supabase
      .from('recruiters')
      .select('recruiter_id')
      .eq('status', 'approved')

    if (recruitersError) throw recruitersError

    // Get all users for conversion rate calculation
    const { data: allUsers, error: allUsersError } = await supabase
      .from('users')
      .select('status')

    if (allUsersError) throw allUsersError

    const pendingUsers = allUsers.filter(user => user.status === 'pending').length
    const approvedUsers = allUsers.filter(user => user.status === 'approved').length
    const totalUsers = allUsers.length

    const conversionRate = totalUsers > 0 ? Math.round((approvedUsers / totalUsers) * 100) : 0
    const monthlyRevenue = (activeStudents?.length || 0) * 100

    return {
      activeStudents: activeStudents?.length || 0,
      recruiterAgents: recruiterAgents?.length || 0,
      monthlyRevenue,
      conversionRate,
      pendingUsers,
      approvedUsers
    }
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    throw error
  }
}

export const getRecruitersList = async (): Promise<RecruiterData[]> => {
  try {
    const { data, error } = await supabase
      .from('recruiters')
      .select('recruiter_id, name, email, phone, address, status, approved_at, created_at')
      .order('created_at', { ascending: false })

    if (error) throw error

    // Get user count for each recruiter
    const recruitersWithUserCount = await Promise.all(
      (data || []).map(async (recruiter) => {
        const { data: userCount, error: countError } = await supabase
          .from('users')
          .select('user_id', { count: 'exact' })
          .eq('recruiter_id', recruiter.recruiter_id)

        if (countError) {
          console.error('Error getting user count for recruiter:', countError)
          return { ...recruiter, user_count: 0 }
        }

        return { 
          ...recruiter, 
          user_count: userCount?.length || 0 
        }
      })
    )

    return recruitersWithUserCount
  } catch (error) {
    console.error('Error fetching recruiters:', error)
    throw error
  }
}

export const getUsersList = async (): Promise<UserData[]> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select(`
        user_id,
        first_name,
        last_name,
        email,
        phone,
        address,
        status,
        approved_at,
        created_at,
        recruiter_id,
        resume_url,
        linkedin_url,
        subscription_fee,
        recruiters(name)
      `)
      .order('created_at', { ascending: false })

    if (error) throw error

    return (data || []).map(user => {
      let recruiter = null;
      if (user.recruiters && Array.isArray(user.recruiters) && user.recruiters.length > 0) {
        recruiter = user.recruiters[0];
      } else if (user.recruiters && !Array.isArray(user.recruiters)) {
        recruiter = user.recruiters;
      }
      return {
        ...user,
        recruiter_name: recruiter && recruiter.name
          ? recruiter.name.trim()
          : null
      };
    })
  } catch (error) {
    console.error('Error fetching users:', error)
    throw error
  }
}

export const updateRecruiterStatus = async (
  recruiterId: string, 
  status: 'pending' | 'approved' | 'rejected'
): Promise<void> => {
  try {
    const { error } = await supabase
      .from('recruiters')
      .update({ 
        status,
        approved_at: status === 'approved' ? new Date().toISOString() : null
      })
      .eq('recruiter_id', recruiterId)

    if (error) throw error
  } catch (error) {
    console.error('Error updating recruiter status:', error)
    throw error
  }
}

export const updateUserStatus = async (
  userId: string, 
  status: 'pending' | 'approved' | 'rejected' | 'on_hold'
): Promise<void> => {
  try {
    // First, get the user's current status
    const { data: currentUser, error: fetchError } = await supabase
      .from('users')
      .select('status')
      .eq('user_id', userId)
      .single();

    if (fetchError) throw fetchError;

    const updatePayload: {
      status: string;
      approved_at?: string | null;
      recruiter_id?: string | null;
    } = {
      status,
      approved_at: status === 'approved' ? new Date().toISOString() : null
    };

    // If user is being moved FROM 'approved' to another status, un-assign recruiter
    if (currentUser.status === 'approved' && status !== 'approved') {
      updatePayload.recruiter_id = null;
    }

    const { error } = await supabase
      .from('users')
      .update(updatePayload)
      .eq('user_id', userId);

    if (error) throw error;
  } catch (error) {
    console.error('Error updating user status:', error);
    throw error;
  }
};

export const assignRecruiterToUser = async (
  userId: string, 
  recruiterId: string
): Promise<void> => {
  try {
    const { error } = await supabase
      .from('users')
      .update({ recruiter_id: recruiterId })
      .eq('user_id', userId)

    if (error) throw error
  } catch (error) {
    console.error('Error assigning recruiter to user:', error)
    throw error
  }
}

export const getApprovedRecruiters = async (): Promise<{ recruiter_id: string; name: string }[]> => {
  try {
    const { data, error } = await supabase
      .from('recruiters')
      .select('recruiter_id, name')
      .eq('status', 'approved')
      .order('name')

    if (error) throw error
    return (data || []).map(r => ({
      recruiter_id: r.recruiter_id,
      name: r.name
    }));
  } catch (error) {
    console.error('Error fetching approved recruiters:', error)
    throw error
  }
} 