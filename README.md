# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/c7e42f91-a226-4ace-8b68-d56ae831e100

## Supabase Setup

This project uses Supabase for authentication and database management. To set up Supabase:

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Run the SQL script in `scripts/01-create-tables.sql` in your Supabase SQL editor
3. Create a `.env` file in the root directory with the following variables:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_ADMIN_KEY=your_admin_key_here
VITE_AUTH_REDIRECT_URL=https://yourdomain.com
VITE_BLOB_READ_WRITE_TOKEN=your_vercel_blob_token
```

You can find these values in your Supabase project settings under API.

**Important**: For production deployment, make sure to set `VITE_AUTH_REDIRECT_URL` to your actual domain (e.g., `https://yourdomain.com`) to ensure email verification and password reset links work correctly.

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/c7e42f91-a226-4ace-8b68-d56ae831e100) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/c7e42f91-a226-4ace-8b68-d56ae831e100) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)
