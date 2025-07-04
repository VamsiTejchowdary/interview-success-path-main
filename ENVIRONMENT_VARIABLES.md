# Environment Variables

This document explains all the environment variables required for this project.

## Required Environment Variables

### Supabase Configuration
- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous key

### Admin Configuration
- `VITE_ADMIN_KEY`: Secret key required for admin registration

### Authentication Redirect URL
- `VITE_AUTH_REDIRECT_URL`: Your production domain URL (e.g., `https://yourdomain.com`)
  - Used for email verification and password reset links
  - If not set, defaults to the current domain (`window.location.origin`)
  - **Important**: Set this to your actual domain in production to avoid localhost links

### File Storage (Optional)
- `VITE_BLOB_READ_WRITE_TOKEN`: Vercel Blob storage token for resume uploads



## Example .env file

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_ADMIN_KEY=your-secret-admin-key
VITE_AUTH_REDIRECT_URL=https://yourdomain.com
VITE_BLOB_READ_WRITE_TOKEN=your-vercel-blob-token


```

## Production Deployment

When deploying to production:

1. Set `VITE_AUTH_REDIRECT_URL` to your actual domain
2. Ensure all other environment variables are properly configured
3. The auth callback route `/auth/callback` will handle email verification redirects

## Development vs Production

- **Development**: You can leave `VITE_AUTH_REDIRECT_URL` empty to use localhost
- **Production**: Always set `VITE_AUTH_REDIRECT_URL` to your domain 