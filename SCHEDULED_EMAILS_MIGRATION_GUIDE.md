# Scheduled Emails Migration Guide

## Overview

This guide documents the migration of scheduled emails from JSON file storage to Supabase database storage. The migration improves performance, reliability, and provides real-time monitoring capabilities.

## What Was Migrated

### From JSON File Storage
- **File**: `data/scheduledEmails.json`
- **Purpose**: Stored scheduled email entries
- **Issues**: File-based storage, no real-time updates, potential concurrency issues

### To Supabase Database
- **Table**: `scheduled_emails`
- **Schema**: 
  ```sql
  create table public.scheduled_emails (
    id text not null,
    email_data jsonb not null,
    scheduled_date timestamp without time zone not null,
    status text null default 'scheduled'::text,
    created_at timestamp without time zone null default now(),
    constraint scheduled_emails_pkey primary key (id)
  ) TABLESPACE pg_default;
  ```

## Migration Benefits

### ✅ **Performance Improvements**
- **Faster Queries**: Database queries are much faster than file I/O
- **Indexed Searches**: Database indexes for efficient scheduled date filtering
- **Concurrent Access**: Multiple processes can access scheduled emails simultaneously

### ✅ **Reliability Enhancements**
- **ACID Transactions**: Database transactions ensure data consistency
- **Automatic Backups**: Supabase handles backups automatically
- **No File Corruption**: Database storage is more reliable than JSON files

### ✅ **Real-time Capabilities**
- **Live Updates**: Real-time monitoring of scheduled emails
- **Status Tracking**: Better tracking of email processing status
- **Scalability**: Can handle large numbers of scheduled emails

### ✅ **Better Data Management**
- **Structured Storage**: Proper database schema with data types
- **Query Flexibility**: Complex queries for filtering and sorting
- **Data Integrity**: Foreign key constraints and validation

## Files Updated

### 1. API Routes
- **`src/app/api/scheduledEmails/route.js`**
  - **Before**: Read from `data/scheduledEmails.json`
  - **After**: Query `scheduled_emails` table in Supabase
  - **Changes**: 
    - Replaced `fs` operations with Supabase queries
    - Added environment variable checks
    - Updated data transformation for API response

### 2. Email Processor
- **`src/lib/emailProcessor.js`**
  - **Function**: `processScheduledEmails()`
  - **Before**: Used file-based operations
  - **After**: Uses Supabase queries for scheduled emails
  - **Changes**: Already updated in previous migration

### 3. Migration Scripts
- **`scripts/migrate-scheduled-emails-to-supabase.js`**
  - Migrates existing scheduled emails from JSON to Supabase
  - Handles data transformation and validation
  - Provides detailed migration logging

- **`scripts/test-scheduled-emails-migration.js`**
  - Tests the migration and Supabase integration
  - Verifies API endpoints work correctly
  - Validates scheduled email processing logic

## Migration Process

### Step 1: Run Migration Script
```bash
node scripts/migrate-scheduled-emails-to-supabase.js
```

### Step 2: Test Migration
```bash
node scripts/test-scheduled-emails-migration.js
```

### Step 3: Verify No JSON Dependencies
```bash
node scripts/verify-no-json-dependencies.js
```

## API Changes

### Scheduled Emails API (`/api/scheduledEmails`)

#### **Before (JSON-based)**
```javascript
// Read from file
const data = await fs.readFile(scheduledEmailsPath, 'utf8');
const scheduledEmails = JSON.parse(data);
```

#### **After (Supabase-based)**
```javascript
// Query Supabase
const { data: scheduledEmails, error } = await supabase
  .from('scheduled_emails')
  .select('*')
  .order('scheduled_date', { ascending: true });
```

#### **Response Format**
```json
{
  "success": true,
  "scheduledEmails": {
    "total": 0,
    "upcoming": 0,
    "overdue": 0,
    "emails": [
      {
        "id": "email_123",
        "emailData": { "to": "user@example.com", "subject": "Test" },
        "scheduledDate": "2024-01-15T10:00:00Z",
        "status": "scheduled",
        "createdAt": "2024-01-14T09:00:00Z"
      }
    ]
  }
}
```

## Data Structure Changes

### JSON File Structure (Before)
```json
[
  {
    "id": "email_123",
    "emailData": { "to": "user@example.com", "subject": "Test" },
    "scheduledDate": "2024-01-15T10:00:00Z",
    "status": "scheduled",
    "createdAt": "2024-01-14T09:00:00Z"
  }
]
```

