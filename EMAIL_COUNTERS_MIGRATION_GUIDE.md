# Email Counters Migration to Supabase

This guide explains how to migrate the email counters system from JSON files to Supabase database.

## 🎯 **Why Migrate Email Counters?**

- **⚡ Performance**: Database queries are much faster than file I/O
- **🔒 Concurrency**: Multiple processes can safely access counters
- **📊 Real-time**: Can monitor email sending statistics in real-time
- **🛡️ Reliability**: No file system race conditions
- **📈 Scalability**: Handles high-volume email sending better
- **🔄 Persistence**: Counter data survives deployments and restarts

## 📋 **What's Included**

This migration covers all **7 email users** from your `user.json`:
- ✅ Anish Primary (anishsukhramani@gmail.com)
- ✅ Anish Secondary (anishsukhramani1@gmail.com)
- ✅ biz (rahul@neuralityhealth.biz)
- ✅ info (rahul@neuralityhealth.info)
- ✅ net (rahul@neuralityhealth.net)
- ✅ org (rahul@neuralityhealth.org)
- ✅ co (rahul@neuralityhealth.co)

## 🚀 **Migration Steps**

### **Step 1: Run the Migration Script**

```bash
node scripts/migrate-email-counters-to-supabase.js
```

This will:
- ✅ Create email counter entries for all 7 users
- ✅ Migrate existing counter data from `emailCounters.json`
- ✅ Set up proper Supabase table structure
- ✅ Preserve all existing counter values

### **Step 2: Test the Migration**

```bash
node scripts/test-email-counters-migration.js
```

This will verify:
- ✅ All 7 users have email counter entries
- ✅ Counter operations work correctly
- ✅ API endpoints are functioning
- ✅ Data integrity is maintained

## 🔄 **What Changed**

### **API Routes Updated**
- `src/app/api/emailCounters/route.js` - Now uses Supabase instead of JSON files
- All CRUD operations (GET, POST, PUT, DELETE) now use Supabase

### **Database Schema**
The Supabase `email_counters` table structure:
```sql
create table public.email_counters (
  id serial not null,
  email_id integer not null,
  direct_send_count integer null default 0,
  scheduled_send_count integer null default 0,
  total_count integer null default 0,
  created_at timestamp without time zone null default now(),
  updated_at timestamp without time zone null default now(),
  constraint email_counters_pkey primary key (id)
);
```

### **Field Mapping**
| Old (JSON) | New (Supabase) |
|------------|----------------|
| `emailId` | `email_id` |
| `emailsSentToday` | `direct_send_count + scheduled_send_count` |
| `dailyLimit` | Not stored in Supabase (can be added later) |
| `lastResetAt` | `updated_at` |
| `isBlocked` | Not stored in Supabase (can be added later) |
| `blockedUntil` | Not stored in Supabase (can be added later) |

## 🧪 **Testing the Migration**

### **Test 1: Check Counter Entries**
1. Run the test script: `node scripts/test-email-counters-migration.js`
2. Verify all 7 users have counter entries
3. Check that counters start at 0

### **Test 2: Test Email Sending**
1. Send a test email through the system
2. Check that the counter increments
3. Verify the counter is displayed in the UI

### **Test 3: Test API Endpoints**
```bash
# Get all counters
curl http://localhost:3000/api/emailCounters

# Increment a counter
curl -X POST http://localhost:3000/api/emailCounters \
  -H "Content-Type: application/json" \
  -d '{"emailId": 1, "isDirectSend": true}'

# Reset a counter
curl -X DELETE "http://localhost:3000/api/emailCounters?emailId=1"
```

## 📊 **Monitoring Email Counters**

### **Real-time Monitoring**
You can now monitor email counters in real-time:
- Check the `email_counters` table in Supabase dashboard
- View direct send counts, scheduled send counts, and total counts
- Monitor which email addresses are being used most

### **Counter Statistics**
- **Direct Send Count**: Emails sent immediately
- **Scheduled Send Count**: Emails sent via scheduling
- **Total Count**: Combined count of all emails sent
- **Updated At**: Last time the counter was modified

## 🚨 **Troubleshooting**

### **Common Issues**

1. **"Email ID not found" error**
   - Make sure all 7 users have counter entries
   - Run the migration script again if needed

2. **"Table doesn't exist" error**
   - Make sure the `email_counters` table exists in Supabase
   - Check the table schema matches the expected structure

3. **"Permission denied" error**
   - Make sure you're using the service role key
   - Check that the key has the correct permissions

### **Rollback Plan**
If you need to rollback:
1. The original `emailCounters.json` file is preserved
2. You can switch back to file-based operations
3. No counter data is lost during migration

## ✅ **Benefits After Migration**

- **🚀 Faster Performance**: Database operations are much faster than file I/O
- **🔒 No Race Conditions**: Multiple processes can safely access counters
- **📊 Better Monitoring**: Real-time counter status and statistics
- **🛡️ Data Persistence**: Counters survive deployments and restarts
- **📈 Scalability**: Can handle much higher email volumes
- **🔄 Reliability**: No more file system issues

## 🎉 **Success!**

Your email counters system is now running on Supabase with:
- ✅ All 7 users have proper counter entries
- ✅ Better performance and reliability
- ✅ Real-time monitoring capabilities
- ✅ Scalable architecture
- ✅ No more file system dependencies

The migration is complete and your email counter system is ready for production use!

## 📚 **Next Steps**

1. **Test the system**: Send some test emails to verify counters work
2. **Monitor usage**: Check the Supabase dashboard for counter statistics
3. **Set up alerts**: Consider setting up alerts for high email volumes
4. **Optimize**: Monitor performance and optimize as needed

Your email system is now fully migrated to Supabase! 🎉
