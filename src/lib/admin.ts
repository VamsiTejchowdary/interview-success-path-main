import { supabase } from './supabase'
import { Calendar } from "lucide-react"; // for date icon

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
  next_billing_at: string | null
  is_paid: boolean
  created_at: string
  recruiter_id: string | null
  recruiter_name: string | null
  resume_url: string
  linkedin_url?: string
  subscription_fee: number
}

export interface AffiliateData {
  affiliate_user_id: string
  name: string
  email: string
  phone: string | null
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  user_count: number
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
        next_billing_at,
        is_paid,
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
    const now = new Date();
    let updatePayload: {
      status: string;
      approved_at?: string | null;
      next_billing_at?: string | null;
      is_paid?: boolean;
    } = { status };

    if (status === 'approved') {
      const { data: subscription, error: subscriptionError } = await supabase
        .from('subscriptions')
        .select('current_period_end')
        .eq('user_id', userId)
        .eq('status', 'active')
        .single();

      if (subscriptionError) throw subscriptionError;

      const nextBillingDate = subscription?.current_period_end
        ? new Date(subscription.current_period_end).toISOString()
        : (() => {
          const nextMonth = new Date(now);
          nextMonth.setMonth(now.getMonth() + 1);
          return nextMonth.toISOString();
        })();

      updatePayload = {
        status,
        approved_at: now.toISOString(),
        next_billing_at: nextBillingDate,
        is_paid: true
      };
    } else {
      updatePayload = {
        status,
        next_billing_at: null,
        is_paid: false
      };
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

export const updateUserPaid = async (userId: string, isPaid: boolean) => {
  const { error } = await supabase
    .from('users')
    .update({ is_paid: isPaid })
    .eq('user_id', userId);
  if (error) throw error;
};

export const updateUserNextBilling = async (userId: string, nextBillingAt: string) => {
  const { error } = await supabase
    .from('users')
    .update({ next_billing_at: nextBillingAt })
    .eq('user_id', userId);
  if (error) throw error;
};

export const updateUserSubscriptionFee = async (userId: string, subscriptionFee: number) => {
  const { error } = await supabase
    .from('users')
    .update({ subscription_fee: subscriptionFee })
    .eq('user_id', userId);
  if (error) throw error;
};

export const getAffiliatesList = async (): Promise<AffiliateData[]> => {
  try {
    const { data, error } = await supabase
      .from('affiliates')
      .select('affiliate_user_id, name, email, phone, status, created_at')
      .order('created_at', { ascending: false })

    if (error) throw error

    // Get user count for each affiliate (users who used their coupons)
    const affiliatesWithUserCount = await Promise.all(
      data.map(async (affiliate) => {
        // Count users who used this affiliate's coupons
        const { data: couponUsages, error: usagesError } = await supabase
          .from('coupon_usages')
          .select(`
            coupon_id,
            coupons!inner(affiliate_user_id)
          `)
          .eq('coupons.affiliate_user_id', affiliate.affiliate_user_id)

        if (usagesError) {
          console.error('Error fetching coupon usages for affiliate:', usagesError)
          return { ...affiliate, user_count: 0 }
        }

        return {
          ...affiliate,
          user_count: couponUsages?.length || 0
        }
      })
    )

    return affiliatesWithUserCount
  } catch (error) {
    console.error('Error fetching affiliates list:', error)
    throw error
  }
}

export const updateAffiliateStatus = async (
  affiliateId: string,
  status: 'pending' | 'approved' | 'rejected'
): Promise<void> => {
  try {
    const { error } = await supabase
      .from('affiliates')
      .update({
        status,
      })
      .eq('affiliate_user_id', affiliateId)

    if (error) throw error
  } catch (error) {
    console.error('Error updating affiliate status:', error)
    throw error
  }
}

export const createCouponForAffiliate = async (
  affiliateId: string,
  couponCode: string
): Promise<void> => {
  try {
    // Check if coupon code already exists
    const { data: existingCoupon, error: checkError } = await supabase
      .from('coupons')
      .select('coupon_id')
      .eq('code', couponCode)
      .single()

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "not found" error
      throw checkError
    }

    if (existingCoupon) {
      throw new Error('Coupon code already exists')
    }

    // Create new coupon
    const { error } = await supabase
      .from('coupons')
      .insert({
        code: couponCode,
        affiliate_user_id: affiliateId,
        no_of_coupon_used: 0
      })

    if (error) throw error
  } catch (error) {
    console.error('Error creating coupon:', error)
    throw error
  }
}

export const getAffiliateCoupons = async (affiliateId: string): Promise<{
  coupon_id: string;
  code: string;
  no_of_coupon_used: number;
  created_at: string;
}[]> => {
  try {
    const { data, error } = await supabase
      .from('coupons')
      .select('coupon_id, code, no_of_coupon_used, created_at')
      .eq('affiliate_user_id', affiliateId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching affiliate coupons:', error)
    throw error
  }
}
// Email Marketer Management Functions

export interface EmailMarketerData {
  email_marketer_id: string
  name: string
  email: string
  phone: string | null
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
}

export const getEmailMarketersList = async (): Promise<EmailMarketerData[]> => {
  try {
    const { data, error } = await supabase
      .from('email_marketers')
      .select('email_marketer_id, name, email, phone, status, created_at')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching email marketers:', error)
    throw error
  }
}

export const createEmailMarketer = async (
  email: string,
  name: string,
  phone?: string
): Promise<void> => {
  try {
    // Check if email already exists in email_marketers table
    const { data: existing } = await supabase
      .from('email_marketers')
      .select('email')
      .eq('email', email)
      .limit(1)

    if (existing && existing.length > 0) {
      throw new Error('Email already registered as email marketer')
    }

    // Just insert into email_marketers table with pending status
    // The email marketer will need to sign up themselves using the signup page
    const { error: insertError } = await supabase
      .from('email_marketers')
      .insert({
        email,
        name,
        phone,
        status: 'pending' // Will be approved by admin after they sign up
      })

    if (insertError) {
      console.error('Insert error:', insertError);
      throw insertError;
    }
    
    console.log('✅ Email marketer record created:', email);
  } catch (error) {
    console.error('Error creating email marketer:', error)
    throw error
  }
}

export const updateEmailMarketerStatus = async (
  emailMarketerId: string,
  status: 'pending' | 'approved' | 'rejected'
): Promise<void> => {
  try {
    const { error } = await supabase
      .from('email_marketers')
      .update({ status })
      .eq('email_marketer_id', emailMarketerId)

    if (error) throw error
  } catch (error) {
    console.error('Error updating email marketer status:', error)
    throw error
  }
}

export const deleteEmailMarketer = async (emailMarketerId: string): Promise<void> => {
  try {
    // Get email marketer email first
    const { data: emailMarketer, error: fetchError } = await supabase
      .from('email_marketers')
      .select('email')
      .eq('email_marketer_id', emailMarketerId)
      .single()

    if (fetchError) throw fetchError
    if (!emailMarketer) throw new Error('Email marketer not found')

    // Delete from email_marketers table (this will cascade to related records)
    const { error: deleteError } = await supabase
      .from('email_marketers')
      .delete()
      .eq('email_marketer_id', emailMarketerId)

    if (deleteError) throw deleteError

    // Note: Supabase auth user deletion requires admin API
    // For now, we just delete from our table
    // The auth user will remain but won't be able to access anything
  } catch (error) {
    console.error('Error deleting email marketer:', error)
    throw error
  }
}
