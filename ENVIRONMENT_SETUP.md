# Environment Setup Guide

This guide explains how to set up multiple environments (development, staging, production) for your project.

## 🏗️ **Environment Structure**

### **Development Environment**
- **Purpose**: Local development and testing
- **Database**: Separate Supabase project
- **Domain**: `http://localhost:4242`

### **Production Environment** 
- **Purpose**: Live application
- **Database**: Current Supabase project
- **Domain**: `https://interview-success-path-main.vercel.app`

## 📁 **Environment Files**

### **Development (.env.development)**
```env
VITE_SUPABASE_URL=https://your-dev-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-dev-anon-key
VITE_ADMIN_KEY=your-dev-admin-key
VITE_AUTH_REDIRECT_URL=http://localhost:4242
VITE_BLOB_READ_WRITE_TOKEN=your-dev-vercel-blob-token
```

### **Production (.env.production)**
```env
VITE_SUPABASE_URL=https://gwbpayznfyxisfrcfiky.supabase.co
VITE_SUPABASE_ANON_KEY=your-production-anon-key
VITE_ADMIN_KEY=your-production-admin-key
VITE_AUTH_REDIRECT_URL=https://interview-success-path-main.vercel.app
VITE_BLOB_READ_WRITE_TOKEN=your-production-vercel-blob-token
```

## 🚀 **Setup Steps**

### **1. Create Development Supabase Project**
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Click "New Project"
3. Name: `interview-success-path-dev`
4. Set database password
5. Choose region
6. Create project

### **2. Set Up Database Schema**
1. Go to SQL Editor in new project
2. Run the script from `scripts/01-create-tables.sql`
3. This creates all required tables

### **3. Configure Supabase Settings**
1. Go to Authentication → URL Configuration
2. Set Site URL: `http://localhost:4242`
3. Add Redirect URLs:
   - `http://localhost:4242/auth/callback`
   - `http://localhost:4242/reset-password`

### **4. Get Environment Variables**
1. Go to Settings → API
2. Copy Project URL and Anon Key
3. Create admin key for development

### **5. Create Environment Files**
1. Create `.env.development` with dev values
2. Create `.env.production` with production values
3. Add both to `.gitignore`

## 🔄 **Switching Environments**

### **For Development:**
```bash
# Use development environment
npm run dev
# This will use .env.development
```

### **For Production Build:**
```bash
# Use production environment
npm run build
# This will use .env.production
```

## 📊 **Database Management**

### **Development Database**
- Safe to delete and recreate
- Use for testing new features
- Can be reset frequently

### **Production Database**
- Contains real user data
- Never delete or reset
- Always backup before changes

## 🛡️ **Security Best Practices**

1. **Never commit environment files** to git
2. **Use different admin keys** for each environment
3. **Regular backups** of production database
4. **Test all changes** in development first
5. **Use strong passwords** for all environments

## 🔧 **Vercel Environment Variables**

For production deployment, set these in Vercel:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_ADMIN_KEY`
- `VITE_AUTH_REDIRECT_URL`
- `VITE_BLOB_READ_WRITE_TOKEN` 