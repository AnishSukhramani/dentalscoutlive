# Supabase Migration Guide

## Overview
This guide will help you migrate your email system from JSON files to Supabase, which will fix the Vercel deployment issues.

## Step 1: Create Supabase Tables

Run these SQL commands in your Supabase SQL editor:

```sql
-- Email Queue Table
CREATE TABLE email_queue (
  id TEXT PRIMARY KEY,
  recipient_email TEXT NOT NULL,
  recipient_name TEXT,
  template_id TEXT NOT NULL,
  sender_email TEXT NOT NULL,
  sender_name TEXT,
  sender_password TEXT,
  send_mode TEXT NOT NULL,
  scheduled_date TIMESTAMP,
  email_count INTEGER DEFAULT 0,
  entry_data JSONB,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW(),
  processed_at TIMESTAMP,
  message TEXT
);

-- Email Templates Table
CREATE TABLE email_templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Email Processing Stats Table
CREATE TABLE email_processing_stats (
  id SERIAL PRIMARY KEY,
  total_processed INTEGER DEFAULT 0,
  total_failed INTEGER DEFAULT 0,
  last_processing_time TIMESTAMP,
  session_processed INTEGER DEFAULT 0,
  session_failed INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Scheduled Emails Table
CREATE TABLE scheduled_emails (
  id TEXT PRIMARY KEY,
  email_data JSONB NOT NULL,
  scheduled_date TIMESTAMP NOT NULL,
  status TEXT DEFAULT 'scheduled',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Email Counters Table
CREATE TABLE email_counters (
  id SERIAL PRIMARY KEY,
  email_id INTEGER NOT NULL,
  direct_send_count INTEGER DEFAULT 0,
  scheduled_send_count INTEGER DEFAULT 0,
  total_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Email Users Table (for sender configurations)
CREATE TABLE email_users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Step 2: Set Up Environment Variables

Add these environment variables to your Vercel dashboard:

```
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
GMAIL_APP_PASSWORD=your_16_character_app_password
GMAIL_APP_PASSWORD_2=your_second_app_password
GMAIL_APP_PASSWORD_3=your_third_app_password
GMAIL_APP_PASSWORD_4=your_fourth_app_password
GMAIL_APP_PASSWORD_5=your_fifth_app_password
GMAIL_APP_PASSWORD_6=your_sixth_app_password
GMAIL_APP_PASSWORD_7=your_seventh_app_password
NEXT_PUBLIC_BASE_URL=https://your-vercel-app.vercel.app
```

## Step 3: Run Migration Script

1. Install dependencies if not already done:
```bash
npm install @supabase/supabase-js
```

2. Run the migration script:
```bash
node migrate-to-supabase.js
```

This will migrate your existing JSON data to the new Supabase tables.

## Step 4: Test the Migration

1. Deploy to Vercel
2. Test creating email queue entries
3. Test processing emails
4. Check that data persists between deployments

## Step 5: Clean Up (Optional)

Once everything is working, you can:
- Remove the `data/` directory from your project
- Remove the migration script
- Update your documentation

## Troubleshooting

### Common Issues:

1. **"SUPABASE_SERVICE_ROLE_KEY not found"**
   - Make sure you've added the service role key to your Vercel environment variables
   - The service role key is different from the anon key

2. **"Table doesn't exist"**
   - Make sure you've run the SQL commands in your Supabase SQL editor
   - Check that the table names match exactly

3. **"Permission denied"**
   - Make sure you're using the service role key, not the anon key
   - The service role key has full database access

4. **"Environment variables not found"**
   - Make sure all environment variables are set in Vercel
   - Redeploy after adding new environment variables

## Benefits of This Migration

✅ **Fixes Vercel deployment issues** - No more file system errors
✅ **Data persistence** - Data survives deployments and restarts
✅ **Better performance** - Database queries are faster than file operations
✅ **Scalability** - Can handle more concurrent users
✅ **Backup & recovery** - Supabase handles backups automatically
✅ **Real-time updates** - Can add real-time features later

## Next Steps

After successful migration:
1. Monitor your Vercel logs for any remaining errors
2. Test all email functionality thoroughly
3. Consider adding real-time features using Supabase subscriptions
4. Set up monitoring and alerts for email processing
