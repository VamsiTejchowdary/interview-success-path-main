import { supabase } from './supabase'

export interface StudentWithApplications {
  user_id: string
  first_name: string
  last_name: string
  email: string
  recruiter_id: string
  recruiter_name?: string
  total_applications: number
  last_activity: string
  status: string
}

export interface CompanyContactData {
  contact_id: string
  company_id: string
  company_name?: string
  email: string
  role?: string
  created_at: string
  updated_at: string
}

export interface ApplicationWithContacts {
  application_id: string
  job_title: string
  company_name: string
  job_link?: string
  status: string
  applied_at: string
  contacts: CompanyContactData[]
}

export const getActiveStudents = async (): Promise<StudentWithApplications[]> => {
  try {
    const { data: students, error: studentsError } = await supabase
      .from('users')
      .select(`
        user_id,
        first_name,
        last_name,
        email,
        recruiter_id,
        status,
        created_at,
        recruiters(name)
      `)
      .in('status', ['approved', 'on_hold'])
      .order('created_at', { ascending: false })

    if (studentsError) throw studentsError

    const studentsWithCounts = await Promise.all(
      (students || []).map(async (student) => {
        const { data: applications } = await supabase
          .from('job_applications')
          .select('application_id, applied_at')
          .eq('user_id', student.user_id)
          .order('applied_at', { ascending: false })

        const lastActivity = applications && applications.length > 0
          ? applications[0].applied_at
          : student.created_at || new Date().toISOString()

        const recruiterName = student.recruiters && Array.isArray(student.recruiters) && student.recruiters.length > 0
          ? student.recruiters[0].name
          : null

        return {
          user_id: student.user_id,
          first_name: student.first_name,
          last_name: student.last_name,
          email: student.email,
          recruiter_id: student.recruiter_id,
          recruiter_name: recruiterName,
          total_applications: applications?.length || 0,
          last_activity: lastActivity,
          status: student.status
        }
      })
    )

    return studentsWithCounts
  } catch (error) {
    console.error('Error fetching active students:', error)
    throw error
  }
}

export const getStudentApplications = async (userId: string): Promise<ApplicationWithContacts[]> => {
  try {
    const { data: applications, error: appsError } = await supabase
      .from('job_applications')
      .select('application_id, job_title, company_name, job_link, status, applied_at')
      .eq('user_id', userId)
      .order('applied_at', { ascending: false })

    if (appsError) throw appsError

    const applicationsWithContacts = await Promise.all(
      (applications || []).map(async (app) => {
        const { data: appContacts } = await supabase
          .from('application_contacts')
          .select(`
            contact_id,
            company_contacts(
              contact_id,
              company_id,
              email,
              role,
              created_at,
              updated_at,
              companies(company_name)
            )
          `)
          .eq('application_id', app.application_id)

        const contacts = (appContacts || []).map((ac: any) => {
          const contact = ac.company_contacts
          const companyName = contact.companies && Array.isArray(contact.companies) && contact.companies.length > 0
            ? contact.companies[0].company_name
            : contact.companies?.company_name
          
          return {
            contact_id: contact.contact_id,
            company_id: contact.company_id,
            company_name: companyName,
            email: contact.email,
            role: contact.role,
            created_at: contact.created_at,
            updated_at: contact.updated_at
          }
        })

        return {
          ...app,
          contacts
        }
      })
    )

    return applicationsWithContacts
  } catch (error) {
    console.error('Error fetching student applications:', error)
    throw error
  }
}

export const getAllCompanyContacts = async (): Promise<CompanyContactData[]> => {
  try {
    const { data, error } = await supabase
      .from('company_contacts')
      .select(`
        contact_id,
        company_id,
        email,
        role,
        created_at,
        updated_at,
        companies(company_name)
      `)
      .order('created_at', { ascending: false })

    if (error) throw error

    return (data || []).map((contact: any) => {
      const companyName = contact.companies && Array.isArray(contact.companies) && contact.companies.length > 0
        ? contact.companies[0].company_name
        : contact.companies?.company_name
      
      return {
        contact_id: contact.contact_id,
        company_id: contact.company_id,
        company_name: companyName,
        email: contact.email,
        role: contact.role,
        created_at: contact.created_at,
        updated_at: contact.updated_at
      }
    })
  } catch (error) {
    console.error('Error fetching company contacts:', error)
    throw error
  }
}

