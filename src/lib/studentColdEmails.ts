import { supabase } from './supabase'

export interface ApplicationWithColdEmail {
    application_id: string
    has_cold_email: boolean
    cold_email_info?: {
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
        const { count, error } = await supabase
            .from('application_contacts')
            .select('id', { count: 'exact', head: true })
            .eq('job_applications.user_id', userId)
            .not('contact_id', 'is', null)

        if (error) {
            // Try alternative query
            const { data: apps } = await supabase
                .from('job_applications')
                .select('application_id')
                .eq('user_id', userId)

            if (!apps) return 0

            const appIds = apps.map(a => a.application_id)

            const { count: altCount } = await supabase
                .from('application_contacts')
                .select('id', { count: 'exact', head: true })
                .in('application_id', appIds)

            return altCount || 0
        }

        return count || 0
    } catch (error) {
        console.error('Error getting cold email count:', error)
        return 0
    }
}

// Get cold email info for specific applications
export const getColdEmailsForApplications = async (
    applicationIds: string[]
): Promise<Map<string, ApplicationWithColdEmail['cold_email_info']>> => {
    try {
        if (applicationIds.length === 0) return new Map()

        const { data, error } = await supabase
            .from('application_contacts')
            .select(`
        application_id,
        created_at,
        notes,
        has_responded,
        responded_at,
        company_contacts(
          email,
          role,
          companies(company_name)
        )
      `)
            .in('application_id', applicationIds)

        if (error) throw error

        const map = new Map<string, ApplicationWithColdEmail['cold_email_info']>()

        data?.forEach((item: any) => {
            if (item.company_contacts) {
                const contact = item.company_contacts
                const companyName = contact.companies?.company_name || 'Unknown Company'

                map.set(item.application_id, {
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

        return map
    } catch (error) {
        console.error('Error fetching cold emails:', error)
        return new Map()
    }
}
