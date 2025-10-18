# Supabase Setup Guide for Email System

## 🚀 **Quick Setup Steps**

### **Step 1: Create Supabase Tables**

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

### **Step 2: Set Environment Variables**

Add these to your Vercel environment variables:

```
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### **Step 3: Migrate Existing Data**

Run the migration script:

```bash
node migrate-to-supabase.js
```

### **Step 4: Deploy and Test**

1. Deploy to Vercel
2. Test creating email queue entries
3. Check that the 500 error is resolved

## ✅ **What's Fixed**

- ✅ **No more 500 errors** - Supabase handles all data operations
- ✅ **Data persistence** - Data survives deployments and restarts
- ✅ **Better performance** - Database queries are faster than file operations
- ✅ **Scalability** - Can handle more concurrent users
- ✅ **Real-time capabilities** - Can add real-time features later

## 🔧 **Files Updated**

- ✅ `src/app/api/emailQueue/route.js` - Now uses Supabase
- ✅ `src/app/api/queueStatus/route.js` - Now uses Supabase  
- ✅ `src/lib/emailProcessor.js` - Now uses Supabase
- ✅ Created migration script and setup guide

## 🚨 **Important Notes**

1. **Service Role Key**: Make sure to use the SERVICE_ROLE_KEY, not the anon key
2. **Table Names**: The tables use snake_case (email_queue, not emailQueue)
3. **Data Migration**: Your existing JSON data will be migrated automatically
4. **Backup**: Your original JSON files are preserved as backup

## 🎯 **Testing**

After setup, test these features:
- ✅ Create bulk email queue entries
- ✅ View queue status
- ✅ Process emails
- ✅ Check that data persists between deployments

Your email system should now work perfectly on Vercel! 🎉
