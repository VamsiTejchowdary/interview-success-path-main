# Supabase Setup Guide

This guide will help you set up Supabase authentication and database for the JobSmartly application.

## Step 1: Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click "New Project"
3. Choose your organization
4. Enter project details:
   - Name: `JobSmartly` (or your preferred name)
   - Database Password: Create a strong password
   - Region: Choose closest to your users
5. Click "Create new project"

## Step 2: Set Up Database Tables

1. In your Supabase dashboard, go to the SQL Editor
2. Copy the contents of `scripts/01-create-tables.sql`
3. Paste and run the SQL script
4. This will create the following tables:
   - `admins` - For platform administrators
   - `recruiters` - For recruitment agents
   - `users` - For students/JobSmartly
   - `job_applications` - For tracking job applications
   - `resumes` - For storing resume files

## Step 3: Configure Authentication

1. Go to Authentication > Settings in your Supabase dashboard
2. Under "Site URL", add your development URL: `http://localhost:5173`
3. Under "Redirect URLs", add: `http://localhost:5173`
4. Save the settings

## Step 4: Get API Keys

1. Go to Settings > API in your Supabase dashboard
2. Copy the following values:
   - **Project URL** (looks like: `https://your-project-id.supabase.co`)
   - **anon public** key (starts with `eyJ...`)

## Step 5: Set Environment Variables

1. Create a `.env` file in your project root
2. Add the following variables:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

Replace the values with your actual Supabase project URL and anon key.

## Step 6: Test the Setup

1. Start your development server: `npm run dev`
2. Open your browser to `http://localhost:5173`
3. Try creating a new account using the registration form
4. Try signing in with the created account

## Step 7: Create Admin User (Optional)

To create an admin user:

1. First register as a regular user
2. Go to your Supabase dashboard > Table Editor
3. Navigate to the `admins` table
4. Insert a new row with the email of the user you want to make admin
5. The user will now have admin access when they sign in

## Troubleshooting

### Common Issues:

1. **"Missing Supabase environment variables"**
   - Make sure your `.env` file exists and has the correct variable names
   - Restart your development server after adding environment variables

2. **"Invalid email or password"**
   - Check that the user exists in your Supabase auth users
   - Verify the user is in the correct table (admins, recruiters, or users)

3. **"Error getting user role"**
   - Ensure the user's email exists in one of the role tables
   - Check that the table names match exactly

4. **CORS errors**
   - Make sure your site URL is correctly set in Supabase Auth settings
   - Add your production domain to the redirect URLs when deploying

### Database Permissions

Make sure your Supabase Row Level Security (RLS) policies allow the necessary operations. You may need to enable RLS and create policies for your tables.

## Next Steps

Once authentication is working:

1. Test all user roles (admin, recruiter, user)
2. Set up file storage for resumes (if needed)
3. Configure email templates for verification
4. Set up production environment variables
5. Deploy your application

For more information, visit the [Supabase documentation](https://supabase.com/docs). 