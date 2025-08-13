# Quick Google Sheets Setup for Agentic Call Export

This guide will help you set up a single Google Sheet for Agentic Call exports with the format: Name | Email | Phone No.

## 📋 What You'll Get

- **Single Google Sheet** that accumulates all exports
- **Format**: Column A = Name, Column B = Email, Column C = Phone No.
- **Append Mode**: New entries are added to the next available row
- **No Overwriting**: Existing data is preserved

## 🚀 Quick Setup (5 minutes)

### Step 1: Create Google Sheet
1. Go to [Google Sheets](https://sheets.google.com)
2. Create new spreadsheet
3. Name it "Agentic Call Data"
4. Set up headers in Row 1:
   - **A1**: `Name`
   - **B1**: `Email`
   - **C1**: `Phone No.`
5. Copy the Spreadsheet ID from URL (between `/d/` and `/edit`)

### Step 2: Google Cloud Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create new project or select existing
3. Enable Google Sheets API:
   - APIs & Services > Library
   - Search "Google Sheets API"
   - Click "Enable"

### Step 3: Create Service Account
1. APIs & Services > Credentials
2. Create Credentials > Service Account
3. Name: `dental-scout-sheets`
4. Skip role assignment
5. Click "Done"

### Step 4: Download Key
1. Click on your service account
2. Keys tab > Add Key > Create new key
3. JSON format > Download

### Step 5: Share Sheet
1. In your Google Sheet, click "Share"
2. Add service account email (from JSON file)
3. Give "Editor" permissions
4. Click "Send"

### Step 6: Environment Variables
Add to `.env.local`:
```bash
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_PROJECT_ID=your-project-id
GOOGLE_SPREADSHEET_ID=your-spreadsheet-id-here
```

### Step 7: Test
1. Restart dev server
2. Go to Agentic Call
3. Select practices
4. Click "Export to Google Sheet"
5. Check your Google Sheet!

## 📊 Data Format

The export will add entries in this format:
- **Column A**: Practice Name (or Owner Name, or Contact Name)
- **Column B**: Email Address
- **Column C**: Phone Number

## 🔄 How It Works

1. **First Export**: Adds data starting from Row 2 (after headers)
2. **Subsequent Exports**: Finds the next empty row and adds data there
3. **No Duplicates**: Each export adds new rows, never overwrites

## 🐛 Troubleshooting

**"Permission denied"**: Make sure you shared the sheet with the service account email
**"Invalid credentials"**: Check your environment variables
**"Spreadsheet not found"**: Verify the spreadsheet ID is correct

## 📞 Need Help?

1. Check browser console for error messages
2. Verify all environment variables are set
3. Make sure the Google Sheet is shared with the service account
4. Restart your development server after adding environment variables
