# Email Queue Migration to Supabase

This guide explains how to migrate the email queue system from JSON files to Supabase database.

## 🎯 **Why Migrate?**

- **⚡ Performance**: Database queries are much faster than file I/O
- **🔒 Concurrency**: Multiple processes can safely access the queue
- **📊 Real-time**: Can monitor queue status in real-time
- **🛡️ Reliability**: No file system race conditions
- **📈 Scalability**: Handles high-volume operations better
- **🔄 Persistence**: Data survives deployments and restarts

## 📋 **Prerequisites**

1. **Supabase Project**: You need a Supabase project with the email queue tables
2. **Environment Variables**: Add the required environment variables
3. **Service Role Key**: Get the service role key from Supabase dashboard

## 🚀 **Migration Steps**

### **Step 1: Set Up Environment Variables**

Add these to your `.env` file:

```env
# Existing Supabase variables
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# New required variable for admin operations
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
```

**How to get the Service Role Key:**
1. Go to your Supabase dashboard
2. Navigate to Settings → API
3. Copy the "service_role" key (not the anon key)

### **Step 2: Create Supabase Tables**

Run this SQL in your Supabase SQL editor:

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

-- Scheduled Emails Table
CREATE TABLE scheduled_emails (
  id TEXT PRIMARY KEY,
  email_data JSONB NOT NULL,
  scheduled_date TIMESTAMP NOT NULL,
  status TEXT DEFAULT 'scheduled',
  created_at TIMESTAMP DEFAULT NOW()
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
```

### **Step 3: Run Migration Script**

```bash
node scripts/migrate-email-queue-to-supabase.js
```

This will:
- ✅ Migrate existing email queue entries
- ✅ Migrate scheduled emails
- ✅ Migrate processing statistics
- ✅ Preserve all data and relationships

### **Step 4: Test the Migration**

```bash
node scripts/test-email-queue-migration.js
```

This will verify:
- ✅ All tables are accessible
- ✅ Queue operations work correctly
- ✅ Data integrity is maintained

## 🔄 **What Changed**

### **API Routes Updated**
- `src/app/api/emailQueue/route.js` - Now uses Supabase instead of JSON files
- `src/lib/emailProcessor.js` - All queue operations now use Supabase

### **Field Name Changes**
The Supabase schema uses snake_case field names:

| Old (JSON) | New (Supabase) |
|------------|----------------|
| `recipientEmail` | `recipient_email` |
| `recipientName` | `recipient_name` |
| `templateId` | `template_id` |
| `senderEmail` | `sender_email` |
| `senderName` | `sender_name` |
| `senderPassword` | `sender_password` |
| `sendMode` | `send_mode` |
| `scheduledDate` | `scheduled_date` |
| `emailCount` | `email_count` |
| `entryData` | `entry_data` |
| `createdAt` | `created_at` |
| `processedAt` | `processed_at` |

## 🧪 **Testing the Migration**

### **Test 1: Bulk Email Sending**
1. Go to the Audience page
2. Select multiple practices
3. Choose a template and sender
4. Click "Bulk Send"
5. Verify emails are queued in Supabase

### **Test 2: Queue Processing**
1. Check the email queue in Supabase dashboard
2. Run the email processor
3. Verify emails are processed and removed from queue

### **Test 3: Scheduled Emails**
1. Schedule an email for future sending
2. Check the scheduled_emails table
3. Verify the email is processed at the scheduled time

## 📊 **Monitoring**

### **Queue Status**
- Check `email_queue` table for pending emails
- Monitor `email_processing_stats` for processing statistics
- View `scheduled_emails` for future emails

### **Real-time Monitoring**
You can now monitor the queue in real-time using Supabase's real-time features or by querying the database directly.

## 🚨 **Troubleshooting**

### **Common Issues**

1. **"supabaseKey is required" error**
   - Make sure `SUPABASE_SERVICE_ROLE_KEY` is set in your `.env` file
   - Use the service role key, not the anon key

2. **"Table doesn't exist" error**
   - Run the SQL commands to create the tables
   - Check table names match exactly

3. **"Permission denied" error**
   - Make sure you're using the service role key
   - Check that the key has the correct permissions

### **Rollback Plan**
If you need to rollback:
1. The original JSON files are preserved
2. You can switch back to file-based operations
3. No data is lost during migration

## ✅ **Benefits After Migration**

- **🚀 Faster Performance**: Database operations are much faster than file I/O
- **🔒 No Race Conditions**: Multiple processes can safely access the queue
- **📊 Better Monitoring**: Real-time queue status and statistics
- **🛡️ Data Persistence**: Queue survives deployments and restarts
- **📈 Scalability**: Can handle much higher email volumes
- **🔄 Reliability**: No more file system issues

## 🎉 **Success!**

Your email queue system is now running on Supabase with:
- ✅ Better performance
- ✅ Improved reliability
- ✅ Real-time monitoring
- ✅ Scalable architecture
- ✅ No more file system issues

The migration is complete and your email system is ready for production use!
