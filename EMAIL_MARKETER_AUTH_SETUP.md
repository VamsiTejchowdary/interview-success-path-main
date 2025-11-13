# Email Marketer Supabase Auth Integration

## ✅ What Changed

### 1. **Admin Creates Email Marketer Record**
- Admin enters: name, email, phone (optional)
- System creates record in `email_marketers` table with `status: 'pending'`
- Admin gets a signup link to send to the email marketer
- **No Supabase Auth user created yet**

### 2. **Email Marketer Signs Up**
- Email marketer receives signup link from admin
- Goes to `/email-marketer/signup`
- Enters their email (must match admin's entry) and creates password
- System validates email is pre-authorized
- Creates Supabase Auth user
- **Verification email sent automatically** by Supabase

### 3. **Email Verification**
- Email marketer receives verification email
- Clicks verification link
- Email is verified in Supabase Auth
- Status remains 'pending' until admin approves

### 4. **Admin Approval**
- Admin sees email marketers with 'pending' status
- After email verification, admin clicks "Approve"
- Status changes to 'approved'
- Email marketer can now log in

### 5. **Login Flow**
- Email marketer goes to login page
- Uses their email + password (set during signup)
- System checks:
  - Valid Supabase Auth credentials
  - Email marketer exists in database
  - Status is 'approved'
- If all checks pass → redirect to Email Marketer Dashboard

### 6. **Forgot Password**
- Email marketer clicks "Forgot Password"
- Enters email
- Receives password reset email from Supabase
- Sets new password
- Can log in with new password

## 📁 Files Updated

### `src/lib/admin.ts`
- `createEmailMarketer()` - Creates record in database only
- Removed password parameter (user sets during signup)
- No Supabase Auth user created (user creates during signup)

### `src/lib/emailMarketerAuth.ts`
- `loginEmailMarketer()` - Now uses Supabase Auth
- `getEmailMarketerSession()` - Now async, checks Supabase session
- `logoutEmailMarketer()` - Now uses Supabase signOut
- `isEmailMarketerLoggedIn()` - Now async

### `src/components/dashboards/admin/AdminEmailMarketersTab.tsx`
- Shows signup link with copy button
- Added "Awaiting email verification" indicator
- Added "Approve" button for pending status
- Added "Suspend" button for approved status

### `src/pages/EmailMarketerSignup.tsx` (NEW)
- Email marketer signup page
- Validates email is pre-authorized by admin
- Creates Supabase Auth user
- Sends verification email

### `src/components/auth/ForgotPasswordDialog.tsx`
- Added email_marketers table to email existence check
- Now supports password reset for email marketers

### `src/pages/Index.tsx`
- Updated to handle async email marketer login
- Better error messages for email verification

### `scripts/02-email-marketer-tables.sql`
- Added auto-approve trigger function (optional)
- Can be used if you have superuser access to auth.users table

## 🚀 Setup Instructions

### 1. Run SQL Migration
```sql
-- Run in Supabase SQL Editor
-- File: scripts/02-email-marketer-tables.sql
```

### 2. Configure Supabase Email Templates (Optional)
Go to: Authentication → Email Templates
- Customize "Confirm signup" template
- Customize "Reset password" template

### 3. Test the Flow

#### Step 1: Admin Creates Email Marketer
1. Login as admin
2. Go to "Email Marketers" tab
3. Click "Add Email Marketer"
4. Enter: name, email, phone
5. Click "Create Account"
6. Copy the signup link
7. ✅ Email marketer record created

#### Step 2: Send Signup Link
1. Admin sends signup link to email marketer
2. Link: `https://yoursite.com/email-marketer/signup`

#### Step 3: Email Marketer Signs Up
1. Email marketer clicks signup link
2. Enters their email (must match admin's entry)
3. Creates a password
4. Clicks "Complete Registration"
5. ✅ Verification email sent

#### Step 4: Email Verification
1. Email marketer checks email inbox
2. Clicks verification link
3. ✅ Email verified

#### Step 5: Admin Approval
1. Admin sees "pending" status in dashboard
2. Admin clicks "Approve"
3. ✅ Status changes to "approved"

#### Step 6: Email Marketer Login
1. Go to login page
2. Enter email + password (set during signup)
3. ✅ Redirected to Email Marketer Dashboard

#### Optional: Password Reset
1. Click "Forgot Password" on login page
2. Enter email
3. Check email for reset link
4. Set new password
5. Login with new password

## 🔒 Security Benefits

✅ **Email Verification Required** - No fake emails
✅ **Supabase Auth** - Industry-standard security
✅ **Password Reset Flow** - Users control their passwords
✅ **Admin Approval** - Double verification (email + admin)
✅ **No Hardcoded Passwords** - Each user sets their own

## 📝 Notes

- **Pending Status**: Email marketers start as 'pending' after creation
- **Email Verification**: Required before they can be approved
- **Admin Approval**: Required before they can log in
- **Password**: Users set their own via "Forgot Password" flow
- **RLS Disabled**: For development (enable in production if needed)

## 🐛 Troubleshooting

### "Email not verified" error
- User needs to click verification link in email
- Check spam folder
- Resend verification email from Supabase dashboard

### "Invalid credentials" error
- User needs to set password via "Forgot Password"
- Or use the password they set during verification

### "Not approved" error
- Admin needs to approve the email marketer
- Check status in Admin Dashboard → Email Marketers tab

## 🎯 Production Checklist

- [ ] Enable RLS policies (if needed)
- [ ] Customize email templates in Supabase
- [ ] Set up custom email domain (optional)
- [ ] Test email delivery
- [ ] Document password policy for users
- [ ] Set up email rate limiting (if needed)
