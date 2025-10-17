# Vercel KV Deployment Guide

## Overview
This guide explains how to deploy your application with Vercel KV storage instead of file-based storage.

## What Changed
- ✅ Replaced all file operations (`fs.readFileSync`, `fs.writeFileSync`) with Vercel KV operations
- ✅ Created `src/lib/kvStorage.js` with utility functions for all data operations
- ✅ Updated all API routes to use KV storage
- ✅ Updated email processor to use KV storage
- ✅ Added migration script to move existing data

## Files Modified
- `src/lib/kvStorage.js` - New KV storage utilities
- `src/app/api/emailQueue/route.js` - Updated to use KV
- `src/app/api/templates/route.js` - Updated to use KV
- `src/app/api/users/route.js` - Updated to use KV
- `src/app/api/queueStatus/route.js` - Updated to use KV
- `src/lib/emailProcessor.js` - Updated to use KV
- `src/lib/migrateToKV.js` - Migration script

## Deployment Steps

### 1. Set up Vercel KV
1. Go to your Vercel dashboard
2. Navigate to your project
3. Go to **Storage** tab
4. Click **Create Database** → **KV**
5. Name it `dentalscout-kv` (or any name you prefer)
6. Note the connection details

### 2. Environment Variables
Add these environment variables in Vercel dashboard:

```bash
# Existing environment variables (keep these)
GMAIL_APP_PASSWORD=your_16_character_app_password
GMAIL_APP_PASSWORD_2=your_16_character_app_password_2
GMAIL_APP_PASSWORD_3=your_16_character_app_password_3
GMAIL_APP_PASSWORD_4=your_16_character_app_password_4
GMAIL_APP_PASSWORD_5=your_16_character_app_password_5
GMAIL_APP_PASSWORD_6=your_16_character_app_password_6
GMAIL_APP_PASSWORD_7=your_16_character_app_password_7
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# New KV environment variables (Vercel will provide these)
KV_REST_API_URL=your_kv_rest_api_url
KV_REST_API_TOKEN=your_kv_rest_api_token
KV_REST_API_READ_ONLY_TOKEN=your_kv_read_only_token
```

### 3. Deploy to Vercel
```bash
# Commit your changes
git add .
git commit -m "Migrate to Vercel KV storage"
git push origin your-branch-name

# Deploy to Vercel
vercel --prod
```

### 4. Test the Deployment
1. Go to your deployed URL
2. Try creating a template
3. Try adding emails to the queue
4. Check that bulk email operations work
5. Verify no 500 errors occur

## Data Migration
If you have existing data in your JSON files, you can migrate it:

1. **Local Migration** (before deployment):
   ```bash
   node src/lib/migrateToKV.js
   ```

2. **Production Migration** (after deployment):
   - The migration will happen automatically when the app starts
   - Existing data will be moved from files to KV storage

## Troubleshooting

### Common Issues

1. **KV Connection Error**
   - Check that KV environment variables are set correctly
   - Verify KV database is created in Vercel dashboard

2. **Data Not Found**
   - Run the migration script to move existing data
   - Check KV storage in Vercel dashboard

3. **500 Errors**
   - Check Vercel function logs
   - Verify all environment variables are set
   - Ensure KV database is accessible

### Testing Locally
```bash
# Test KV connection
node test-kv.js

# Run development server
npm run dev
```

## Benefits of KV Storage
- ✅ **Serverless Compatible**: Works with Vercel's serverless functions
- ✅ **Scalable**: No file system limitations
- ✅ **Reliable**: Built-in redundancy and backup
- ✅ **Fast**: Optimized for key-value operations
- ✅ **Secure**: Encrypted at rest and in transit

## Rollback Plan
If you need to rollback:
1. Revert to the previous commit with file-based storage
2. Redeploy to Vercel
3. Your data will still be in the JSON files

## Support
If you encounter issues:
1. Check Vercel function logs
2. Verify KV database status in Vercel dashboard
3. Test KV connection with the test script
4. Check environment variables are set correctly