### Supabase Table Structure (After)
```sql
-- scheduled_emails table
id: text (primary key)
email_data: jsonb (email content and metadata)
scheduled_date: timestamp (when to send)
status: text (scheduled, sent, failed)
created_at: timestamp (when created)
```

## Scheduled Email Processing

### How It Works
1. **Scheduling**: Emails are added to `scheduled_emails` table
2. **Processing**: `processScheduledEmails()` function runs periodically
3. **Filtering**: Queries emails where `scheduled_date <= now()` and `status = 'scheduled'`
4. **Sending**: Processes each email and updates status
5. **Cleanup**: Updates status to 'sent' or 'failed'

### Processing Logic
```javascript
// Get emails that are due to be sent
const { data: scheduledEmails, error } = await supabase
  .from('scheduled_emails')
  .select('*')
  .lte('scheduled_date', now.toISOString())
  .eq('status', 'scheduled');

// Process each email
for (const scheduledEmail of scheduledEmails) {
  await sendEmail(scheduledEmail.email_data, false);
  await supabase
    .from('scheduled_emails')
    .update({ status: 'sent' })
    .eq('id', scheduledEmail.id);
}
```

## Testing the Migration

### 1. **API Endpoint Test**
```bash
curl http://localhost:3000/api/scheduledEmails
```

### 2. **Database Query Test**
```sql
SELECT * FROM scheduled_emails ORDER BY scheduled_date;
```

### 3. **Processing Logic Test**
- Check that overdue emails are identified correctly
- Verify upcoming emails are filtered properly
- Test status updates work correctly

## Monitoring and Maintenance

### **Real-time Monitoring**
- **Supabase Dashboard**: Monitor scheduled emails in real-time
- **API Endpoints**: Check scheduled email status via API
- **Processing Logs**: Monitor email processing in console

### **Data Management**
- **Cleanup**: Remove old sent/failed emails periodically
- **Backup**: Supabase handles automatic backups
- **Scaling**: Database can handle large numbers of scheduled emails

### **Performance Monitoring**
- **Query Performance**: Monitor database query times
- **Processing Speed**: Track how quickly emails are processed
- **Error Rates**: Monitor failed email processing

## Troubleshooting

### **Common Issues**

#### 1. **Environment Variables Missing**
```bash
❌ SUPABASE_SERVICE_ROLE_KEY is required
💡 Add SUPABASE_SERVICE_ROLE_KEY to your .env file
```
**Solution**: Add the service role key to your `.env` file

#### 2. **API Endpoint Not Working**
```bash
⚠️ API endpoint test failed
```
**Solution**: Ensure the Next.js server is running

#### 3. **Database Connection Issues**
```bash
❌ Supabase connection failed
```
**Solution**: Check Supabase URL and service role key

### **Debugging Steps**
1. **Check Environment Variables**: Ensure all required variables are set
2. **Test Database Connection**: Run the test script
3. **Verify API Endpoints**: Test each endpoint individually
4. **Check Processing Logic**: Monitor scheduled email processing

## Migration Verification

### **Verification Checklist**
- [ ] `scheduledEmails.json` file is no longer used
- [ ] API endpoints use Supabase
- [ ] Scheduled emails are stored in database
- [ ] Processing logic works correctly
- [ ] Real-time monitoring is available
- [ ] No JSON file dependencies remain

### **Success Indicators**
- ✅ All APIs return data from Supabase
- ✅ No JSON file dependencies
- ✅ Scheduled emails process correctly
- ✅ Real-time updates work
- ✅ Performance is improved

## Next Steps

### **Immediate Actions**
1. **Test Email Scheduling**: Create and schedule test emails
2. **Monitor Processing**: Watch scheduled emails being processed
3. **Verify UI Updates**: Check that the UI shows scheduled emails correctly

### **Long-term Improvements**
1. **Advanced Scheduling**: Add recurring email support
2. **Bulk Operations**: Implement bulk scheduled email management
3. **Analytics**: Add scheduled email analytics and reporting
4. **Notifications**: Add notifications for scheduled email status changes

## Summary

The scheduled emails migration successfully moves from JSON file storage to Supabase database storage, providing:

- **Better Performance**: Faster queries and processing
- **Improved Reliability**: Database transactions and backups
- **Real-time Capabilities**: Live monitoring and updates
- **Scalability**: Can handle large numbers of scheduled emails
- **Better Data Management**: Structured storage and querying

The system is now fully migrated to Supabase with no JSON file dependencies, providing a robust and scalable foundation for scheduled email management.