export const searchCompanyContacts = async (query: string): Promise<CompanyContactData[]> => {
  try {
    const { data, error } = await supabase
      .from('company_contacts')
      .select(`
        contact_id,
        company_id,
        email,
        role,
        created_at,
        updated_at,
        companies(company_name)
      `)
      .or(`email.ilike.%${query}%,companies.company_name.ilike.%${query}%`)
      .order('created_at', { ascending: false })

    if (error) throw error

    return (data || []).map((contact: any) => {
      const companyName = contact.companies && Array.isArray(contact.companies) && contact.companies.length > 0
        ? contact.companies[0].company_name
        : contact.companies?.company_name
      
      return {
        contact_id: contact.contact_id,
        company_id: contact.company_id,
        company_name: companyName,
        email: contact.email,
        role: contact.role,
        created_at: contact.created_at,
        updated_at: contact.updated_at
      }
    })
  } catch (error) {
    console.error('Error searching company contacts:', error)
    throw error
  }
}

export const getOrCreateCompany = async (companyName: string) => {
  try {
    const { data: existing, error: searchError } = await supabase
      .from('companies')
      .select('*')
      .ilike('company_name', companyName)
      .single()

    if (searchError && searchError.code !== 'PGRST116') {
      throw searchError
    }

    if (existing) {
      return existing
    }

    const { data, error } = await supabase
      .from('companies')
      .insert({ company_name: companyName })
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error getting or creating company:', error)
    throw error
  }
}

export const createCompanyContact = async (
  companyId: string,
  email: string,
  role?: string
) => {
  try {
    const { data, error } = await supabase
      .from('company_contacts')
      .insert({
        company_id: companyId,
        email,
        role
      })
      .select(`
        contact_id,
        company_id,
        email,
        role,
        created_at,
        updated_at,
        companies(company_name)
      `)
      .single()

    if (error) throw error

    const companyName = data.companies && Array.isArray(data.companies) && data.companies.length > 0
      ? (data.companies[0] as any).company_name
      : (data.companies as any)?.company_name

    return {
      contact_id: data.contact_id,
      company_id: data.company_id,
      company_name: companyName,
      email: data.email,
      role: data.role,
      created_at: data.created_at,
      updated_at: data.updated_at
    }
  } catch (error) {
    console.error('Error creating company contact:', error)
    throw error
  }
}

export const linkContactToApplication = async (
  applicationId: string,
  contactId: string,
  emailMarketerId: string,
  notes?: string
): Promise<void> => {
  try {
    const { error } = await supabase
      .from('application_contacts')
      .insert({
        application_id: applicationId,
        contact_id: contactId,
        added_by: emailMarketerId,
        notes
      })

    if (error) throw error
  } catch (error) {
    console.error('Error linking contact to application:', error)
    throw error
  }
}

export const unlinkContactFromApplication = async (
  applicationId: string,
  contactId: string
): Promise<void> => {
  try {
    const { error } = await supabase
      .from('application_contacts')
      .delete()
      .eq('application_id', applicationId)
      .eq('contact_id', contactId)

    if (error) throw error
  } catch (error) {
    console.error('Error unlinking contact from application:', error)
    throw error
  }
}

export const updateCompanyContact = async (
  contactId: string,
  updates: { email?: string; role?: string }
): Promise<void> => {
  try {
    const { error } = await supabase
      .from('company_contacts')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('contact_id', contactId)

    if (error) throw error
  } catch (error) {
    console.error('Error updating company contact:', error)
    throw error
  }
}

export const deleteCompanyContact = async (contactId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('company_contacts')
      .delete()
      .eq('contact_id', contactId)

    if (error) throw error
  } catch (error) {
    console.error('Error deleting company contact:', error)
    throw error
  }
}
