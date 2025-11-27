import { supabase } from './supabase'

export interface ApplicationWithColdEmail {
    application_id: string
    has_cold_email: boolean
    cold_email_info?: {
        name: string | null
        email: string
        role: string | null
        company_name: string
        added_at: string
        notes: string | null
        has_responded: boolean
        responded_at: string | null
    }
}

// Get cold email count for a user
export const getColdEmailCount = async (userId: string): Promise<number> => {
    try {
        // First get the user's application IDs
        const { data: apps, error: appsError } = await supabase
            .from('job_applications')
            .select('application_id')
            .eq('user_id', userId)

        if (appsError || !apps || apps.length === 0) {
            return 0
        }

        // For small number of apps, query directly
        if (apps.length <= 100) {
            const appIds = apps.map(a => a.application_id)
            const { count, error } = await supabase
                .from('application_contacts')
                .select('id', { count: 'exact', head: true })
                .in('application_id', appIds)

            if (error) {
                console.error('Error getting cold email count:', error)
                return 0
            }

            return count || 0
        }

        // For large number of apps, batch the queries
        const appIds = apps.map(a => a.application_id)
        const BATCH_SIZE = 100
        let totalCount = 0

        for (let i = 0; i < appIds.length; i += BATCH_SIZE) {
            const batch = appIds.slice(i, i + BATCH_SIZE)
            
            const { count, error } = await supabase
                .from('application_contacts')
                .select('id', { count: 'exact', head: true })
                .in('application_id', batch)

            if (error) {
                console.error('Error in batch count:', error)
                continue
            }

            totalCount += count || 0
        }

        return totalCount
    } catch (error) {
        console.error('Error getting cold email count:', error)
        return 0
    }
}

// Get cold email info for a user's applications
export const getColdEmailsForUser = async (
    userId: string
): Promise<Map<string, ApplicationWithColdEmail['cold_email_info']>> => {
    try {
        if (!userId) {
            console.log('getColdEmailsForUser: No user ID provided')
            return new Map()
        }

        console.log('getColdEmailsForUser: Fetching cold emails for user', userId)

        // First get the user's application IDs
        const { data: apps, error: appsError } = await supabase
            .from('job_applications')
            .select('application_id')
            .eq('user_id', userId)

        if (appsError || !apps || apps.length === 0) {
            console.log('getColdEmailsForUser: No applications found for user')
            return new Map()
        }

        const appIds = apps.map(a => a.application_id)
        console.log('getColdEmailsForUser: Found', appIds.length, 'applications')

        const map = new Map<string, ApplicationWithColdEmail['cold_email_info']>()

        // Batch requests to avoid URL length limits
        const BATCH_SIZE = 100

        for (let i = 0; i < appIds.length; i += BATCH_SIZE) {
            const batch = appIds.slice(i, i + BATCH_SIZE)
            
            const { data, error } = await supabase
                .from('application_contacts')
                .select(`
                    application_id,
                    created_at,
                    notes,
                    has_responded,
                    responded_at,
                    company_contacts!inner(
                        name,
                        email,
                        role,
                        companies!inner(company_name)
                    )
                `)
                .in('application_id', batch)

            if (error) {
                console.error('getColdEmailsForUser: Error in batch:', error)
                continue
            }

            data?.forEach((item: any) => {
                if (item.company_contacts) {
                    const contact = item.company_contacts
                    const companyName = contact.companies?.company_name || 'Unknown Company'

                    map.set(item.application_id, {
                        name: contact.name,
                        email: contact.email,
                        role: contact.role,
                        company_name: companyName,
                        added_at: item.created_at,
                        notes: item.notes,
                        has_responded: item.has_responded || false,
                        responded_at: item.responded_at || null
                    })
                } else {
                    console.warn('getColdEmailsForUser: Missing company_contacts for application', item.application_id)
                }
            })
        }

        console.log('getColdEmailsForUser: Returning', map.size, 'cold email records')
        return map
    } catch (error) {
        console.error('Error fetching cold emails:', error)
        return new Map()
    }
}

// Legacy function for backward compatibility - now just calls getColdEmailsForUser
// This is kept for any existing code that might be using it
export const getColdEmailsForApplications = async (
    applicationIds: string[]
): Promise<Map<string, ApplicationWithColdEmail['cold_email_info']>> => {
    console.warn('getColdEmailsForApplications is deprecated. Use getColdEmailsForUser instead.')

    // For backward compatibility, we'll still support this but it's not efficient
    // In practice, this should be replaced with getColdEmailsForUser
    try {
        if (applicationIds.length === 0) {
            return new Map()
        }

        // Batch requests to avoid URL length limits
        const BATCH_SIZE = 100
        const map = new Map<string, ApplicationWithColdEmail['cold_email_info']>()

        for (let i = 0; i < applicationIds.length; i += BATCH_SIZE) {
            const batch = applicationIds.slice(i, i + BATCH_SIZE)

            const { data, error } = await supabase
                .from('application_contacts')
                .select(`
                    application_id,
                    created_at,
                    notes,
                    has_responded,
                    responded_at,
                    company_contacts!inner(
                        name,
                        email,
                        role,
                        companies!inner(company_name)
                    )
                `)
                .in('application_id', batch)

            if (error) {
                console.error('getColdEmailsForApplications: Error in batch:', error)
                continue
            }

            data?.forEach((item: any) => {
                if (item.company_contacts) {
                    const contact = item.company_contacts
                    const companyName = contact.companies?.company_name || 'Unknown Company'

                    map.set(item.application_id, {
                        name: contact.name,
                        email: contact.email,
                        role: contact.role,
                        company_name: companyName,
                        added_at: item.created_at,
                        notes: item.notes,
                        has_responded: item.has_responded || false,
                        responded_at: item.responded_at || null
                    })
                }
            })
        }

        return map
    } catch (error) {
        console.error('Error in getColdEmailsForApplications:', error)
        return new Map()
    }
}
