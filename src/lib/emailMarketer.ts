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
  name?: string
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
      .eq('status', 'approved')
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
              name,
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
            name: contact.name,
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

export interface CompanyWithContacts {
  company_id: string
  company_name: string
  created_at: string
  contacts: CompanyContactData[]
  contact_count: number
}

export const getAllCompanyContacts = async (): Promise<CompanyContactData[]> => {
  try {
    const { data, error } = await supabase
      .from('company_contacts')
      .select(`
        contact_id,
        company_id,
        name,
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
        name: contact.name,
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

// Get companies with their contacts grouped
export const getCompaniesWithContacts = async (page: number = 1, pageSize: number = 10): Promise<{
  companies: CompanyWithContacts[]
  total: number
  totalPages: number
}> => {
  try {
    // Get total count
    const { count, error: countError } = await supabase
      .from('companies')
      .select('*', { count: 'exact', head: true })

    if (countError) throw countError

    // Get paginated companies
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('company_id, company_name, created_at')
      .order('company_name')
      .range(from, to)

    if (companiesError) throw companiesError

    // Get contacts for each company
    const companiesWithContacts = await Promise.all(
      (companies || []).map(async (company) => {
        const { data: contacts, error: contactsError } = await supabase
          .from('company_contacts')
          .select('contact_id, company_id, name, email, role, created_at, updated_at')
          .eq('company_id', company.company_id)
          .order('created_at', { ascending: false })

        if (contactsError) {
          console.error('Error fetching contacts for company:', contactsError)
          return {
            ...company,
            contacts: [],
            contact_count: 0
          }
        }

        return {
          ...company,
          contacts: contacts || [],
          contact_count: contacts?.length || 0
        }
      })
    )

    return {
      companies: companiesWithContacts,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / pageSize)
    }
  } catch (error) {
    console.error('Error fetching companies with contacts:', error)
    throw error
  }
}

// Search companies with their contacts (searches entire DB)
export const searchCompaniesWithContacts = async (query: string): Promise<{
  companies: CompanyWithContacts[]
  total: number
}> => {
  try {
    if (!query || query.trim().length === 0) {
      return { companies: [], total: 0 }
    }

    const searchTerm = `%${query}%`

    // Search companies by name
    const { data: companiesByName, error: companiesError } = await supabase
      .from('companies')
      .select('company_id, company_name, created_at')
      .ilike('company_name', searchTerm)
      .order('company_name')

    if (companiesError) throw companiesError

    // Search contacts by name, email, or role
    const { data: contactMatches, error: contactsError } = await supabase
      .from('company_contacts')
      .select('company_id')
      .or(`name.ilike.${searchTerm},email.ilike.${searchTerm},role.ilike.${searchTerm}`)

    if (contactsError) throw contactsError

    // Get unique company IDs from contact matches
    const companyIdsFromContacts = [...new Set((contactMatches || []).map(c => c.company_id))]

    // Get companies that weren't already found by name search
    const existingCompanyIds = new Set((companiesByName || []).map(c => c.company_id))
    const additionalCompanyIds = companyIdsFromContacts.filter(id => !existingCompanyIds.has(id))

    let additionalCompanies: any[] = []
    if (additionalCompanyIds.length > 0) {
      const { data, error } = await supabase
        .from('companies')
        .select('company_id, company_name, created_at')
        .in('company_id', additionalCompanyIds)
        .order('company_name')

      if (error) throw error
      additionalCompanies = data || []
    }

    // Combine all companies
    const allCompanies = [...(companiesByName || []), ...additionalCompanies]

    // Get contacts for each company
    const companiesWithContacts = await Promise.all(
      allCompanies.map(async (company) => {
        const { data: contacts, error: contactsError } = await supabase
          .from('company_contacts')
          .select('contact_id, company_id, name, email, role, created_at, updated_at')
          .eq('company_id', company.company_id)
          .order('created_at', { ascending: false })

        if (contactsError) {
          console.error('Error fetching contacts for company:', contactsError)
          return {
            ...company,
            contacts: [],
            contact_count: 0
          }
        }

        return {
          ...company,
          contacts: contacts || [],
          contact_count: contacts?.length || 0
        }
      })
    )

    return {
      companies: companiesWithContacts,
      total: companiesWithContacts.length
    }
  } catch (error) {
    console.error('Error searching companies with contacts:', error)
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
        name,
        email,
        role,
        created_at,
        updated_at,
        companies(company_name)
      `)
      .or(`name.ilike.%${query}%,email.ilike.%${query}%,companies.company_name.ilike.%${query}%`)
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
        name: contact.name,
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

// Search companies by name (case-insensitive, returns matches)
export const searchCompanies = async (query: string) => {
  try {
    if (!query || query.trim().length === 0) {
      return []
    }

    const { data, error } = await supabase
      .from('companies')
      .select('company_id, company_name, created_at')
      .ilike('company_name', `%${query}%`)
      .order('company_name')
      .limit(10)

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error searching companies:', error)
    throw error
  }
}

// Check if company exists (exact match, case-insensitive)
export const checkCompanyExists = async (companyName: string) => {
  try {
    const normalizedName = companyName.trim().toLowerCase()

    const { data, error } = await supabase
      .from('companies')
      .select('company_id, company_name')
      .ilike('company_name', normalizedName)
      .single()

    if (error && error.code !== 'PGRST116') {
      throw error
    }

    return data || null
  } catch (error) {
    console.error('Error checking company:', error)
    throw error
  }
}

// Create a new company
export const createCompany = async (companyName: string) => {
  try {
    // Normalize: trim and capitalize first letter of each word
    const normalized = companyName
      .trim()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')

    const { data, error } = await supabase
      .from('companies')
      .insert({ company_name: normalized })
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error creating company:', error)
    throw error
  }
}

// Get or create company (legacy function, kept for compatibility)
export const getOrCreateCompany = async (companyName: string) => {
  try {
    const existing = await checkCompanyExists(companyName)
    if (existing) {
      return existing
    }
    return await createCompany(companyName)
  } catch (error) {
    console.error('Error getting or creating company:', error)
    throw error
  }
}

export const createCompanyContact = async (
  companyId: string,
  email: string,
  name?: string,
  role?: string
) => {
  try {
    const { data, error } = await supabase
      .from('company_contacts')
      .insert({
        company_id: companyId,
        name,
        email,
        role
      })
      .select(`
        contact_id,
        company_id,
        name,
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
      name: data.name,
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

// Get detailed applications for a student with contacts
export interface DetailedApplication {
  application_id: string
  job_title: string
  company_name: string
  job_link: string | null
  status: string
  applied_at: string
  user_id: string
  resume_url: string | null
  recruiter_name: string | null
  has_contact: boolean
  contact_info?: {
    contact_id: string
    name: string | null
    email: string
    role: string | null
    company_name: string
    notes: string | null
    added_at: string
    has_responded: boolean
    responded_at: string | null
  }
}

export const getStudentDetailedApplications = async (userId: string): Promise<DetailedApplication[]> => {
  try {
    // Get user info with recruiter
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('user_id, recruiter_id, recruiters(name)')
      .eq('user_id', userId)
      .single()

    if (userError) throw userError

    const recruiterName = user.recruiters && Array.isArray(user.recruiters) && user.recruiters.length > 0
      ? user.recruiters[0].name
      : null

    // Get all applications with resume info
    const { data: applications, error: appsError } = await supabase
      .from('job_applications')
      .select('application_id, job_title, company_name, job_link, status, applied_at, user_id, resume_id, resumes(storage_key)')
      .eq('user_id', userId)
      .order('applied_at', { ascending: false })

    if (appsError) throw appsError

    // Get contacts for each application
    const detailedApps = await Promise.all(
      (applications || []).map(async (app: any) => {
        const { data: appContact, error: contactError } = await supabase
          .from('application_contacts')
          .select(`
            contact_id,
            notes,
            created_at,
            has_responded,
            responded_at,
            company_contacts(
              contact_id,
              name,
              email,
              role,
              companies(company_name)
            )
          `)
          .eq('application_id', app.application_id)
          .single()

        if (contactError && contactError.code !== 'PGRST116') {
          console.error('Error fetching contact:', contactError)
        }

        let contactInfo = undefined
        if (appContact && appContact.company_contacts) {
          const contact: any = appContact.company_contacts
          const companyName = contact.companies && Array.isArray(contact.companies) && contact.companies.length > 0
            ? contact.companies[0].company_name
            : contact.companies?.company_name

          contactInfo = {
            contact_id: contact.contact_id,
            name: contact.name,
            email: contact.email,
            role: contact.role,
            company_name: companyName,
            notes: appContact.notes,
            added_at: appContact.created_at,
            has_responded: appContact.has_responded || false,
            responded_at: appContact.responded_at || null
          }
        }

        // Get resume storage_key from the resumes table via resume_id
        const resumeStorageKey = app.resumes && Array.isArray(app.resumes) && app.resumes.length > 0
          ? app.resumes[0].storage_key
          : app.resumes?.storage_key

        return {
          application_id: app.application_id,
          job_title: app.job_title,
          company_name: app.company_name,
          job_link: app.job_link,
          status: app.status,
          applied_at: app.applied_at,
          user_id: app.user_id,
          resume_url: resumeStorageKey || null,
          recruiter_name: recruiterName,
          has_contact: !!contactInfo,
          contact_info: contactInfo
        }
      })
    )

    return detailedApps
  } catch (error) {
    console.error('Error fetching detailed applications:', error)
    throw error
  }
}

// Update application contact notes
export const updateApplicationContactNotes = async (
  applicationId: string,
  contactId: string,
  notes: string
): Promise<void> => {
  try {
    const { error } = await supabase
      .from('application_contacts')
      .update({ notes })
      .eq('application_id', applicationId)
      .eq('contact_id', contactId)

    if (error) throw error
  } catch (error) {
    console.error('Error updating notes:', error)
    throw error
  }
}

// Update application contact email (change the contact)
export const updateApplicationContact = async (
  applicationId: string,
  oldContactId: string,
  newContactId: string,
  notes?: string
): Promise<void> => {
  try {
    // Delete old link
    await unlinkContactFromApplication(applicationId, oldContactId)

    // Get email marketer ID from session
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data: emailMarketer } = await supabase
      .from('email_marketers')
      .select('email_marketer_id')
      .eq('email', user.email)
      .single()

    if (!emailMarketer) throw new Error('Email marketer not found')

    // Create new link
    await linkContactToApplication(applicationId, newContactId, emailMarketer.email_marketer_id, notes)
  } catch (error) {
    console.error('Error updating application contact:', error)
    throw error
  }
}

export const updateCompanyContact = async (
  contactId: string,
  updates: { name?: string; email?: string; role?: string }
): Promise<CompanyContactData> => {
  try {
    const { data, error } = await supabase
      .from('company_contacts')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('contact_id', contactId)
      .select(`
        contact_id,
        company_id,
        name,
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
      name: data.name,
      email: data.email,
      role: data.role,
      created_at: data.created_at,
      updated_at: data.updated_at
    }
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

// Update application contact response status
export const updateApplicationContactResponse = async (
  applicationId: string,
  contactId: string,
  hasResponded: boolean,
  respondedAt: string | null
): Promise<void> => {
  try {
    const { error } = await supabase
      .from('application_contacts')
      .update({
        has_responded: hasResponded,
        responded_at: respondedAt
      })
      .eq('application_id', applicationId)
      .eq('contact_id', contactId)

    if (error) throw error
  } catch (error) {
    console.error('Error updating response status:', error)
    throw error
  }
}
