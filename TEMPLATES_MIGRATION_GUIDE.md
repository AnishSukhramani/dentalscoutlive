# Templates Migration to Supabase

This guide explains how to migrate templates from the JSON file system to Supabase database.

## Overview

The templates system has been migrated from using local JSON files to Supabase database. The `email_templates` table in Supabase stores all template data with the following structure:

```sql
create table public.email_templates (
  id text not null,
  name text not null,
  subject text not null,
  body text not null,
  created_at timestamp without time zone null default now(),
  updated_at timestamp without time zone null default now(),
  constraint email_templates_pkey primary key (id)
);
```

## Migration Steps

### 1. Run the Migration Script

To migrate existing templates from `data/templates.json` to Supabase:

```bash
node scripts/migrate-templates-to-supabase.js
```

This script will:
- Read the existing templates from `data/templates.json`
- Check for existing templates in Supabase
- Migrate all templates to the `email_templates` table
- Preserve original IDs, timestamps, and all template data

### 2. Test the Migration

After running the migration, test the API endpoints:

```bash
node scripts/test-templates-api.js
```

This will verify that:
- Templates can be fetched from Supabase
- New templates can be created
- Templates can be updated
- Templates can be deleted

### 3. Update API Routes

The following API routes have been updated to use Supabase:

- `GET /api/templates` - Fetch all templates
- `POST /api/templates` - Create a new template
- `PUT /api/templates/[id]` - Update a template
- `DELETE /api/templates` - Delete a template

## API Changes

### Before (JSON File)
```javascript
// Old implementation used file system
const templatesData = readTemplates();
```

### After (Supabase)
```javascript
// New implementation uses Supabase
const { data: templates, error } = await supabase
  .from('email_templates')
  .select('*')
  .order('created_at', { ascending: false });
```

## Data Structure Changes

### JSON File Structure (Old)
```json
{
  "templates": [
    {
      "id": "1754573500096",
      "name": "Template Name",
      "subject": "Email Subject",
      "body": "Email Body",
      "createdAt": "2025-08-07T13:31:40.096Z",
      "updatedAt": "2025-08-20T05:14:56.604Z"
    }
  ]
}
```

### Supabase Structure (New)
```sql
-- Database table structure
id: text (primary key)
name: text
subject: text
body: text
created_at: timestamp
updated_at: timestamp
```

## Benefits of Migration

1. **Scalability**: Database can handle larger datasets efficiently
2. **Concurrency**: Multiple users can access templates simultaneously
3. **Backup**: Automatic database backups
4. **Querying**: Advanced filtering and sorting capabilities
5. **Consistency**: ACID compliance for data integrity

## Rollback Plan

If you need to rollback to JSON files:

1. Export templates from Supabase:
```sql
SELECT * FROM email_templates ORDER BY created_at;
```

2. Convert to JSON format and save to `data/templates.json`

3. Revert API routes to use file system

## Environment Variables Required

Make sure these environment variables are set in `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Troubleshooting

### Common Issues

1. **Missing Environment Variables**
   - Ensure Supabase credentials are properly set
   - Check `.env.local` file exists

2. **Database Connection Issues**
   - Verify Supabase project is active
   - Check network connectivity

3. **Migration Errors**
   - Check if templates already exist in Supabase
   - Verify table structure matches expected schema

### Verification Commands

```bash
# Check if Supabase connection works
node -e "console.log(process.env.NEXT_PUBLIC_SUPABASE_URL)"

# Test database connection
node scripts/test-templates-api.js
```

## Next Steps

After successful migration:

1. Remove the old `data/templates.json` file
2. Update any frontend components that reference the old structure
3. Test all template-related functionality
4. Monitor for any issues in production
