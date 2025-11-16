# Company Contacts Name Field Migration

## Summary
Added a `name` field to the `company_contacts` table to store contact person names. This allows email marketers to track not just emails and roles, but also the actual names of HR/hiring managers.

## Changes Made

### 1. Database Migration
**File:** `scripts/03-add-name-to-company-contacts.sql`

Run this SQL in your Supabase SQL Editor:
```sql
ALTER TABLE public.company_contacts 
ADD COLUMN IF NOT EXISTS name TEXT;

CREATE INDEX IF NOT EXISTS idx_company_contacts_name ON public.company_contacts(name);
```

### 2. Backend Updates

**File:** `src/lib/emailMarketer.ts`
- Updated `CompanyContactData` interface to include optional `name` field
- Updated `DetailedApplication` contact_info to include `name`
- Modified `createCompanyContact()` to accept `name` parameter
- Modified `updateCompanyContact()` to accept `name` in updates
- Updated all SELECT queries to include `name` field
- Updated `searchCompanyContacts()` to search by name as well

**File:** `src/lib/studentColdEmails.ts`
- Updated `ApplicationWithColdEmail` interface to include `name` field
- Modified `getColdEmailsForApplications()` to fetch `name` from company_contacts
- Name is now included in cold email data returned to student dashboard

### 3. UI Updates

#### CompanyContactsTab.tsx
- Added `contactName` state for creating contacts
- Added `editName` state for editing contacts
- Added name input field in "Add Contact" dialog
- Added name input field in "Edit Contact" dialog
- Display contact name prominently in contact cards (with User icon)
- Updated search to include name field
- Name is displayed above email with indigo color for better visibility

#### ColdEmailDialog.tsx
- Updated contact fetching to include `name` field
- Display contact name in contact selection list
- Display contact name in confirmation step
- Name shown with User icon and highlighted styling

#### StudentApplicationsPage.tsx (Email Marketer Dashboard)
- Display contact name in "Cold Email Sent To" card
- Name appears first with emerald User icon
- Shows above email for better visibility
- Maintains consistent styling with other components

#### ApplicationsTab.tsx (Student Dashboard)
- Display contact name in "Cold Email Sent" card
- Name shown with "Name:" label in emerald-700 bold text
- Appears first before email and role
- Updated interface and data fetching to include name field

## How to Use

### 1. Run the Migration
Execute the SQL migration in Supabase:
```bash
# Copy the contents of scripts/03-add-name-to-company-contacts.sql
# and run it in Supabase SQL Editor
```

### 2. Adding Contacts with Names
When adding a new contact:
1. Search/select company
2. Enter contact name (optional)
3. Enter email (required)
4. Enter role (optional)

### 3. Updating Existing Contacts
1. Click Edit button on any contact
2. Update the name field
3. Save changes

### 4. Viewing Contacts
- Contact names are displayed prominently with a User icon
- Names appear above emails in the contact list
- Search now includes names for easier finding

## Field Details

- **Field Name:** `name`
- **Type:** TEXT
- **Required:** No (optional)
- **Indexed:** Yes (for search performance)

## Visual Design

Contact information is displayed with color-coded icons for easy identification:

- **Name:** 👤 User icon in **emerald** (`text-emerald-400`)
- **Email:** ✉️ Mail icon in **indigo** (`text-indigo-400`)
- **Role:** 💼 Briefcase icon in **amber** (`text-amber-400`)

This consistent color scheme is applied across:
- Company Contacts Tab
- Cold Email Dialog
- Student Applications Page

## Benefits

1. **Better Contact Management:** Track actual person names, not just emails
2. **Improved Search:** Find contacts by name
3. **Professional Display:** Show full contact information in cards
4. **Enhanced UX:** More context when selecting contacts for cold emails

## Testing Checklist

- [ ] Run SQL migration in Supabase
- [ ] Add new contact with name
- [ ] Add new contact without name (should still work)
- [ ] Edit existing contact to add name
- [ ] Search contacts by name
- [ ] View contact in cold email dialog
- [ ] Verify name displays in all contact cards
